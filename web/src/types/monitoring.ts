export interface RoomInfo {
  id: string
  clientCount: number
  startTime: string
  clients: ClientInfo[]
}

export interface ClientInfo {
  id: string
  name: string
  role: string
}