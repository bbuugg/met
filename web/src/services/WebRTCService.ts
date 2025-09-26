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
  private readonly localStream: MediaStream
  private audioTrack: MediaStreamTrack | null = null
  private videoTrack: MediaStreamTrack | null = null
  private desktopAudioTrack: MediaStreamTrack | null = null
  private desktopVideoTrack: MediaStreamTrack | null = null
  private mixedAudioTrack: MediaStreamTrack | null = null
  private peers: Map<string, PeerConnection> = new Map()
  private signedData: any
  private clientId: string
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
    this.signedData = signedData
    this.localStream = new MediaStream()
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
            // if (this.reconnectAttempts > 0) {
            //   await this.handlePeerJoined(client)
            // }
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
      // Check connection state before setting remote description
      if (peer.connection.signalingState === 'have-local-offer') {
        await peer.connection.setRemoteDescription(answer)
      } else {
        console.warn(
          `Cannot set remote answer, connection state: ${peer.connection.signalingState}`
        )
      }
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

    // Handle ICE connection state changes
    connection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for peer ${peerId}:`, connection.iceConnectionState)

      // 当 ICE 连接成功时，发送自己的媒体状态
      if (
        connection.iceConnectionState === 'connected' ||
        connection.iceConnectionState === 'completed'
      ) {
        console.log(`WebRTC connection established with peer ${peerId}, sending media state`)
        this.sendMediaStateToPeer(peerId)
      }
    }

    console.log('Creating peer connection for:', peerId)

    // Handle remote stream
    connection.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (!remoteStream) {
        return
      }
      console.log('Received remote stream from:', peerId, remoteStream)
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
      // 数据通道打开后立即发送自己的媒体状态
      this.sendMediaStateToPeer(peerId)
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
          type: 'text',
          read: false // 接收到的消息标记为未读
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
      // 摄像头视频与屏幕共享互斥
      if (this.mediaState.screen) {
        await this.stopScreenShare()
      }

      const constraints: MediaStreamConstraints = {
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: false
      }
      const camStream = await navigator.mediaDevices.getUserMedia(constraints)
      this.videoTrack = camStream.getVideoTracks()[0]

      // 替换本地视频轨道
      this.localStream.getVideoTracks().forEach((track) => {
        this.localStream.removeTrack(track)
        track.stop()
      })
      if (this.videoTrack) {
        this.localStream.addTrack(this.videoTrack)
        this.videoTrack.onended = () => {
          this.stopCamera()
        }
      }

      this.mediaState.video = true
      this.mediaState.screen = false
      this.broadcastMediaState()
      await this.replaceVideoTrack(this.videoTrack)
      return this.localStream
    } catch (error) {
      console.error('Error accessing camera:', error)
      throw error
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      // 与摄像头视频互斥
      if (this.mediaState.video) {
        await this.stopCamera()
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      const screenVideoTrack = screenStream.getVideoTracks()[0]
      const screenAudioTrack = screenStream.getAudioTracks()[0] || null

      this.desktopVideoTrack = screenVideoTrack
      this.desktopAudioTrack = screenAudioTrack

      // 替换本地视频为屏幕视频
      this.localStream.getVideoTracks().forEach((track) => {
        this.localStream.removeTrack(track)
        track.stop()
      })
      if (this.desktopVideoTrack) {
        this.localStream.addTrack(this.desktopVideoTrack)
        this.desktopVideoTrack.onended = () => {
          this.stopScreenShare()
        }
      }

      this.mediaState.screen = true
      this.mediaState.video = false
      this.mediaState.desktopAudio = !!this.desktopAudioTrack

      if (this.desktopAudioTrack) {
        this.desktopAudioTrack.enabled = true
      }

      this.broadcastMediaState()
      await this.replaceVideoTrack(this.desktopVideoTrack)
      await this.replaceAudioTrack(await this.createMixedAudioTrack())
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
        this.localStream.removeTrack(track)
        track.stop()
      })

      // 停止并清理桌面音频引用
      if (this.desktopAudioTrack) {
        try {
          this.desktopAudioTrack.stop()
        } catch {}
      }
      this.desktopAudioTrack = null

      this.mediaState.screen = false
      this.mediaState.video = false
      this.mediaState.desktopAudio = false
      this.broadcastMediaState()

      await this.replaceVideoTrack(null)
      await this.replaceAudioTrack(await this.createMixedAudioTrack())
    }
  }

  async toggleAudio(deviceId?: string): Promise<boolean> {
    if (!this.audioTrack) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      })

      this.audioTrack = stream.getAudioTracks()[0]
    }
    console.log(
      'toggleAudio',
      this.audioTrack.enabled,
      this.mediaState.audio,
      this.audioTrack,
      this.localStream
    )
    // 切换 mic 状态（enable/disable）并替换给 peers
    this.mediaState.audio = !this.mediaState.audio
    this.audioTrack.enabled = this.mediaState.audio
    await this.replaceAudioTrack(await this.createMixedAudioTrack())
    this.broadcastMediaState()
    return this.mediaState.audio
  }

  // 切换麦克风设备（保持当前音频开关状态）
  async switchAudioDevice(deviceId?: string): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      })

      // 替换当前麦克风轨道
      const newMic = stream.getAudioTracks()[0]
      if (this.audioTrack) {
        try {
          this.audioTrack.stop()
        } catch {}
      }
      this.audioTrack = newMic
      // 若当前音频开关为开启，则保持开启
      if (this.mediaState.audio) {
        this.audioTrack.enabled = true
      } else {
        this.audioTrack.enabled = false
      }

      await this.replaceAudioTrack(await this.createMixedAudioTrack())
      this.broadcastMediaState()
      return this.mediaState.audio
    } catch (error) {
      console.error('Failed to switch audio device:', error)
      throw error
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  // 切换桌面音频（独立于麦克风音频）
  async toggleDesktopAudio(): Promise<boolean> {
    console.log('toggleDesktopAudio', this.localStream, this.mediaState.screen)
    if (!this.mediaState.screen || !this.desktopAudioTrack) {
      return false // 只有在屏幕共享时才能控制桌面音频
    }

    const newState = !this.mediaState.desktopAudio
    this.desktopAudioTrack.enabled = newState

    this.mediaState.desktopAudio = newState
    this.broadcastMediaState()

    // 更新音频轨道（混合或单一）
    await this.replaceAudioTrack(await this.createMixedAudioTrack())

    return this.mediaState.desktopAudio
  }

  // 创建混合音频轨道（同时支持麦克风和桌面音频）
  private async createMixedAudioTrack(): Promise<MediaStreamTrack | null> {
    const micEnabled = !!this.audioTrack && this.mediaState.audio
    const deskEnabled = !!this.desktopAudioTrack && this.mediaState.desktopAudio

    if (!micEnabled && !deskEnabled) {
      return null
    }

    if (micEnabled && deskEnabled && this.audioTrack && this.desktopAudioTrack) {
      return await this.mixAudioTracks(this.audioTrack, this.desktopAudioTrack)
    }

    if (micEnabled && this.audioTrack) return this.audioTrack
    if (deskEnabled && this.desktopAudioTrack) return this.desktopAudioTrack
    return null
  }

  // 混合两个音频轨道
  private async mixAudioTracks(
    micTrack: MediaStreamTrack,
    desktopTrack: MediaStreamTrack
  ): Promise<MediaStreamTrack> {
    try {
      // 创建 AudioContext 来混合音频
      const audioContext = new AudioContext()

      // 创建音频源
      const micStream = new MediaStream([micTrack])
      const desktopStream = new MediaStream([desktopTrack])

      const micSource = audioContext.createMediaStreamSource(micStream)
      const desktopSource = audioContext.createMediaStreamSource(desktopStream)

      // 创建增益节点来控制音量
      const micGain = audioContext.createGain()
      const desktopGain = audioContext.createGain()

      // 设置音量（可以根据需要调整）
      micGain.gain.value = 1.0 // 麦克风音量
      desktopGain.gain.value = 0.7 // 桌面音频音量稍低，避免过响

      // 创建混合器
      const mixer = audioContext.createGain()

      // 连接音频节点
      micSource.connect(micGain)
      desktopSource.connect(desktopGain)
      micGain.connect(mixer)
      desktopGain.connect(mixer)

      // 创建输出流
      const destination = audioContext.createMediaStreamDestination()
      mixer.connect(destination)

      const mixed = destination.stream.getAudioTracks()[0]
      // 保存当前混合输出轨，用于后续替换时正确停止
      this.mixedAudioTrack = mixed
      return mixed
    } catch (error) {
      console.warn('Failed to mix audio tracks, falling back to mic track:', error)
      return micTrack // 如果混合失败，回退到麦克风
    }
  }

  // 替换所有 peer 的 audio track
  private async replaceAudioTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    const promises: Promise<void>[] = []

    // 保持本地流仅有一个音频轨道（混合后的或单一）
    this.localStream.getAudioTracks().forEach((track) => {
      try {
        this.localStream.removeTrack(track)
        // 停止旧的混合输出轨，避免残留
        if (this.mixedAudioTrack && track === this.mixedAudioTrack) {
          try {
            track.stop()
          } catch {}
          this.mixedAudioTrack = null
        }
      } catch {}
    })
    if (newTrack) {
      this.localStream.addTrack(newTrack)
    }

    this.peers.forEach((peer, peerId) => {
      const senders = peer.connection.getSenders()
      const audioSender = senders.find((s) => s.track && s.track.kind === 'audio')
      if (!audioSender) {
        if (newTrack) {
          try {
            peer.connection.addTrack(newTrack, this.localStream)
          } catch (e) {
            console.warn('Failed to add audio track, will renegotiate', e)
          }
          promises.push(this.renegotiateConnection(peerId))
        } else {
          // 没有发送器且无新轨，不需要操作
        }
      } else {
        if (newTrack) {
          promises.push(
            audioSender
              .replaceTrack(newTrack)
              .then(() => this.renegotiateConnection(peerId))
              .catch((error) => {
                console.error(`Failed to replace audio track for peer ${peerId}:`, error)
                return this.renegotiateConnection(peerId)
              })
          )
        } else {
          // 禁用音频：移除发送器并重新协商
          try {
            peer.connection.removeTrack(audioSender)
          } catch (e) {
            console.warn('Failed to remove audio sender', e)
          }
          promises.push(this.renegotiateConnection(peerId))
        }
      }
    })
    await Promise.all(promises)
  }

  async toggleVideo(deviceId?: string) {
    if (!this.videoTrack) {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      this.videoTrack = stream.getVideoTracks()[0]
      console.log('Started camera with video device:', deviceId)
    }

    // 打开摄像头时关闭屏幕共享
    if (!this.mediaState.video && this.mediaState.screen) {
      await this.stopScreenShare()
    }

    if (!this.mediaState.video) {
      this.localStream.getVideoTracks().forEach((track) => {
        this.localStream.removeTrack(track)
      })
      this.localStream.addTrack(this.videoTrack)
      await this.replaceVideoTrack(this.videoTrack)
      this.mediaState.video = true
    } else {
      await this.replaceVideoTrack(null)
      this.localStream.getVideoTracks().forEach((track) => this.localStream.removeTrack(track))
      this.mediaState.video = false
    }
    this.videoTrack.enabled = this.mediaState.video
    this.broadcastMediaState()
    return this.mediaState.video
  }

  async toggleScreenShare() {
    if (!this.mediaState.screen) {
      await this.startScreenShare()
      return true
    } else {
      await this.stopScreenShare()
      return false
    }
  }

  async switchVideoDevice(deviceId?: string) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined
      }
    })
    this.videoTrack = stream.getVideoTracks()[0]
    this.localStream.getVideoTracks().forEach((track) => {
      this.localStream.removeTrack(track)
      track.stop()
    })
    this.localStream.addTrack(this.videoTrack)
  }

  async stopCamera(): Promise<void> {
    // Remove and stop local video tracks
    const vids = this.localStream.getVideoTracks()
    vids.forEach((track) => {
      try {
        this.localStream.removeTrack(track)
        track.stop()
      } catch {}
    })
    if (this.videoTrack) {
      try {
        this.videoTrack.stop()
      } catch {}
    }
    this.videoTrack = null

    // Update state and notify peers
    this.mediaState.video = false
    this.broadcastMediaState()

    await this.replaceVideoTrack(null)
  }

  sendChatMessage(name: string, content: string): void {
    const message = {
      type: 'chat',
      id: Date.now().toString(),
      senderName: name,
      content,
      timestamp: Date.now()
    }

    this.broadcastToDataChannels(message)

    // Add to own chat
    this.onChatMessage?.({
      ...message,
      senderId: this.clientId,
      type: 'text',
      read: true // 自己发送的消息标记为已读
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

  // 查询是否存在桌面音频轨道（用于 UI 显示控制）
  public hasDesktopAudioTrack(): boolean {
    return !!this.desktopAudioTrack
  }

  // 获取当前媒体状态（用于立即同步 UI）
  public getMediaState(): MediaState {
    return { ...this.mediaState }
  }

  // 向特定 peer 发送媒体状态
  private sendMediaStateToPeer(peerId: string): void {
    const peer = this.peers.get(peerId)
    if (peer && peer.dataChannel && peer.dataChannel.readyState === 'open') {
      const message = JSON.stringify({
        type: 'media-state',
        mediaState: this.mediaState
      })
      try {
        peer.dataChannel.send(message)
        console.log(`Sent media state to peer ${peerId}:`, this.mediaState)
      } catch (error) {
        console.error(`Failed to send media state to peer ${peerId}:`, error)
      }
    } else {
      console.log(`Cannot send media state to peer ${peerId}: data channel not ready`)
    }
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
    console.log(
      'Replacing video track for',
      this.peers.size,
      'peers',
      newTrack ? 'with new track' : 'with null (removing)'
    )

    const promises: Promise<void>[] = []

    this.peers.forEach((peer, peerId) => {
      const senders = peer.connection.getSenders()
      console.log(`Peer ${peerId} has ${senders.length} senders`)

      const videoSender = senders.find((s) => s.track && s.track.kind === 'video')

      if (videoSender) {
        if (newTrack) {
          console.log(`Replacing video track for peer ${peerId}`)
          promises.push(
            videoSender
              .replaceTrack(newTrack)
              .then(() => this.renegotiateConnection(peerId))
              .catch((error) => {
                console.error(`Failed to replace track for peer ${peerId}:`, error)
                return this.renegotiateConnection(peerId)
              })
          )
        } else {
          try {
            peer.connection.removeTrack(videoSender)
          } catch (error) {
            console.warn(`Failed to remove video sender for peer ${peerId}:`, error)
          }
          promises.push(this.renegotiateConnection(peerId))
        }
      } else if (newTrack) {
        // If there's no existing video sender, add one and renegotiate
        try {
          peer.connection.addTrack(newTrack, this.localStream)
        } catch (error) {
          console.warn(`Failed to add video track for peer ${peerId}:`, error)
        }
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
