import axios from 'axios'

export function login() {
  return axios.get('/api/login')
}

export function getUserInfo() {
  return axios.get('/api/info')
}

export function generateSignature(params: any) {
  return axios.get('/api/signature', { params })
}

export function getMinitorData() {
  return axios.get('/api/monitoring')
}

export function getRoomInfo(id: string) {
  return axios.get(`/api/room/${id}`)
}

// 添加创建房间的API接口
export function createRoom(data: { name: string; password?: string }) {
  return axios.post('/api/room', data)
}

// 获取房间列表
export function getRoomList() {
  return axios.get('/api/rooms')
}

// 删除房间
export function deleteRoom(uuid: string) {
  return axios.delete(`/api/room/${uuid}`)
}

// 加入房间
export function joinRoom(uuid: string, data: { password?: string }) {
  return axios.post(`/api/rooms/${uuid}/join`, data)
}

// 更新房间信息
export function updateRoom(uuid: string, data: { name?: string; password?: string }) {
  return axios.put(`/api/rooms/${uuid}/update`, data)
}

// 踢出用户
export function kickUser(uuid: string, data: { userId: number }) {
  return axios.post(`/api/rooms/${uuid}/kick`, data)
}

// 拉黑用户
export function blockUser(uuid: string, data: { userId: number }) {
  return axios.post(`/api/rooms/${uuid}/block`, data)
}

// 获取房间成员
export function getRoomMembers(uuid: string) {
  return axios.get(`/api/rooms/${uuid}/members`)
}