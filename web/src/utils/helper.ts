import { useUserStore } from '@/stores/user'
import { apiUrl } from '@/config'

const tokenKey = 'token'

export function getToken() {
  return localStorage.getItem(tokenKey)
}

export function setToken(token: string) {
  localStorage.setItem(tokenKey, token)
}

export function logout() {
  const userStore = useUserStore()
  setToken('')
  userStore.updateInfo({})
  window.location.href = `${apiUrl}/logout?redirect_uri=${encodeURIComponent(window.location.href)}`
}

export function login(redirectURI: string = '') {
  window.location.href = `${apiUrl}/login?redirect_uri=${encodeURIComponent(redirectURI || window.location.origin)}`
}

export async function getMediaDevices() {
  const videoDevices = []
  const audioDevices = []
  const audioOutputDevices = []
  const devices = await navigator.mediaDevices.enumerateDevices()
  for (let i = 0; i < devices.length; i++) {
    const device = devices[i]
    if (device.deviceId === 'default' || device.deviceId === 'communications') {
      continue
    }
    switch (device.kind) {
      case 'videoinput':
        videoDevices.push(device)
        break
      case 'audioinput':
        audioDevices.push(device)
        break
      case 'audiooutput':
        audioOutputDevices.push(device)
        break
    }
  }

  return [videoDevices, audioDevices, audioOutputDevices]
}
