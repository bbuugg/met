export enum MessageType {
  Ping = 'ping',
  Pong = 'pong',
  Join = 'join',
  Leave = 'leave',
  AllClients = 'all-clients',
  WebRTCEvent = 'webrtc-event',
  Kick = 'kick'
}

export enum WebRTCEventType {
  Offer = 'offer',
  Answer = 'answer',
  IceCandidate = 'ice-candidate'
}

export interface SignalMessage {
  type: MessageType
  from?: Peer
  to?: {
    id: string
  }
  data?: any
}

export interface PeerConnection {
  id: string
  connection: RTCPeerConnection
  dataChannel?: RTCDataChannel
  remoteStream?: MediaStream
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: number
  type: 'text' | 'file'
  read?: boolean
  // File-specific properties
  fileType?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

export interface FileTransfer {
  id: string
  name: string
  size: number
  type: string
  progress: number
  status: 'pending' | 'transferring' | 'completed' | 'failed'
  chunks: ArrayBuffer[]
  totalChunks: number
}

export interface MediaState {
  video: boolean
  audio: boolean
  screen: boolean
  desktopAudio: boolean
}

export interface Peer {
  id: string
  name: string
  avatar?: string
  mediaState: MediaState
  stream?: MediaStream
}
