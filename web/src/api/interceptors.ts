import axios from 'axios'
import { getToken } from '@/utils/helper'
import { apiBaseURI } from '@/config'
import toast from '@/services/toast'

const escapeLogin = ['/login/token']
axios.defaults.withCredentials = true
axios.defaults.baseURL = apiBaseURI

axios.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = 'application/json'
    config.headers['Accept'] = 'application/json'
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
// 添加响应拦截器
axios.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code !== 0) {
      toast.error('出错了', data.message, 3000)
      return Promise.reject(new Error(data.message))
    }

    return response.data.data
  },
  (error) => {
    if (!escapeLogin.includes(error.config.url) && error.response?.status === 401) {
      window.location.href = `${apiBaseURI}/login?redirect_uri=${window.location.href}`
      return
    }
    if (error.response?.status !== 401) {
      toast.error('出错了', error.response?.data?.message || '网络错误', 3000)
    }
    return Promise.reject(error)
  }
)