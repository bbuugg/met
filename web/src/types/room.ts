export interface RoomListItem {
    uuid: string
    name: string
    createdAt: string
    hasPassword: boolean
}

export interface CreateRoomRequest {
    name: string
    password?: string
}

export interface JoinRoomRequest {
    password?: string
}

export interface UpdateRoomRequest {
    name?: string
    password?: string
}

export enum Role {
    Master = 1,
    Member = 2,
}

export interface RoomMemberInfo {
    userId: number
    userName: string
    role: Role
    blocked: boolean
}