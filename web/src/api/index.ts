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
export function createRoom(data: { name: string }) {
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