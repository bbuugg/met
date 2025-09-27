<template>
  <!-- User Info and Controls -->
  <div class="fixed top-4 right-4 z-50 flex items-center gap-3">
    <!-- User Info (only show when logged in) -->
    <div
      v-if="userStore.info.uuid"
      class="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg"
    >
      <!-- User Avatar -->
      <img
        referrerpolicy="no-referrer"
        :src="userStore.info.avatar"
        :alt="userStore.info.name"
        class="w-8 h-8 rounded-full object-cover"
        @error="handleAvatarError"
      />
      <!-- User Name -->
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ userStore.info.name }}
      </span>
      <!-- Logout Button -->
      <button
        @click="handleLogout"
        class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
        title="退出登录"
      >
        退出
      </button>
    </div>
  </div>

  <div class="fixed bottom-4 left-4 z-50 flex gap-2">
    <!-- Language Switch Button -->
    <button
      @click="toggleLanguage"
      class="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg flex items-center justify-center shadow-lg"
      :title="currentLanguage === 'en-US' ? 'Switch to Chinese' : '切换到英文'"
    >
      <span>{{ currentLanguage === 'en-US' ? '中' : 'EN' }}</span>
    </button>

    <!-- Theme Switch Button -->
    <button
      @click="toggleTheme"
      class="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg flex items-center justify-center shadow-lg"
      :title="currentTheme === 'light' ? 'Switch to Dark Theme' : '切换到亮色主题'"
    >
      <MoonIcon v-if="currentTheme === 'light'" class="h-6 w-6" />
      <SunIcon v-else class="h-6 w-6" />
    </button>
  </div>
  <div
    class="min-h-screen flex flex-col items-center justify-center p-4 relative bg-gray-50 dark:bg-gray-900"
  >
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20"
      ></div>
      <div
        class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-900 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20"
      ></div>
    </div>

    <!-- 居中的用户信息输入区域 -->
    <div class="w-full max-w-md glass-card rounded-xl bg-white dark:bg-gray-800 shadow-xl">
      <div class="flex flex-col gap-6 p-8">
        <div class="text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 mb-4 shadow-lg"
          >
            <VideoCameraIcon class="h-8 w-8 text-white" />
          </div>
          <h1 class="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
            {{ t('tools.webRtcMeeting.title') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ t('tools.webRtcMeeting.subtitle') }}
          </p>
        </div>

        <template v-if="userStore.info.uuid">
          <!-- 创建会议表单 -->
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label for="meetingName" class="font-semibold text-gray-700 dark:text-gray-300">
                {{ t('tools.webRtcMeeting.entry.meetingName') }}
              </label>
              <div class="relative">
                <input
                  id="meetingName"
                  v-model="meetingName"
                  :placeholder="t('tools.webRtcMeeting.entry.meetingNamePlaceholder')"
                  class="input-field w-full"
                  @keyup.enter="handleCreateAndJoin"
                />
              </div>
            </div>

            <div class="flex justify-center">
              <a-button
                type="primary"
                size="large"
                :loading="isCreating"
                @click="handleCreateAndJoin"
                class="w-full py-3 rounded-lg"
              >
                <span>{{ t('tools.webRtcMeeting.entry.createAndJoinMeeting') }}</span>
                <ArrowRightIcon class="h-5 w-5 ml-2" />
              </a-button>
            </div>
          </div>

          <div class="relative flex items-center justify-center">
            <div class="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span class="mx-4 text-gray-500 dark:text-gray-400 text-sm font-medium">或</span>
            <div class="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          <!-- 加入现有会议表单 -->
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label for="meetingId" class="font-semibold text-gray-700 dark:text-gray-300">
                {{ t('tools.webRtcMeeting.entry.meetingId') }}
              </label>
              <div class="relative">
                <input
                  id="meetingId"
                  v-model="meetingId"
                  :placeholder="t('tools.webRtcMeeting.entry.meetingIdPlaceholder')"
                  class="input-field w-full"
                  @keyup.enter="handleJoin"
                />
              </div>
            </div>

            <div class="flex justify-center">
              <a-button 
                type="outline" 
                size="large" 
                :disabled="isJoinDisabled" 
                @click="handleJoin"
                class="w-full py-3 rounded-lg"
              >
                <span>{{ t('tools.webRtcMeeting.entry.joinMeeting') }}</span>
                <ArrowRightIcon class="h-5 w-5 ml-2" />
              </a-button>
            </div>
          </div>

          <!-- 房间列表 -->
          <div v-if="roomList.length > 0" class="mt-8">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">我的会议</h3>
            <div class="space-y-3 max-h-80 overflow-y-auto pr-2">
              <div
                v-for="room in roomList"
                :key="room.uuid"
                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-md transition-all duration-200"
              >
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-800 dark:text-white truncate">
                    {{ room.name }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ formatDate(room.createdAt) }}
                  </div>
                </div>
                <div class="flex gap-2 ml-3">
                  <a-button 
                    type="primary" 
                    size="small" 
                    @click="joinRoom(room.uuid)"
                    class="rounded-lg"
                  >
                    加入
                  </a-button>
                  <a-button 
                    type="outline" 
                    size="small" 
                    status="danger" 
                    @click="deleteRoomHandler(room.uuid)"
                    class="rounded-lg"
                  >
                    关闭
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div class="flex flex-col gap-6 p-8" v-else>
          <div class="text-center">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-3">开始您的会议</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              登录后即可创建或加入会议
            </p>
          </div>
          <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
            <h3 class="font-medium text-blue-800 dark:text-blue-200 mb-2">测试账号</h3>
            <ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>邮箱：bug@bug.com 密码：bug@bug.com</li>
              <li>邮箱：bbql@qq.com 密码：bbql@qq.com</li>
            </ul>
          </div>
          <button 
            @click="handleLogin" 
            class="btn-primary py-3 rounded-lg"
          >
            登录
          </button>
        </div>
      </div>
    </div>

    <!-- 监控页面链接 -->
    <div class="absolute bottom-16 text-center">
      <router-link
        to="/monitoring"
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium"
      >
        系统监控
      </router-link>
    </div>

    <!-- Footer -->
    <div class="absolute bottom-6 text-gray-500 text-sm dark:text-gray-400">
      © {{ new Date().getFullYear() }} Met
    </div>
  </div>
