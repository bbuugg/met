export interface RoomInfo {
  id: string
  name: string
  clientCount: number
  maxOnline: number
  startTime: string
  lastActive?: string
  clients: ClientInfo[]
}

export interface ClientInfo {
  id: string
  name: string
  role: string
}
