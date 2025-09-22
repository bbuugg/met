import axios from 'axios'

export function login() {
  return axios.get('/api/login')
}
