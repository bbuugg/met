export interface ChatMessage {
  id: string
  type: 'text' | 'file' | 'system'
  content: string
  senderId: string
  senderName: string
  timestamp: number
  fileName?: string
  fileSize?: number
  fileUrl?: string
  progress?: number
}

export interface FileMetadata {
  type: 'file-metadata'
  fileName: string
  fileSize: number
  mimeType: string
  senderId: string
  senderName: string
}

export interface SignalMessage {
  type: string
  [key: string]: any
}

export interface WebRTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  source: string
  target: string
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidate
}

export interface DataChannelMessage {
  type: 'chat' | 'file-metadata' | 'media-state'
  [key: string]: any
}