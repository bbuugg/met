<template>
  <!-- User Info and Controls -->
  <div class="fixed top-6 right-6 z-50 flex items-center gap-3">
    <!-- User Info (only show when logged in) -->
    <div
      v-if="userStore.info.uuid"
      class="flex items-center gap-3 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 shadow-sm"
    >
      <!-- User Avatar -->
      <img
        referrerpolicy="no-referrer"
        :src="userStore.info.avatar"
        :alt="userStore.info.name"
        class="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
        @error="handleAvatarError"
      />
      <!-- User Name -->
      <span class="text-sm font-medium text-black dark:text-white">
        {{ userStore.info.name }}
      </span>
      <!-- Logout Button -->
      <button
        @click="handleLogout"
        class="text-sm text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
        title="退出登录"
      >
        退出
      </button>
    </div>
  </div>

  <!-- Control Buttons -->
  <div class="fixed top-6 left-6 z-50 flex gap-3">
    <!-- Theme Switch Button -->
    <button
      @click="toggleTheme"
      class="w-12 h-12 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-center shadow-sm transition-all"
      :title="currentTheme === 'light' ? 'Switch to Dark Theme' : '切换到亮色主题'"
    >
      <MoonIcon v-if="currentTheme === 'light'" class="h-5 w-5" />
      <SunIcon v-else class="h-5 w-5" />
    </button>

    <!-- Language Switch Button -->
    <button
      @click="toggleLanguage"
      class="w-12 h-12 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 font-medium text-sm flex items-center justify-center shadow-sm transition-all"
      :title="currentLanguage === 'en-US' ? 'Switch to Chinese' : '切换到英文'"
    >
      <span>{{ currentLanguage === 'en-US' ? '中' : 'EN' }}</span>
    </button>
  </div>

  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-black transition-colors">
    <!-- Subtle background pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, black 1px, transparent 0); background-size: 20px 20px;"></div>
    </div>

    <!-- 居中的用户信息输入区域 -->
    <div class="w-full max-w-md bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg relative z-10">
      <div class="flex flex-col gap-8 p-8">
        <div class="text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black dark:bg-white mb-6 transition-colors"
          >
            <VideoCameraIcon class="h-8 w-8 text-white dark:text-black" />
          </div>
          <h1 class="text-3xl font-bold mb-3 text-black dark:text-white">
            {{ t('tools.webRtcMeeting.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            {{ t('tools.webRtcMeeting.subtitle') }}
          </p>
        </div>

        <template v-if="userStore.info.uuid">
          <!-- 创建会议表单 -->
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-3">
              <label for="meetingName" class="font-semibold text-black dark:text-white text-sm">
                {{ t('tools.webRtcMeeting.entry.meetingName') }}
              </label>
              <input
                id="meetingName"
                v-model="meetingName"
                :placeholder="t('tools.webRtcMeeting.entry.meetingNamePlaceholder')"
                class="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
                @keyup.enter="handleCreateAndJoin"
              />
            </div>

            <button
              :disabled="isCreating || !meetingName.trim()"
              @click="handleCreateAndJoin"
              class="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <span v-if="!isCreating">{{ t('tools.webRtcMeeting.entry.createAndJoinMeeting') }}</span>
              <span v-else>创建中...</span>
              <ArrowRightIcon v-if="!isCreating" class="h-4 w-4" />
            </button>
          </div>

          <div class="relative flex items-center justify-center my-2">
            <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span class="mx-4 text-gray-500 dark:text-gray-400 text-sm font-medium bg-white dark:bg-black px-2">或</span>
            <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          <!-- 加入现有会议表单 -->
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-3">
              <label for="meetingId" class="font-semibold text-black dark:text-white text-sm">
                {{ t('tools.webRtcMeeting.entry.meetingId') }}
              </label>
              <input
                id="meetingId"
                v-model="meetingId"
                :placeholder="t('tools.webRtcMeeting.entry.meetingIdPlaceholder')"
                class="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
                @keyup.enter="handleJoin"
              />
            </div>

            <button
              :disabled="isJoinDisabled"
              @click="handleJoin"
              class="w-full py-3 px-4 border border-gray-200 dark:border-gray-700 text-black dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <span>{{ t('tools.webRtcMeeting.entry.joinMeeting') }}</span>
              <ArrowRightIcon class="h-4 w-4" />
            </button>
          </div>

          <!-- 房间列表 -->
          <div v-if="roomList.length > 0" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4">我的会议</h3>
            <div class="space-y-3 max-h-80 overflow-y-auto">
              <div
                v-for="room in roomList"
                :key="room.uuid"
                class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
              >
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-black dark:text-white truncate">
                    {{ room.name }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ formatDate(room.createdAt) }}
                  </div>
                </div>
                <div class="flex gap-2 ml-3">
                  <button 
                    @click="joinRoom(room.uuid)"
                    class="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    加入
                  </button>
                  <button 
                    @click="deleteRoomHandler(room.uuid)"
                    class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white transition-all"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div class="flex flex-col gap-6" v-else>
          <div class="text-center">
            <h2 class="text-xl font-semibold text-black dark:text-white mb-3">开始您的会议</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              登录后即可创建或加入会议
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <h3 class="font-medium text-black dark:text-white mb-3">测试账号</h3>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li class="font-mono">邮箱：bug@bug.com 密码：bug@bug.com</li>
              <li class="font-mono">邮箱：bbql@qq.com 密码：bbql@qq.com</li>
            </ul>
          </div>
          <button 
            @click="handleLogin" 
            class="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
          >
            登录
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-6 text-sm">
      <router-link
        to="/monitoring"
        class="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
      >
        系统监控
      </router-link>
      <span class="text-gray-400 dark:text-gray-600">|</span>
      <span class="text-gray-500 dark:text-gray-400">
        © {{ new Date().getFullYear() }} Met
      </span>
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