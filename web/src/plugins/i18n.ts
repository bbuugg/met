import { createI18n } from 'vue-i18n'

// Define the message structure
type MessageSchema = typeof enUS

// English translations
const enUS = {
  tools: {
    webRtcMeeting: {
      title: 'Met',
      subtitle: 'Join or create a meeting',
      you: 'You',
      or: 'or',
      connection: {
        connected: 'Connected',
        connecting: 'Connecting...',
        disconnected: 'Disconnected'
      },
      entry: {
        displayName: 'Display Name',
        displayNamePlaceholder: 'Enter your name',
        meetingId: 'Meeting ID',
        meetingIdPlaceholder: 'Enter meeting ID',
        createMeeting: 'Create Meeting',
        joinMeeting: 'Join Meeting'
      },
      errors: {
        displayNameRequired: 'Display name is required',
        meetingIdRequired: 'Meeting ID is required',
        connectionFailed: 'Failed to connect to server'
      },
      status: {
        connected: 'Connected',
        connecting: 'Connecting...',
        disconnected: 'Disconnected',
        reconnecting: 'Reconnecting...'
      },
      displayName: 'Display Name',
      displayNamePlaceholder: 'Enter your name',
      meeting: {
        title: 'Meeting',
        createMeeting: 'Create Meeting',
        joinMeeting: 'Join Meeting',
        meetingIdPlaceholder: 'Enter meeting ID',
        leave: 'Leave',
        share: 'Share',
        copyLink: 'Copy Meeting Link',
        copySuccess: 'Copied Successfully',
        shareMeeting: 'Share Meeting',
        meetingLink: 'Meeting Link',
        invitedToMeeting: "You've been invited to a meeting.",
        quickJoin: 'Quick Join',
        close: 'Close',
        startRecording: 'Start Recording',
        stopRecording: 'Stop Recording',
        recordingStarted: 'Recording started',
        recordingStopped: 'Recording stopped',
        recordingFailed: 'Recording failed',
        recordingSaved: 'Recording saved',
        recordingSaveFailed: 'Failed to save recording',
        noRecordingData: 'No recording data available',
        leaveConfirmTitle: 'Confirm Leave',
        leaveConfirmMessage: 'Are you sure you want to leave the meeting?',
        leaveConfirm: 'Leave',
        leaveCancel: 'Cancel'
      },
      participants: {
        title: 'Participants',
        count: 'participants',
        togglePanel: 'Toggle Participants',
        host: 'Host',
        member: 'Member'
      },
      chat: {
        title: 'Chat',
        toggleChat: 'Toggle Chat',
        sendFile: 'Send File',
        download: 'Download',
        placeholder: 'Type a message...',
        send: 'Send',
        sendingFile: 'Sending file',
        unreadMessages: '{count} unread messages'
      },
      controls: {
        muteMic: 'Mute Microphone',
        unmuteMic: 'Unmute Microphone',
        turnOffCamera: 'Turn Off Camera',
        turnOnCamera: 'Turn On Camera',
        turnOnCameraFailed: 'Turn On Camera Failed',
        startScreenShare: 'Start Screen Share',
        startScreenShareFailed: 'Start Screen Share Failed',
        stopScreenShare: 'Stop Screen Share',
        moreOptions: 'More Options',
        muteAll: 'Mute All Participants',
        mute: 'Mute Participant',
        remove: 'Remove Participant',
        settings: 'Settings',
        muted: 'Muted',
        cameraOff: 'Camera Off',
        microphone: 'Microphone',
        camera: 'Camera',
        unnamedDevice: 'Unnamed Device',
        deviceError: 'Device Error',
        deviceFetchFailed: 'Failed to fetch media devices',
        cameraSwitched: 'Camera switched',
        cameraSwitchFailed: 'Failed to switch camera',
        microphoneSwitched: 'Microphone switched',
        microphoneSwitchFailed: 'Failed to switch microphone'
      },
      recording: {
        recording: 'Recording',
        start: 'Start Recording',
        stop: 'Stop Recording'
      },
      video: {
        sharingScreen: 'Sharing Screen',
        cameraOff: 'Camera is off',
        waitingForParticipant: 'Waiting for participant'
      }
    }
  },
  legalNotice: {
    title: 'Legal Notice',
    content:
      'Please comply with relevant laws and regulations when using this service. Do not use this service for any illegal purposes.\n\nBy using this service, you agree to:\n1. Comply with all applicable laws and regulations\n2. Not use the service for any illegal activities\n3. Respect the privacy and rights of other participants\n4. Use the service responsibly and ethically',
    accept: 'I Understand and Agree',
    decline: 'Decline and Return to Home'
  }
}

