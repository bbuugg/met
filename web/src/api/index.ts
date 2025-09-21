import axios from 'axios'
import { apiBaseURI, appId } from '@/config'
export function getWebsocketUrl(params: any) {
  const usp = new URLSearchParams(params)
  return `${apiBaseURI}/api/websocket?${usp}`
}

export function login() {
  return axios.get('/api/login')
}

export function userSignature() {
  return axios.post(`/api/signature?AppID=${appId}`)
}
