<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click="$emit('close')">
    <div
      class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
      @click.stop>
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-black dark:bg-white">
            <CogIcon class="h-4 w-4 text-white dark:text-black" />
          </div>
          <h2 class="text-lg sm:text-xl font-bold text-black dark:text-white">
            房间管理
          </h2>
        </div>
        <button @click="$emit('close')"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <XMarkIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <!-- 主体内容 -->
      <div class="flex h-[calc(90vh-80px)]">
        <!-- 左侧菜单 -->
        <div class="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <nav class="p-4 space-y-2">
            <button @click="activeTab = 'basic'" :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left',
              activeTab === 'basic'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]">
              <HomeIcon class="h-4 w-4" />
              基本信息
            </button>
            <button @click="activeTab = 'members'" :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left',
              activeTab === 'members'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]">
              <UsersIcon class="h-4 w-4" />
              成员管理
            </button>
          </nav>
        </div>

        <!-- 右侧内容区域 -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-4 sm:p-6">
            <!-- 基本信息标签页 -->
            <div v-if="activeTab === 'basic'" class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-black dark:text-white mb-4">房间基本信息</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      房间名称
                    </label>
                    <input v-model="roomName" type="text"
                      class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all text-sm"
                      placeholder="输入房间名称" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      房间密码
                    </label>
                    <input v-model="roomPassword" type="password"
                      class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all text-sm"
                      placeholder="设置房间密码，留空则无密码" />
                  </div>
                </div>
              </div>

              <!-- 保存按钮 -->
              <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button @click="updateRoomInfo" :disabled="updating"
                  class="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  <CheckIcon v-if="!updating" class="h-4 w-4" />
                  <div v-else
                    class="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin">
                  </div>
                  {{ updating ? '保存中...' : '保存更改' }}
                </button>
              </div>
            </div>

            <!-- 成员管理标签页 -->
            <div v-if="activeTab === 'members'" class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-black dark:text-white mb-4">房间成员</h3>

                <div class="space-y-3">
                  <div v-for="member in members" :key="member.userId"
                    class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        class="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                        <span class="text-white dark:text-black text-sm font-medium">
                          {{ member.userName.charAt(0).toUpperCase() }}
                        </span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-sm font-medium text-black dark:text-white truncate">
                          {{ member.userName }}
                        </div>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="px-2 py-0.5 text-xs rounded-full font-medium" :class="member.role === Role.Master
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'">
                            {{ member.role === Role.Master ? '管理员' : '成员' }}
                          </span>
                          <span v-if="member.blocked"
                            class="px-2 py-0.5 text-xs rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                            已拉黑
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="flex gap-2 ml-3" v-if="member.role !== Role.Master">
                      <button @click="kickUser(member.userId)"
                        class="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        踢出
                      </button>
                      <button @click="blockUser(member.userId)" :disabled="member.blocked"
                        class="px-3 py-1.5 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {{ member.blocked ? '已拉黑' : '拉黑' }}
                      </button>
                    </div>
                  </div>

                  <!-- 空状态 -->
                  <div v-if="members.length === 0" class="text-center py-12">
                    <div
                      class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <UsersIcon class="h-8 w-8 text-gray-400" />
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">暂无成员</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import toast from '@/utils/toast'
import { updateRoom, kickUser as kickUserAPI, blockUser as blockUserAPI, getRoomMembers } from '@/api'
import { Role, type RoomMemberInfo } from '@/types/room'
import {
  CogIcon,
  HomeIcon,
  UsersIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

interface Props {
  roomUuid: string
  initialName: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  updated: []
}>()

// 响应式数据
const activeTab = ref<'basic' | 'members'>('basic')
const roomName = ref(props.initialName)
const roomPassword = ref('')
const updating = ref(false)
const members = ref<RoomMemberInfo[]>([])

// 获取房间成员
const fetchMembers = async () => {
  try {
    const response = await getRoomMembers(props.roomUuid)
    if (response.code === 0) {
      members.value = response.data
    }
  } catch (error: any) {
    console.error('获取房间成员失败:', error)
    toast.error('获取房间成员失败')
  }
}

// 更新房间信息
const updateRoomInfo = async () => {
  if (!roomName.value.trim()) {
    toast.error('请输入房间名称')
    return
  }

  try {
    updating.value = true
    const response = await updateRoom(props.roomUuid, {
      name: roomName.value.trim(),
      password: roomPassword.value.trim() || undefined
    })

    if (response.code === 0) {
      toast.success('房间信息更新成功')
      emit('updated')
    } else {
      toast.error(response.message || '更新失败')
    }
  } catch (error: any) {
    console.error('更新房间信息失败:', error)
    toast.error(error.response?.data?.message || '更新失败')
  } finally {
    updating.value = false
  }
}

// 踢出用户
const kickUser = async (userId: number) => {
  try {
    const response = await kickUserAPI(props.roomUuid, { userId })
    if (response.code === 0) {
      toast.success('用户已被踢出')
      await fetchMembers() // 刷新成员列表
    } else {
      toast.error(response.message || '踢出失败')
    }
  } catch (error: any) {
    console.error('踢出用户失败:', error)
    toast.error(error.response?.data?.message || '踢出失败')
  }
}

// 拉黑用户
const blockUser = async (userId: number) => {
  try {
    const response = await blockUserAPI(props.roomUuid, { userId })
    if (response.code === 0) {
      toast.success('用户已被拉黑')
      await fetchMembers() // 刷新成员列表
    } else {
      toast.error(response.message || '拉黑失败')
    }
  } catch (error: any) {
    console.error('拉黑用户失败:', error)
    toast.error(error.response?.data?.message || '拉黑失败')
  }
}

onMounted(() => {
  fetchMembers()
})
</script>
