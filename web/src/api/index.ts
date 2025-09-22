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