import { WebRTCService } from '@/services/WebRTCService'
import type { ChatMessage, FileTransfer, MediaState, Participant } from '@/types/webrtc'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useMeetingStore = defineStore('meeting', () => {
  // State
  const webrtcService = ref<WebRTCService | null>(null)
  const participants = ref<Map<string, Participant>>(new Map())
  const chatMessages = ref<ChatMessage[]>([])
  const fileTransfers = ref<FileTransfer[]>([])
  const localStream = ref<MediaStream | null>(null)
  const screenStream = ref<MediaStream | null>(null)
  const remoteStreams = ref<Map<string, MediaStream>>(new Map())
  const isConnected = ref(false)
  const isJoining = ref(false)
  const currentUser = ref<Participant | null>(null)
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
  async function joinMeeting(roomIdParam: string, clientIdParam: string, wsUrl: string) {
    if (isJoining.value) return

    isJoining.value = true
    roomId.value = roomIdParam
    clientId.value = clientIdParam

    try {
      // Create WebRTC service
      webrtcService.value = new WebRTCService(clientIdParam, roomIdParam)

      // Setup event handlers
      setupEventHandlers()

      // Connect to signaling server
      await webrtcService.value.connect(wsUrl)

      // Create current user
      currentUser.value = {
        id: clientIdParam,
        name: `${clientIdParam.slice(0, 8)}`,
        mediaState: { video: false, audio: false, screen: false }
      }

      participants.value.set(clientIdParam, currentUser.value)
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

    webrtcService.value.onParticipantJoined = (participant: Participant) => {
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