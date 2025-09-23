import { iceServers } from '@/config'
import {
  MessageType,
  WebRTCEventType,
  type ChatMessage,
  type FileTransfer,
  type MediaState,
  type Peer,
  type PeerConnection,
  type SignalMessage
} from '@/types/webrtc'

export class WebRTCService {
  private ws: WebSocket | null = null
  private localStream: MediaStream | null = null
  private audioStream: MediaStream | null = null
  private peers: Map<string, PeerConnection> = new Map()
  private signedData: any
  private clientId: string
  private roomId: string
  private mediaState: MediaState = {
    video: false,
    audio: false,
    screen: false,
    desktopAudio: false
  }
  private pingInterval: number | null = null
  private readonly PING_INTERVAL = 10000 // 10 seconds
  private wsUrl: string = ''
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000 // Initial delay of 1 second
  private maxReconnectDelay: number = 30000 // Maximum delay of 30 seconds
  private reconnectTimeout: number | null = null
  private isManuallyDisconnected: boolean = false

  // Event callbacks
  public onParticipantJoined?: (peer: Peer) => void
  public onParticipantLeft?: (peerId: string) => void
  public onRemoteStream?: (peerId: string, stream: MediaStream) => void
  public onChatMessage?: (message: ChatMessage) => void
  public onFileReceived?: (file: File) => void
  public onFileProgress?: (transfer: FileTransfer) => void
  public onMediaStateChanged?: (peerId: string, mediaState: MediaState) => void
  public onConnectionStateChanged?: (
    state: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  ) => void

  private fileTransfers: Map<string, FileTransfer> = new Map()
  private readonly CHUNK_SIZE = 16384 // 16KB chunks

  constructor(signedData: any) {
    this.clientId = signedData.userId
    this.roomId = signedData.roomId
    this.signedData = signedData
  }

