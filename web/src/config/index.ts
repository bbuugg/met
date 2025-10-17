export const apiUrl = import.meta.env.VITE_API_URL || "";
export const wsUrl = import.meta.env.VITE_WS_URL || "";

export const iceServers = [
  { urls: 'turn:turn.codeemo.cn:3478', username: 'codeemo', credential: 'codeemo' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]
