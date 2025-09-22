import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types/user'
import { getUserInfo } from '@/api'

export const useUserStore = defineStore('user', () => {
  const info = ref<User>({} as User)
  const updateInfo = async () => {
    const { data } = await getUserInfo()
    Object.assign(info.value, data)
  }

  return { info, updateInfo }
})
