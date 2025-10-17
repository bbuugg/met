import { getUserInfo } from '@/api'
import type { User } from '@/types/user'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const info = ref<User>({} as User)
  const updateInfo = async () => {
    const { data } = await getUserInfo()
    info.value = data
  }

  return { info, updateInfo }
})
