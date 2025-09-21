import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const info = ref<User>({} as User)
  const updateInfo = (newInfo: object) => {
    Object.assign(info.value, newInfo)
  }

  return { info, updateInfo }
})
