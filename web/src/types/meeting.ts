export interface Meeting {
  id: string
  name: string
  hostId: string
  participants: Participant[]
  createdAt: number
  isActive: boolean
}

export interface Participant {
  id: string
  name: string
  role: 'host' | 'member'
  mediaState: MediaState
  connectionState: 'connecting' | 'connected' | 'disconnected'
  joinedAt: number
}

export interface MediaState {
  microphone: boolean
  camera: boolean
  screenSharing: boolean
}

export interface RemoteStream {
  id: string
  participantId: string
  stream: MediaStream
  type: 'camera' | 'screen'
}

export interface MeetingSettings {
  maxParticipants: number
  allowRecording: boolean
  allowScreenShare: boolean
  allowFileTransfer: boolean
}

export interface ConnectionConfig {
  signalServerUrl: string
  iceServers: RTCIceServer[]
  reconnectAttempts: number
  reconnectDelay: number
}