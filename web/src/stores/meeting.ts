import { WebRTCService } from '@/services/WebRTCService'
import type { ChatMessage, FileTransfer, MediaState, Peer } from '@/types/webrtc'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useMeetingStore = defineStore('meeting', () => {
  // State
  const webrtcService = ref<WebRTCService | null>(null)
  const participants = ref<Map<string, Peer>>(new Map())
  const chatMessages = ref<ChatMessage[]>([])
  const fileTransfers = ref<FileTransfer[]>([])
  const localStream = ref<MediaStream | null>(null)
  const screenStream = ref<MediaStream | null>(null)
  const remoteStreams = ref<Map<string, MediaStream>>(new Map())
  const isConnected = ref(false)
  const isJoining = ref(false)
  const currentUser = ref<Peer | null>(null)
  const roomId = ref('')
  const clientId = ref('')

  // Additional state for HomeView.vue.bak compatibility
  const inMeeting = ref(false)
  const displayName = ref('')
  const localDeviceId = ref('')
  const currentMeeting = ref<any>(null)
  const isHost = ref(false)
  const localMediaState = ref({ microphone: true, camera: true, screenSharing: false })
  const participantCount = ref(0)
  const isRecording = ref(false)
  const unreadMessages = ref(0)
  const showChatPanel = ref(false)

  // Computed
  const participantsList = computed(() => Array.from(participants.value.values()))
  const unreadMessagesCount = computed(() => chatMessages.value.filter((msg) => !msg.read).length)
  const activeTransfers = computed(() =>
    fileTransfers.value.filter((t) => t.status === 'transferring')
  )

  // Actions
  async function joinMeeting(wsUrl: string, signedData: any) {
    if (isJoining.value) return

    isJoining.value = true
    roomId.value = signedData.roomId
    clientId.value = signedData.userId

    try {
      // Create WebRTC service
      webrtcService.value = new WebRTCService(signedData)

      // Setup event handlers
      setupEventHandlers()

      // Connect to signaling server
      await webrtcService.value.connect(wsUrl)

      // Create current user
      currentUser.value = {
        id: signedData.userId,
        name: signedData.name,
        mediaState: { video: false, audio: false, screen: false }
      }

      participants.value.set(signedData.userId, currentUser.value)
      isConnected.value = true
    } catch (error) {
      console.error('Failed to join meeting:', error)
      throw error
    } finally {
      isJoining.value = false
    }
  }

  function setupEventHandlers() {
    if (!webrtcService.value) return

    webrtcService.value.onParticipantJoined = (participant: Peer) => {
      participants.value.set(participant.id, participant)
    }

    webrtcService.value.onParticipantLeft = (participantId: string) => {
      participants.value.delete(participantId)
      remoteStreams.value.delete(participantId)
    }

    webrtcService.value.onRemoteStream = (participantId: string, stream: MediaStream) => {
      remoteStreams.value.set(participantId, stream)
    }

    webrtcService.value.onChatMessage = (message: ChatMessage) => {
      chatMessages.value.push(message)
    }

    webrtcService.value.onFileReceived = (file: File) => {
      // Check if file is an image or video for preview
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      // Create object URL for preview
      const url = URL.createObjectURL(file)

      // For images and videos, we don't automatically download but show preview
      if (isImage || isVideo) {
        // Add to chat as file message with preview URL
        chatMessages.value.push({
          id: Date.now().toString(),
          senderId: 'system',
          senderName: 'System',
          content: `File received: ${file.name}`,
          timestamp: Date.now(),
          type: 'file',
          fileType: file.type,
          fileUrl: url,
          fileName: file.name,
          fileSize: file.size
        })
      } else {
        // For other files, automatically download
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        // Add to chat as file message
        chatMessages.value.push({
          id: Date.now().toString(),
          senderId: 'system',
          senderName: 'System',
          content: `File received: ${file.name}`,
          timestamp: Date.now(),
          type: 'file',
          fileName: file.name,
          fileSize: file.size
        })
      }
    }

    webrtcService.value.onFileProgress = (transfer: FileTransfer) => {
      const existingIndex = fileTransfers.value.findIndex((t) => t.id === transfer.id)
      if (existingIndex >= 0) {
        fileTransfers.value[existingIndex] = transfer
      } else {
        fileTransfers.value.push(transfer)
      }
    }

    webrtcService.value.onMediaStateChanged = (participantId: string, mediaState: MediaState) => {
      const participant = participants.value.get(participantId)
      if (participant) {
        participant.mediaState = mediaState
      }
    }
  }

  async function startCamera(videoDeviceId?: string, audioDeviceId?: string) {
    if (!webrtcService.value) return

    try {
      localStream.value = await webrtcService.value.startCamera(videoDeviceId, audioDeviceId, true)
      if (currentUser.value) {
        currentUser.value.mediaState.video = true
        currentUser.value.mediaState.audio = true
        currentUser.value.stream = localStream.value
      }
    } catch (error) {
      console.error('Failed to start camera:', error)
      throw error
    }
  }

  async function stopCamera() {
    if (!webrtcService.value) return

    try {
      await webrtcService.value.stopCamera()
      localStream.value = null
      if (currentUser.value) {
        currentUser.value.mediaState.video = false
        currentUser.value.mediaState.audio = false
        currentUser.value.stream = undefined
      }
    } catch (error) {
      console.error('Failed to stop camera:', error)
      throw error
    }
  }

  async function startScreenShare() {
    if (!webrtcService.value) return

    try {
      screenStream.value = await webrtcService.value.startScreenShare()
      if (currentUser.value) {
        currentUser.value.mediaState.screen = true
        // 确保currentUser.stream也更新为screenStream
        currentUser.value.stream = screenStream.value
      }
    } catch (error) {
      console.error('Failed to start screen share:', error)
      throw error
    }
  }

  async function stopScreenShare() {
    if (!webrtcService.value) return

    await webrtcService.value.stopScreenShare()
    screenStream.value = null
    if (currentUser.value) {
      currentUser.value.mediaState.screen = false
    }
  }

  // 新增方法：启动仅音频流
  async function startAudioOnly(audioDeviceId?: string) {
    if (!webrtcService.value) return

    try {
      // 创建仅音频约束
      const constraints: MediaStreamConstraints = {
        video: false,
        audio: audioDeviceId ? {
          deviceId: { exact: audioDeviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      }

      // 获取音频流
      const audioStream = await navigator.mediaDevices.getUserMedia(constraints)

      // 将音频流设置为本地流
      localStream.value = audioStream

      // 更新WebRTC服务中的媒体状态
      if (webrtcService.value) {
        // 更新媒体状态
        if (currentUser.value) {
          currentUser.value.mediaState.audio = true
          currentUser.value.mediaState.video = false
          currentUser.value.mediaState.screen = false
          currentUser.value.stream = audioStream
        }

        // 如果有现有的对等连接，重新协商以添加音频轨道
        // 通过反射访问WebRTCService的私有属性和方法
        const service: any = webrtcService.value;
        if (service.peers && service.peers.size > 0) {
          console.log('Renegotiating connections to add audio-only tracks')
          // 调用重新协商方法
          if (typeof service.renegotiateAllConnections === 'function') {
            await service.renegotiateAllConnections.call(service)
          }
        }
      }
    } catch (error) {
      console.error('Failed to start audio only stream:', error)
      throw error
    }
  }

  // 新增方法：使用指定音频设备启动屏幕共享
  async function startScreenShareWithAudio(audioDeviceId?: string) {
    if (!webrtcService.value) return

    try {
      // 先获取屏幕共享流
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })

      // 如果指定了音频设备，获取该设备的音频流
      let audioStream: MediaStream | null = null
      if (audioDeviceId) {
        const audioConstraints: MediaStreamConstraints = {
          video: false,
          audio: {
            deviceId: { exact: audioDeviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        }
        audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints)
      }

      // 合并屏幕和音频流
      const combinedStream = new MediaStream()

      // 添加屏幕视频轨道
      displayStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track)
      })

      // 添加音频轨道（优先使用指定设备的音频，否则使用屏幕共享的音频）
      if (audioStream) {
        audioStream.getAudioTracks().forEach(track => {
          combinedStream.addTrack(track)
        })
        // 停止屏幕共享的音频轨道
        displayStream.getAudioTracks().forEach(track => track.stop())
      } else {
        displayStream.getAudioTracks().forEach(track => {
          combinedStream.addTrack(track)
        })
      }

      // 更新状态
      screenStream.value = combinedStream
      if (currentUser.value) {
        currentUser.value.mediaState.screen = true
        currentUser.value.mediaState.audio = true
        currentUser.value.stream = combinedStream
      }

      // 处理屏幕共享结束事件
      displayStream.getVideoTracks()[0].onended = () => {
        stopScreenShare()
      }
    } catch (error) {
      console.error('Failed to start screen share with audio:', error)
      throw error
    }
  }

  function toggleAudio() {
    if (!webrtcService.value || !currentUser.value) return false

    const enabled = webrtcService.value.toggleAudio()
    currentUser.value.mediaState.audio = enabled
    return enabled
  }

  function toggleVideo() {
    if (!webrtcService.value || !currentUser.value) return false

    const enabled = webrtcService.value.toggleVideo()
    currentUser.value.mediaState.video = enabled
    return enabled
  }

  function sendChatMessage(content: string) {
    if (!webrtcService.value) return

    webrtcService.value.sendChatMessage(content)
  }

  async function sendFile(file: File) {
    if (!webrtcService.value) return

    try {
      // 添加文件消息到发送方的聊天记录
      const fileMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: clientId.value,
        senderName: currentUser.value?.name || 'You',
        content: `File sent: ${file.name}`,
        timestamp: Date.now(),
        type: 'file',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }

      // 检查文件类型以决定是否需要预览
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (isImage || isVideo) {
        // 为图片和视频创建本地预览URL
        const url = URL.createObjectURL(file)
        fileMessage.fileUrl = url
      }

      chatMessages.value.push(fileMessage)

      await webrtcService.value.sendFile(file)
    } catch (error) {
      console.error('Failed to send file:', error)
      throw error
    }
  }

  function leaveMeeting() {
    if (webrtcService.value) {
      webrtcService.value.disconnect()
    }

    // Reset state
    participants.value.clear()
    chatMessages.value = []
    fileTransfers.value = []
    remoteStreams.value.clear()
    localStream.value = null
    screenStream.value = null
    isConnected.value = false
    currentUser.value = null
    webrtcService.value = null
  }

  function markMessagesAsRead() {
    chatMessages.value.forEach((msg) => {
      msg.read = true
    })
  }

  function setMeeting(meeting: any) {
    currentMeeting.value = meeting
    inMeeting.value = true
  }

  function resetMeeting() {
    currentMeeting.value = null
    inMeeting.value = false
    isHost.value = false
    participants.value.clear()
    chatMessages.value = []
    remoteStreams.value.clear()
  }

  function addParticipant(participant: any) {
    participants.value.set(participant.id, participant)
    participantCount.value = participants.value.size
  }

  function removeParticipant(participantId: string) {
    participants.value.delete(participantId)
    participantCount.value = participants.value.size
  }

  function addRemoteStream(streamInfo: any) {
    remoteStreams.value.set(streamInfo.id, streamInfo.stream)
  }

  function updateParticipantMediaState(participantId: string, mediaState: any) {
    const participant = participants.value.get(participantId)
    if (participant) {
      participant.mediaState = { ...participant.mediaState, ...mediaState }
    }
  }

  function addChatMessage(message: any) {
    chatMessages.value.push(message)
    if (!showChatPanel.value) {
      unreadMessages.value++
    }
  }

  function clearChatUnread() {
    unreadMessages.value = 0
  }

  function updateFileTransferProgress(participantId: string, progress: any) {
    // Implementation for file transfer progress
  }

  // 新增方法：清理远程流
  function clearRemoteStreams() {
    remoteStreams.value.clear()
  }

  // 新增方法：彻底重置所有状态
  function resetAllState() {
    // 断开连接
    if (webrtcService.value) {
      webrtcService.value.disconnect()
    }

    // 清理所有状态
    participants.value.clear()
    chatMessages.value = []
    fileTransfers.value = []
    remoteStreams.value.clear()
    localStream.value = null
    screenStream.value = null
    isConnected.value = false
    isJoining.value = false
    currentUser.value = null
    webrtcService.value = null
    roomId.value = ''
    clientId.value = ''

    // 重置额外状态
    inMeeting.value = false
    displayName.value = ''
    localDeviceId.value = ''
    currentMeeting.value = null
    isHost.value = false
    localMediaState.value = { microphone: true, camera: true, screenSharing: false }
    participantCount.value = 0
    isRecording.value = false
    unreadMessages.value = 0
    showChatPanel.value = false
  }

  return {
    // State
    participants,
    chatMessages,
    fileTransfers,
    localStream,
    screenStream,
    remoteStreams,
    isConnected,
    isJoining,
    currentUser,
    roomId,
    clientId,
    webrtcService, // 导出webrtcService

    // Additional state
    inMeeting,
    displayName,
    localDeviceId,
    currentMeeting,
    isHost,
    localMediaState,
    participantCount,
    isRecording,
    unreadMessages,
    showChatPanel,

    // Computed
    participantsList,
    unreadMessagesCount,
    activeTransfers,

    // Actions
    joinMeeting,
    startCamera,
    stopCamera,
    startScreenShare,
    stopScreenShare,
    startScreenShareWithAudio, // 导出新方法
    startAudioOnly, // 导出新方法
    toggleAudio,
    toggleVideo,
    sendChatMessage,
    sendFile,
    leaveMeeting,
    markMessagesAsRead,

    // Additional methods
    setMeeting,
    resetMeeting,
    addParticipant,
    removeParticipant,
    addRemoteStream,
    updateParticipantMediaState,
    addChatMessage,
    clearChatUnread,
    updateFileTransferProgress,
    clearRemoteStreams,
    resetAllState // 导出新方法
  }
})