  async connect(wsUrl: string): Promise<void> {
    this.wsUrl = wsUrl
    this.isManuallyDisconnected = false
    this.onConnectionStateChanged?.('connecting')

    return new Promise((resolve, reject) => {
      const query = new URLSearchParams(this.signedData)
      this.ws = new WebSocket(`${wsUrl}?${query.toString()}`)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.onConnectionStateChanged?.('connected')
        this.sendMessage({ type: MessageType.AllClients })
        // Start sending PING messages periodically
        this.startPing()
        resolve()
      }

      this.ws.onmessage = (event) => {
        // Handle multiple messages separated by newlines
        const messages = event.data.trim().split('\n')
        for (const messageData of messages) {
          if (messageData.trim()) {
            try {
              const message: SignalMessage = JSON.parse(messageData)
              this.handleSignalMessage(message)
            } catch (error) {
              console.error('Error parsing WebSocket message:', error, 'Raw data:', messageData)
            }
          }
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.onConnectionStateChanged?.('disconnected')
        reject(error)
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event)
        this.stopPing()

        // 如果不是手动断开连接，则尝试重连
        if (!this.isManuallyDisconnected) {
          this.onConnectionStateChanged?.('disconnected')
          this.attemptReconnect()
        } else {
          this.cleanup()
        }
      }
    })
  }

  private async handleSignalMessage(message: SignalMessage): Promise<void> {
    const { type, from, data } = message

    switch (type) {
      case MessageType.Join:
        if (from?.id !== this.clientId) {
          console.log('Peer joined:', from?.id)
          await this.handlePeerJoined(from!)
        }
        break

      case MessageType.Leave:
        console.log('Peer left:', from?.id)
        this.handlePeerLeft(from!)
        break

      case MessageType.Kick:
        window.location.href = '/'
        break

      case MessageType.AllClients:
        for (const client of data) {
          if (client.id !== this.clientId) {
            this.onParticipantJoined?.({
              id: client.id,
              name: client.name,
              avatar: client.avatar,
              mediaState: { video: false, audio: false, screen: false, desktopAudio: false }
            })

            // 如果是重连后收到的all-clients消息，需要重新建立连接
            if (this.reconnectAttempts > 0) {
              await this.handlePeerJoined(client)
            }
          }
        }
        break

      case MessageType.WebRTCEvent:
        switch (data.type) {
          case WebRTCEventType.Offer:
            console.log('Received offer from:', from?.id)
            await this.handleOffer(from!.id, data.data)
            break
          case WebRTCEventType.Answer:
            console.log('Received answer from:', from?.id)
            await this.handleAnswer(from!.id, data.data)
            break
          case WebRTCEventType.IceCandidate:
            console.log('Received ICE candidate from:', from?.id)
            await this.handleIceCandidate(from!.id, data.data)
            break
        }
    }
  }

  private async handlePeerJoined(peer: Peer): Promise<void> {
    if (this.peers.has(peer.id)) {
      return
    }
    const peerConnection = await this.createPeerConnection(peer.id)

    // Tracks are already added in createPeerConnection, no need to add again

    // Only create offer if this client's ID is lexicographically smaller
    // This prevents both peers from creating offers simultaneously
    if (this.clientId != peer.id) {
      const offer = await peerConnection.connection.createOffer()
      await peerConnection.connection.setLocalDescription(offer)

      this.sendMessage({
        type: MessageType.WebRTCEvent,
        to: { id: peer.id },
        data: {
          type: WebRTCEventType.Offer,
          data: offer
        }
      })
    }

    this.onParticipantJoined?.({
      id: peer.id,
      name: peer.name,
      avatar: peer.avatar,
      mediaState: { video: false, audio: false, screen: false, desktopAudio: false }
    })
    console.log('Peer joined:', peer.id, this.mediaState)
    this.broadcastMediaState()
  }

  private handlePeerLeft(peer: Peer): void {
    const pc = this.peers.get(peer.id)
    if (pc) {
      pc.connection.close()
      pc.dataChannel?.close()
      this.onParticipantLeft?.(peer.id)
      this.peers.delete(peer.id)
    }
  }

  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    let peerConnection = this.peers.get(peerId)

    if (!peerConnection) {
      peerConnection = await this.createPeerConnection(peerId)
    }

    // Check connection state before setting remote description
    if (
      peerConnection.connection.signalingState === 'stable' ||
      peerConnection.connection.signalingState === 'have-local-offer'
    ) {
      await peerConnection.connection.setRemoteDescription(offer)

      // Tracks are already added in createPeerConnection, no need to add again
      console.log(`Peer ${peerId} already has tracks from createPeerConnection`)

      const answer = await peerConnection.connection.createAnswer()
      await peerConnection.connection.setLocalDescription(answer)

      this.sendMessage({
        type: MessageType.WebRTCEvent,
        to: { id: peerId },
        data: {
          type: WebRTCEventType.Answer,
          data: answer
        }
      })
    } else {
      console.warn(
        `Cannot set remote description, connection state: ${peerConnection.connection.signalingState}`
      )
    }
  }

  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId)
    if (peer) {
      await peer.connection.setRemoteDescription(answer)
      console.log(`Peer ${peerId} already has answer from createPeerConnection`)
      // Check connection state before setting remote description
      // if (peer.connection.signalingState === 'have-local-offer') {
      //   await peer.connection.setRemoteDescription(answer)
      // } else {
      //   console.warn(
      //     `Cannot set remote answer, connection state: ${peer.connection.signalingState}`
      //   )
      // }
    } else {
      console.warn(`Peer ${peerId} not found`)
    }
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId)
    if (peer && candidate) {
      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate))

        // Only add ICE candidate if remote description is set
        // if (peer.connection.remoteDescription) {
        //   await peer.connection.addIceCandidate(new RTCIceCandidate(candidate))
        // } else {
        //   console.warn('Remote description not set yet, ignoring ICE candidate')
        // }
      } catch (error) {
        console.error('Error adding ICE candidate:', error)
      }
    }
  }

  private async createPeerConnection(peerId: string): Promise<PeerConnection> {
    // 添加更详细的RTC配置来优化音频质量
    const configuration: RTCConfiguration = {
      iceServers,
      // 添加ICE传输策略来优化连接
      iceCandidatePoolSize: 10
    }

    const connection = new RTCPeerConnection(configuration)

    // 配置音频编码参数以减少回音
    if (typeof connection.addTransceiver === 'function') {
      try {
        // 为音频添加transceiver并设置编码参数
        const audioTransceiver = connection.addTransceiver('audio', {
          direction: 'sendrecv'
        })

        // 获取发送编码参数并优化
        const audioSender = audioTransceiver.sender
        const audioParams = audioSender.getParameters()

        if (!audioParams.encodings) {
          audioParams.encodings = [{}]
        }

        // 设置音频编码参数来优化质量
        audioParams.encodings[0] = {
          ...audioParams.encodings[0],
          // 限制音频带宽以减少回音
          maxBitrate: 64000, // 64 kbps
          // 添加冗余以提高音频质量
          maxFramerate: 50
        }

        audioSender.setParameters(audioParams).catch((err) => {
          console.warn('Failed to set audio parameters:', err)
        })

        // 为视频添加transceiver
        connection.addTransceiver('video', {
          direction: 'sendrecv'
        })
      } catch (err) {
        console.warn('Failed to add transceivers:', err)
      }
    }

    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendMessage({
          type: MessageType.WebRTCEvent,
          to: { id: peerId },
          data: {
            type: WebRTCEventType.IceCandidate,
            data: event.candidate
          }
        })
      }
    }

    console.log('Creating peer connection for:', peerId)

    // Handle remote stream
    connection.ontrack = (event) => {
      const [remoteStream] = event.streams
      console.log('Received remote stream from:', peerId)
      this.onRemoteStream?.(peerId, remoteStream)

      const peer = this.peers.get(peerId)
      if (peer) {
        peer.remoteStream = remoteStream
      }
    }

    // Create data channel for the initiator
    const dataChannel = connection.createDataChannel('messages', {
      ordered: true
    })

    this.setupDataChannel(dataChannel, peerId)

    // Handle incoming data channels
    connection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, peerId)
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          // 为音频轨道添加额外的处理选项
          if (track.kind === 'audio' && 'applyConstraints' in track) {
            ;(track as MediaStreamTrack)
              .applyConstraints({
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              })
              .catch((err) => {
                console.warn('Failed to apply audio constraints:', err)
              })
          }

          // 音频轨道保持其当前的启用状态，不强制设置为 mediaState
          // 这样可以确保每个用户的音频状态独立管理

          connection.addTrack(track, this.localStream!)
        } catch (error) {
          console.error(`Failed to add ${track.kind} track to new peer ${peerId}:`, error)
        }
      })
    }

    const peerConnection: PeerConnection = {
      id: peerId,
      connection,
      dataChannel
    }

    this.peers.set(peerId, peerConnection)
    return peerConnection
  }

  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`Data channel opened with ${peerId}`)
    }

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleDataChannelMessage(data, peerId)
      } catch (error) {
        console.error('Error parsing data channel message:', error)
      }
    }

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with ${peerId}:`, error)
    }

    // Update peer's data channel reference
    const peer = this.peers.get(peerId)
    if (peer) {
      peer.dataChannel = dataChannel
    }
  }

  private handleDataChannelMessage(data: any, senderId: string): void {
    switch (data.type) {
      case 'chat':
        this.onChatMessage?.({
          id: data.id,
          senderId,
          senderName: data.senderName,
          content: data.content,
          timestamp: data.timestamp,
          type: 'text'
        })
        break

      case 'file-start':
        this.handleFileTransferStart(data, senderId)
        break

      case 'file-chunk':
        this.handleFileChunk(data, senderId)
        break

      case 'file-end':
        this.handleFileTransferEnd(data, senderId)
        break

      case 'media-state':
        console.log('Received media state update from:', senderId, data.mediaState)
        this.onMediaStateChanged?.(senderId, data.mediaState)
        break
    }
  }

  async startCamera(videoDeviceId?: string): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: false
      }
      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      const newVideoTrack = newStream.getVideoTracks()[0]
      if (!this.localStream) {
        this.localStream = new MediaStream()
      }
      // 移除旧 video track
      this.localStream.getVideoTracks().forEach((track) => {
        this.localStream!.removeTrack(track)
        track.stop()
      })
      // 添加新 video track
      this.localStream.addTrack(newVideoTrack)
      this.mediaState.video = true
      this.mediaState.screen = false
      this.broadcastMediaState()
      // 替换所有 peer 的 video track
      await this.replaceVideoTrack(newVideoTrack)
      return this.localStream
    } catch (error) {
      console.error('Error accessing camera:', error)
      throw error
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      const screenVideoTrack = screenStream.getVideoTracks()[0]
      if (!this.localStream) {
        this.localStream = new MediaStream()
      }
      // 移除旧 video track
      this.localStream.getVideoTracks().forEach((track) => {
        this.localStream!.removeTrack(track)
        track.stop()
      })
      // 添加屏幕共享 video track
      this.localStream.addTrack(screenVideoTrack)
      this.mediaState.screen = true
      this.mediaState.video = false
      this.mediaState.desktopAudio = true
      // 屏幕音频 track 处理
      if (!this.mediaState.audio) {
        screenStream.getAudioTracks().forEach((track) => (track.enabled = false))
      }
      this.broadcastMediaState()
      // 替换所有 peer 的 video track
      await this.replaceVideoTrack(screenVideoTrack)
      // 屏幕共享结束时回退
      screenVideoTrack.onended = () => {
        this.stopScreenShare()
      }
      return this.localStream
    } catch (error) {
      console.error('Error starting screen share:', error)
      throw error
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.localStream) {
      // 移除屏幕 video track
      this.localStream.getVideoTracks().forEach((track) => {
        this.localStream!.removeTrack(track)
        track.stop()
      })
      this.mediaState.screen = false
      this.mediaState.video = false
      this.broadcastMediaState()

      // 通知所有 peer 移除 video track
      await this.replaceVideoTrack(null)
    }
  }

  async toggleAudio(deviceId?: string): Promise<boolean> {
    if (!this.mediaState.audio) {
      // 启用音频
      if (!this.localStream) {
        this.localStream = new MediaStream()
      }

      // 检查是否已有音频轨道
      const existingAudioTrack = this.localStream.getAudioTracks()[0]

      if (existingAudioTrack) {
        // 如果已有音频轨道，启用它并通知所有 peer
        existingAudioTrack.enabled = true
        this.mediaState.audio = true
        // 重要：需要通知所有 peer 音频轨道已启用
        await this.replaceAudioTrack(existingAudioTrack)
      } else {
        // 如果没有音频轨道，创建新的
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        })
        const newAudioTrack = audioStream.getAudioTracks()[0]

        // 添加新 audio track
        this.localStream.addTrack(newAudioTrack)
        this.mediaState.audio = true

        // 替换所有 peer 的 audio track
        await this.replaceAudioTrack(newAudioTrack)
      }
    } else {
      // 关闭音频 - 只禁用 track，不移除
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((track) => {
          track.enabled = false
        })
      }
      this.mediaState.audio = false
    }

    this.broadcastMediaState()
    return this.mediaState.audio
  }

  // 替换所有 peer 的 audio track
  private async replaceAudioTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    const promises: Promise<void>[] = []
    this.peers.forEach((peer, peerId) => {
      const senders = peer.connection.getSenders()
      // 查找音频发送器，包括没有轨道的发送器
      const audioSender = senders.find((s) =>
        (s.track && s.track.kind === 'audio') ||
        (!s.track && s.dtmf === null) // 音频发送器通常有 dtmf 属性为 null
      )

      if (audioSender) {
        console.log(`Replacing audio track for peer ${peerId}, newTrack:`, newTrack)
        promises.push(
          audioSender.replaceTrack(newTrack).catch((error) => {
            console.error(`Failed to replace audio track for peer ${peerId}:`, error)
            return this.renegotiateConnection(peerId)
          })
        )
      } else {
        console.log(`No audio sender found for peer ${peerId}, renegotiating`)
        promises.push(this.renegotiateConnection(peerId))
      }
    })
    await Promise.all(promises)
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        this.mediaState.video = videoTrack.enabled
        this.broadcastMediaState()
        return videoTrack.enabled
      }
    }
    return false
  }

  async stopCamera(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.localStream?.removeTrack(track)
        track.stop()
      })
      this.mediaState.video = false
      this.mediaState.audio = false
      this.broadcastMediaState()

      // Renegotiate to remove camera tracks
      if (this.peers.size > 0) {
        console.log('Renegotiating connections after stopping camera')
        await this.renegotiateAllConnections()
      }
    }
  }

  sendChatMessage(content: string): void {
    const message = {
      type: 'chat',
      id: Date.now().toString(),
      senderName: `${this.clientId.slice(0, 8)}`,
      content,
      timestamp: Date.now()
    }

    this.broadcastToDataChannels(message)

    // Add to own chat
    this.onChatMessage?.({
      ...message,
      senderId: this.clientId,
      type: 'text'
    })
  }

  async sendFile(file: File): Promise<void> {
    const fileId = Date.now().toString()
    const chunks: ArrayBuffer[] = []

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()

    // Split into chunks
    for (let i = 0; i < arrayBuffer.byteLength; i += this.CHUNK_SIZE) {
      chunks.push(arrayBuffer.slice(i, i + this.CHUNK_SIZE))
    }

    const transfer: FileTransfer = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'transferring',
      chunks: [],
      totalChunks: chunks.length
    }

    // Send file start message
    this.broadcastToDataChannels({
      type: 'file-start',
      fileId,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      totalChunks: chunks.length
    })

    // Notify sender about the file being sent (for UI display)
    this.onFileProgress?.(transfer)

    // Send chunks
    for (let i = 0; i < chunks.length; i++) {
      this.broadcastToDataChannels({
        type: 'file-chunk',
        fileId,
        chunkIndex: i,
        data: Array.from(new Uint8Array(chunks[i]))
      })

      transfer.progress = ((i + 1) / chunks.length) * 100
      this.onFileProgress?.(transfer)

      // Small delay to prevent overwhelming
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    // Send file end message
    this.broadcastToDataChannels({
      type: 'file-end',
      fileId
    })

    transfer.status = 'completed'
    this.onFileProgress?.(transfer)
  }

  private handleFileTransferStart(data: any, senderId: string): void {
    const transfer: FileTransfer = {
      id: data.fileId,
      name: data.name,
      size: data.size,
      type: data.mimeType,
      progress: 0,
      status: 'transferring',
      chunks: new Array(data.totalChunks),
      totalChunks: data.totalChunks
    }

    this.fileTransfers.set(data.fileId, transfer)
    this.onFileProgress?.(transfer)
  }

  private handleFileChunk(data: any, senderId: string): void {
    const transfer = this.fileTransfers.get(data.fileId)
    if (transfer) {
      transfer.chunks[data.chunkIndex] = new Uint8Array(data.data).buffer
      transfer.progress = ((data.chunkIndex + 1) / transfer.totalChunks) * 100
      this.onFileProgress?.(transfer)
    }
  }

  private handleFileTransferEnd(data: any, senderId: string): void {
    const transfer = this.fileTransfers.get(data.fileId)
    if (transfer) {
      // Combine all chunks
      const combinedBuffer = new ArrayBuffer(transfer.size)
      const combinedView = new Uint8Array(combinedBuffer)
      let offset = 0

      for (const chunk of transfer.chunks) {
        if (chunk) {
          combinedView.set(new Uint8Array(chunk), offset)
          offset += chunk.byteLength
        }
      }

      // Create file blob
      const blob = new Blob([combinedBuffer], { type: transfer.type })
      const file = new File([blob], transfer.name, { type: transfer.type })

      transfer.status = 'completed'
      this.onFileProgress?.(transfer)
      this.onFileReceived?.(file)

      this.fileTransfers.delete(data.fileId)
    }
  }

  private broadcastMediaState(): void {
    this.broadcastToDataChannels({
      type: 'media-state',
      mediaState: this.mediaState
    })
  }

  private broadcastToDataChannels(data: any): void {
    const message = JSON.stringify(data)
    this.peers.forEach((peer) => {
      if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
        try {
          peer.dataChannel.send(message)
        } catch (error) {
          console.error(`Error sending to peer ${peer.id}:`, error)
        }
      }
    })
  }

  private async replaceVideoTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    console.log('Replacing video track for', this.peers.size, 'peers', newTrack ? 'with new track' : 'with null (removing)')

    const promises: Promise<void>[] = []

    this.peers.forEach((peer, peerId) => {
      const senders = peer.connection.getSenders()
      console.log(`Peer ${peerId} has ${senders.length} senders`)

      const videoSender = senders.find((s) => s.track && s.track.kind === 'video')

      if (videoSender) {
        console.log(`Replacing video track for peer ${peerId}`)
        promises.push(
          videoSender.replaceTrack(newTrack).catch((error) => {
            console.error(`Failed to replace track for peer ${peerId}:`, error)
            // If replaceTrack fails, try renegotiation
            return this.renegotiateConnection(peerId)
          })
        )
      } else if (newTrack) {
        // Only renegotiate if we're adding a new track
        console.log(`No video sender found for peer ${peerId}, need renegotiation`)
        promises.push(this.renegotiateConnection(peerId))
      }
    })

    await Promise.all(promises)
    console.log('Video track replacement completed')
  }

  private async renegotiateConnection(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId)
    if (!peer) {
      console.warn(`Peer ${peerId} not found for renegotiation`)
      return
    }

    try {
      console.log(`Starting renegotiation with peer ${peerId}`)

      // Remove all existing tracks
      const senders = peer.connection.getSenders()
      for (const sender of senders) {
        if (sender.track) {
          peer.connection.removeTrack(sender)
        }
      }

      // Add current tracks
      const currentStream = this.localStream
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          console.log(`Adding ${track.kind} track during renegotiation with peer ${peerId}`)
          // 确保音频轨道的初始状态与mediaState一致
          if (track.kind === 'audio') {
            track.enabled = this.mediaState.audio
          }
          peer.connection.addTrack(track, currentStream)
        })
      }

      // Create new offer
      const offer = await peer.connection.createOffer()
      await peer.connection.setLocalDescription(offer)

      // Send offer to peer
      this.sendMessage({
        type: MessageType.WebRTCEvent,
        to: { id: peerId },
        data: {
          type: WebRTCEventType.Offer,
          data: offer
        }
      })

      console.log(`Renegotiation offer sent to peer ${peerId}`)
    } catch (error) {
      console.error(`Failed to renegotiate with peer ${peerId}:`, error)
    }
  }

  private async renegotiateAllConnections(): Promise<void> {
    console.log('Starting renegotiation for all peers')
    const promises: Promise<void>[] = []

    this.peers.forEach((_, peerId) => {
      promises.push(this.renegotiateConnection(peerId))
    })

    await Promise.all(promises)
    console.log('Renegotiation completed for all peers')
  }

  private sendMessage(message: SignalMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private startPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }

    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: MessageType.Ping })
      }
    }, this.PING_INTERVAL)
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private stopReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.reconnectAttempts = 0
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      this.cleanup()
      return
    }

    // 清理当前连接
    this.cleanupPeersOnly()

    // 增加重连尝试次数
    this.reconnectAttempts++
    this.onConnectionStateChanged?.('reconnecting')

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    // 计算延迟时间（指数退避）
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    )

    this.reconnectTimeout = window.setTimeout(() => {
      console.log(`Reconnecting after ${delay}ms delay`)
      this.connect(this.wsUrl)
    }, delay)
  }

  private cleanupPeersOnly(): void {
    // 只清理peer连接，保留本地流
    this.peers.forEach((peer) => {
      peer.connection.close()
      peer.dataChannel?.close()
    })
    this.peers.clear()
  }

  private cleanup(): void {
    this.peers.forEach((peer) => {
      peer.connection.close()
      peer.dataChannel?.close()
    })
    this.peers.clear()

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
    }
  }

  disconnect(): void {
    this.isManuallyDisconnected = true
    this.stopReconnect()
    this.stopPing()
    if (this.ws) {
      this.ws.close()
    }
    this.cleanup()
  }
}
