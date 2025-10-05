import { WebRTCService } from '@/services/WebRTCService'
import type { ChatMessage, FileTransfer, MediaState, Peer } from '@/types/webrtc'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './user'
import { Role } from '@/types/room'

export const useMeetingStore = defineStore('meeting', () => {
    // State
    const webrtcService = ref<WebRTCService | null>(null)
    const participants = ref<Map<string, Peer>>(new Map())
    const chatMessages = ref<ChatMessage[]>([])
    const fileTransfers = ref<FileTransfer[]>([])
    const localStream = ref<MediaStream | null>(null)
    const remoteStreams = ref<Map<string, MediaStream>>(new Map())
    const isConnected = ref(false)
    const isJoining = ref(false)
    const currentUser = ref<Peer | null>(null)
    const roomId = ref('')
    const roomName = ref('')
    const roomPassword = ref('')
    const clientId = ref('')

    // Additional state for HomeView.vue.bak compatibility
    const inMeeting = ref(false)
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
        roomName.value = signedData.roomName
        roomPassword.value = signedData.roomPassword || ''
        clientId.value = signedData.userId
        // 设置是否为房间管理员 (role: 1 = master, 2 = user)
        isHost.value = signedData.role === Role.Master

        try {
            // Create WebRTC service
            webrtcService.value = new WebRTCService(signedData)

            // Setup event handlers
            setupEventHandlers()

            // Connect to signaling server
            await webrtcService.value.connect(wsUrl)

            // Get user info for avatar
            const userStore = useUserStore()

            // Create current user
            currentUser.value = {
                id: signedData.userId,
                name: signedData.name,
                avatar: userStore.info?.avatar || undefined,
                mediaState: { video: false, audio: false, screen: false, desktopAudio: false }
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
            // 如果消息不是来自当前用户，标记为未读
            if (message.senderId !== clientId.value) {
                message.read = false
            } else {
                message.read = true
            }
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
                    fileSize: file.size,
                    read: false // 接收到的文件标记为未读
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
                    fileSize: file.size,
                    read: false // 接收到的文件标记为未读
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

    async function startCamera(videoDeviceId?: string) {
        if (!webrtcService.value) return

        try {
            localStream.value = await webrtcService.value.startCamera(videoDeviceId)
            if (currentUser.value) {
                currentUser.value.mediaState.video = true
                currentUser.value.mediaState.screen = false
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
            if (currentUser.value) {
                currentUser.value.mediaState.video = false
            }
        } catch (error) {
            console.error('Failed to stop camera:', error)
            throw error
        }
    }

    async function startScreenShare() {
        if (!webrtcService.value) return

        try {
            localStream.value = await webrtcService.value.startScreenShare()
            if (currentUser.value) {
                currentUser.value.mediaState.screen = true
                currentUser.value.mediaState.video = false
                // 根据实际桌面音频轨道存在情况初始化 desktopAudio 状态
                currentUser.value.mediaState.desktopAudio = webrtcService.value.hasDesktopAudioTrack()
                // 确保currentUser.stream也更新为screenStream
                currentUser.value.stream = localStream.value
            }
        } catch (error) {
            console.error('Failed to start screen share:', error)
            throw error
        }
    }

    async function stopScreenShare() {
        if (!webrtcService.value) return

        await webrtcService.value.stopScreenShare()
        if (currentUser.value) {
            currentUser.value.mediaState.screen = false
            currentUser.value.mediaState.desktopAudio = false
        }
    }

    // 新增方法：启动仅音频流
    async function startAudioOnly(audioDeviceId?: string) {
        if (!webrtcService.value) return

        try {
            // 创建仅音频约束
            const constraints: MediaStreamConstraints = {
                video: false,
                audio: audioDeviceId
                    ? {
                        deviceId: { exact: audioDeviceId },
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                    : {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
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
                const service: any = webrtcService.value
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
            // 使用服务启动屏幕共享（服务内部处理互斥和轨道替换）
            localStream.value = await webrtcService.value.startScreenShare()
            if (currentUser.value) {
                currentUser.value.mediaState.screen = true
                currentUser.value.stream = localStream.value
            }

            // 如果指定音频设备，切换麦克风设备并保持开关状态
            if (audioDeviceId) {
                const enabled = await webrtcService.value.switchAudioDevice(audioDeviceId)
                if (currentUser.value) {
                    currentUser.value.mediaState.audio = enabled
                }
                localStream.value = webrtcService.value.getLocalStream()
            }
        } catch (error) {
            console.error('Failed to start screen share with audio:', error)
            throw error
        }
    }

    // 切换麦克风设备
    async function switchAudioDevice(deviceId?: string) {
        if (!webrtcService.value || !currentUser.value) {
            return false
        }

        const enabled = await webrtcService.value.switchAudioDevice(deviceId)
        localStream.value = webrtcService.value.getLocalStream()
        currentUser.value.mediaState.audio = enabled
        return enabled
    }

    async function toggleAudio(deviceId?: string) {
        if (!webrtcService.value || !currentUser.value) {
            return false
        }

        const enabled = await webrtcService.value.toggleAudio(deviceId)

        localStream.value = webrtcService.value.getLocalStream()
        console.log('Local stream tracks after toggleAudio:', localStream.value)
        currentUser.value.mediaState.audio = enabled
        return enabled
    }

    async function toggleVideo(deviceId?: string) {
        if (!webrtcService.value || !currentUser.value) return false

        const enabled = await webrtcService.value.toggleVideo(deviceId)
        console.log(
            'Local stream tracks after toggleVideo:',
            currentUser.value.mediaState.video,
            enabled
        )
        currentUser.value.mediaState.video = enabled
        if (enabled) {
            // 摄像头开启后，屏幕共享应为关闭状态
            currentUser.value.mediaState.screen = false
        }
        localStream.value = webrtcService.value.getLocalStream()
        return enabled
    }

    async function switchVideoDevice(deviceId?: string) {
        if (!webrtcService.value || !currentUser.value) return

        await webrtcService.value.switchVideoDevice(deviceId)
        localStream.value = webrtcService.value.getLocalStream()
        return currentUser.value.mediaState.video
    }

    async function toggleDesktopAudio() {
        if (!webrtcService.value || !currentUser.value) {
            return false
        }

        const enabled = await webrtcService.value.toggleDesktopAudio()
        currentUser.value.mediaState.desktopAudio = enabled
        // 更新本地流以触发视频网格更新（音轨替换后仍指向同一对象，这里显式设置）
        localStream.value = webrtcService.value.getLocalStream()
        return enabled
    }

    function sendChatMessage(content: string) {
        if (!webrtcService.value) return

        webrtcService.value.sendChatMessage(currentUser.value?.name || '', content)
    }

    async function sendFile(file: File) {
        if (!webrtcService.value) return

        try {
            // 添加文件消息到发送方的聊天记录
            const fileMessage: ChatMessage = {
                id: Date.now().toString(),
                senderId: clientId.value,
                senderName: currentUser.value?.name || '',
                content: `File sent: ${file.name}`,
                timestamp: Date.now(),
                type: 'file',
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                read: true // 自己发送的消息标记为已读
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

    function addParticipant(participant: any) {
        participants.value.set(participant.id, participant)
        participantCount.value = participants.value.size
    }

    function removeParticipant(participantId: string) {
        participants.value.delete(participantId)
        participantCount.value = participants.value.size
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
        isConnected.value = false
        isJoining.value = false
        currentUser.value = null
        webrtcService.value = null
        roomId.value = ''
        roomName.value = ''
        roomPassword.value = ''
        clientId.value = ''

        // 重置额外状态
        inMeeting.value = false
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
        remoteStreams,
        isConnected,
        isJoining,
        currentUser,
        roomId,
        roomName,
        roomPassword,
        clientId,
        webrtcService, // 导出webrtcService

        // Additional state
        inMeeting,
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
        switchAudioDevice,
        switchVideoDevice,
        toggleDesktopAudio, // 导出桌面音频控制方法
        sendChatMessage,
        sendFile,
        leaveMeeting,
        markMessagesAsRead,

        // Additional methods
        setMeeting,
        addParticipant,
        removeParticipant,
        updateParticipantMediaState,
        addChatMessage,
        clearChatUnread,
        updateFileTransferProgress,
        resetAllState // 导出新方法
    }
})
