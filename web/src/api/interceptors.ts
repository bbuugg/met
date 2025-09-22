import { apiUrl } from '@/config'
import axios from 'axios'

axios.defaults.baseURL = apiUrl
axios.defaults.withCredentials = true

axios.interceptors.request.use(
    (config) => {
        config.headers['Content-Type'] = 'application/json'
        config.headers['Accept'] = 'application/json'
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
            return Promise.reject(new Error(data))
        }
        return data
    },
    (error) => {
        const escapedPath = ["/login", "/"];
        if (error.response?.status === 401 && !escapedPath.includes(window.location.pathname)) {
            window.location.href = `/login?redirect_uri=${window.location.href}`
            return
        }

        return Promise.reject(error.response.data)
    }
)