// Chinese translations
const zhCN = {
  tools: {
    webRtcMeeting: {
      title: '遇见',
      subtitle: '加入或创建会议',
      you: '你',
      or: '或',
      connection: {
        connected: '已连接',
        connecting: '连接中...',
        disconnected: '已断开连接'
      },
      entry: {
        displayName: '显示名称',
        displayNamePlaceholder: '输入你的名字',
        meetingId: '会议 ID',
        meetingIdPlaceholder: '输入会议 ID',
        createMeeting: '创建会议',
        joinMeeting: '加入会议'
      },
      errors: {
        displayNameRequired: '显示名称是必需的',
        meetingIdRequired: '会议 ID 是必需的',
        connectionFailed: '连接服务器失败'
      },
      status: {
        connected: '已连接',
        connecting: '连接中...',
        disconnected: '已断开连接',
        reconnecting: '重连中...'
      },
      displayName: '显示名称',
      displayNamePlaceholder: '输入你的名字',
      meeting: {
        title: '会议',
        createMeeting: '创建会议',
        joinMeeting: '加入会议',
        meetingIdPlaceholder: '输入会议 ID',
        leave: '离开',
        share: '分享',
        copyLink: '复制会议链接',
        copySuccess: '复制成功',
        shareMeeting: '分享会议',
        meetingLink: '会议链接',
        invitedToMeeting: '你被邀请加入会议',
        quickJoin: '快速加入',
        close: '关闭',
        startRecording: '开始录制',
        stopRecording: '停止录制',
        recordingStarted: '开始录制',
        recordingStopped: '录制已停止',
        recordingFailed: '录制失败',
        recordingSaved: '录制已保存',
        recordingSaveFailed: '保存录制文件失败',
        noRecordingData: '没有可用的录制数据',
        leaveConfirmTitle: '确认离开',
        leaveConfirmMessage: '您确定要离开会议吗？',
        leaveConfirm: '离开',
        leaveCancel: '取消'
      },
      participants: {
        title: '参会人',
        count: '人',
        togglePanel: '切换参与者面板',
        host: '主持人',
        member: '成员'
      },
      chat: {
        title: '聊天',
        toggleChat: '切换聊天',
        sendFile: '发送文件',
        download: '下载',
        placeholder: '输入消息...',
        send: '发送',
        sendingFile: '正在发送文件',
        unreadMessages: '{count} 条未读消息'
      },
      controls: {
        muteMic: '关闭麦克风',
        unmuteMic: '麦克风',
        turnOffCamera: '关闭摄像头',
        turnOnCamera: '打开摄像头',
        turnOnCameraFailed: '打开摄像头失败',
        startScreenShare: '开始屏幕共享',
        startScreenShareFailed: '屏幕共享失败',
        stopScreenShare: '停止屏幕共享',
        moreOptions: '更多选项',
        muteAll: '静音所有参与者',
        mute: '静音参与者',
        remove: '移除参与者',
        settings: '设置',
        muted: '已静音',
        cameraOff: '摄像头已关闭',
        microphone: '麦克风',
        camera: '摄像头',
        unnamedDevice: '未命名设备',
        deviceError: '设备错误',
        deviceFetchFailed: '获取媒体设备失败',
        cameraSwitched: '摄像头已切换',
        cameraSwitchFailed: '切换摄像头失败',
        microphoneSwitched: '麦克风已切换',
        microphoneSwitchFailed: '切换麦克风失败'
      },
      recording: {
        recording: '录制中',
        start: '开始录制',
        stop: '停止录制'
      },
      video: {
        sharingScreen: '共享屏幕中',
        cameraOff: '摄像头已关闭',
        waitingForParticipant: '等待其他人加入'
      }
    }
  },
  legalNotice: {
    title: '法律声明',
    content:
      '使用本服务时请遵守相关法律法规，不得用于任何违法用途。\n\n使用本服务即表示您同意：\n1. 遵守所有适用的法律法规\n2. 不将服务用于任何非法活动\n3. 尊重其他参与者的隐私和权利\n4. 负责任和道德地使用服务',
    accept: '我理解并同意',
    decline: '拒绝并返回首页'
  }
}

// Create i18n instance
const i18n = createI18n<[MessageSchema], 'en-US' | 'zh-CN'>({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages: {
    'en-US': enUS,
    'zh-CN': zhCN
  }
})

export default i18n