</template>

<script setup lang="ts">
import theme from '@/services/theme'
import { useUserStore } from '@/stores/user'
import { Message } from '@arco-design/web-vue'
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'
import { ArrowRightIcon, VideoCameraIcon } from '@heroicons/vue/24/solid'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { handleAvatarError } from '@/utils/helper'
import { createRoom, getRoomInfo, getRoomList, deleteRoom } from '@/api'
import type { RoomListItem } from '@/types/room'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t, locale } = useI18n()

const meetingId = ref((route.query.roomId as string) || '')
const meetingName = ref('')
const isCreating = ref(false)
const roomList = ref<RoomListItem[]>([])

// Reactive variable to track current language
const currentLanguage = computed(() => locale.value)
const currentTheme = ref<'light' | 'dark'>('dark')

const handleLogin = () => {
  window.location.href = `/login?redirect_uri=${encodeURIComponent(window.location.href)}`
}

const handleLogout = () => {
  window.location.href = `/logout?redirect_uri=${encodeURIComponent(window.location.href)}`
}

// Function to toggle between languages
function toggleLanguage() {
  if (locale.value === 'en-US') {
    locale.value = 'zh-CN'
  } else {
    locale.value = 'en-US'
  }
}

// Function to toggle between themes
function toggleTheme() {
  theme.toggleTheme()
}

// Theme change listener
const themeChangeListener = (newTheme: 'light' | 'dark') => {
  currentTheme.value = newTheme
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  currentTheme.value = theme.getCurrentTheme()

  // 监听主题变化
  theme.addListener(themeChangeListener)

  // 获取房间列表
  fetchRoomList()
})

onUnmounted(() => {
  // 移除主题监听器
  theme.removeListener(themeChangeListener)
})

// 计算属性：是否禁用加入按钮
const isJoinDisabled = computed(() => {
  return !meetingId.value.trim()
})

// 获取房间列表
const fetchRoomList = async () => {
  try {
    const response = await getRoomList()
    if (response.code === 0) {
      roomList.value = response.data
    }
  } catch (error: any) {
    console.error('获取房间列表失败:', error)
  }
}

// Event handlers for components
const handleJoin = async () => {
  if (isJoinDisabled.value) {
    Message.error('请输入会议ID')
    return
  }

  const mid = meetingId.value.trim()
  try {
    await getRoomInfo(mid)
  } catch (error: any) {
    Message.error(error.message || '获取房间信息失败')
    return
  }

  // Navigate to meeting room without clientId in URL
  if (mid) {
    router.push({
      path: `/meeting/${mid}`
    })
  }
}

// 创建会议并加入
const handleCreateAndJoin = async () => {
  if (!meetingName.value.trim()) {
    Message.error('请输入会议名称')
    return
  }

  try {
    isCreating.value = true
    // 调用后端接口创建会议
    const response = await createRoom({ name: meetingName.value.trim() })
    if (response.code === 0) {
      // 使用创建的会议ID加入会议
      const roomId = response.data.uuid
      router.push({
        path: `/meeting/${roomId}`
      })
      
      // 创建成功后刷新房间列表
      await fetchRoomList()
    } else {
      Message.error(response.data.message || '创建会议失败')
    }
  } catch (error: any) {
    console.error('创建会议失败:', error)
    Message.error('创建会议失败')
  } finally {
    isCreating.value = false
  }
}

// 加入房间
const joinRoom = (roomId: string) => {
  router.push({
    path: `/meeting/${roomId}`
  })
}

// 删除房间
const deleteRoomHandler = async (roomId: string) => {
  try {
    const response = await deleteRoom(roomId)
    if (response.code === 0) {
      Message.success('房间已关闭')
      // 删除成功后刷新房间列表
      await fetchRoomList()
    } else {
      Message.error(response.message || '关闭房间失败')
    }
  } catch (error: any) {
    console.error('关闭房间失败:', error)
    Message.error('关闭房间失败')
  }
}
</script>