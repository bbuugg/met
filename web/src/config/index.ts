export const apiBaseURI = import.meta.env.VITE_API_BASE_URI
export const appId = import.meta.env.VITE_APP_ID

export const iceServers = [
  { urls: 'turn:turn.codeemo.cn:3478', username: 'codeemo', credential: 'codeemo' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]
