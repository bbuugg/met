<template>
  <!-- User Info and Controls -->
  <div class="fixed top-6 right-6 z-50 flex items-center gap-3">
    <!-- User Info (only show when logged in) -->
    <a :href="getUserCenterUrl()" v-if="userStore.info.uuid"
      class="cursor-pointer flex items-center gap-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 shadow-sm">
      <!-- User Avatar -->
      <img referrerpolicy="no-referrer" :src="userStore.info.avatar" :alt="userStore.info.name"
        class="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700"
        @error="handleAvatarError" />
      <!-- User Name -->
      <span class="text-sm font-medium text-black dark:text-white">
        {{ userStore.info.name }}
      </span>
      <!-- Logout Button -->
      <button @click="showLogoutConfirm"
        class="text-sm text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
        :title="t('tools.webRtcMeeting.entry.logout')">
        {{ t('tools.webRtcMeeting.entry.logout') }}
      </button>
    </a>
  </div>

  <!-- Control Buttons -->
  <div class="fixed top-6 left-6 z-50 flex gap-3">
    <!-- Theme Switch Button -->
    <button @click="toggleTheme"
      class="w-9 h-9 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-center shadow-sm transition-all"
      :title="currentTheme === 'light' ? 'Switch to Dark Theme' : '切换到亮色主题'">
      <MoonIcon v-if="currentTheme === 'light'" class="h-4 w-4" />
      <SunIcon v-else class="h-4 w-4" />
    </button>

    <!-- Language Switch Button -->
    <button @click="toggleLanguage"
      class="w-9 h-9 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 font-medium text-sm flex items-center justify-center shadow-sm transition-all"
      :title="currentLanguage === 'en-US' ? 'Switch to Chinese' : '切换到英文'">
      <span>{{ currentLanguage === 'en-US' ? '中' : 'EN' }}</span>
    </button>
  </div>

  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-black transition-colors">
    <!-- Subtle background pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
      <div class="absolute inset-0" style="
          background-image: radial-gradient(circle at 1px 1px, black 1px, transparent 0);
          background-size: 20px 20px;
        "></div>
    </div>

    <!-- 居中的用户信息输入区域 -->
    <div
      class="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg relative z-10">
      <div class="flex flex-col gap-4 p-8">
        <div class="flex justify-center">
          <img class="h-16" src="/images/logo.png" alt="" />
        </div>
        <p class="text-center text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {{
            userStore.info.uuid
              ? t('tools.webRtcMeeting.subtitle')
              : t('tools.webRtcMeeting.entry.loginToCreateOrJoin')
          }}
        </p>
        <template v-if="userStore.info.uuid">
          <!-- Tab 切换按钮 -->
          <div class="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 mb-4">
            <button @click="activeTab = 'create'" :class="[
              'flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all',
              activeTab === 'create'
                ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            ]">
              创建会议
            </button>
            <button @click="activeTab = 'join'" :class="[
              'flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all',
              activeTab === 'join'
                ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            ]">
              加入会议
            </button>
          </div>

          <!-- 创建会议表单 -->
          <div v-show="activeTab === 'create'" class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label for="meetingName" class="font-semibold text-black dark:text-white text-sm">
                {{ t('tools.webRtcMeeting.entry.meetingName') }}
              </label>
              <input id="meetingName" v-model="meetingName"
                :placeholder="t('tools.webRtcMeeting.entry.meetingNamePlaceholder')"
                class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm"
                @keyup.enter="handleCreateAndJoin" />
            </div>

            <div class="flex flex-col gap-2">
              <label for="roomPassword" class="font-semibold text-black dark:text-white text-sm">
                房间密码 (可选)
              </label>
              <input id="roomPassword" v-model="roomPassword" type="password" placeholder="设置房间密码，留空则无密码"
                class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm"
                @keyup.enter="handleCreateAndJoin" />
            </div>

            <button :disabled="isCreating || !meetingName.trim()" @click="handleCreateAndJoin"
              class="w-full py-2 px-4 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm">
              <span v-if="!isCreating">{{
                t('tools.webRtcMeeting.entry.createAndJoinMeeting')
              }}</span>
              <span v-else>{{ t('tools.webRtcMeeting.entry.creating') }}</span>
              <ArrowRightIcon v-if="!isCreating" class="h-4 w-4" />
            </button>
          </div>

          <!-- 加入现有会议表单 -->
          <div v-show="activeTab === 'join'" class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label for="meetingId" class="font-semibold text-black dark:text-white text-sm">
                {{ t('tools.webRtcMeeting.entry.meetingId') }}
              </label>
              <input id="meetingId" v-model="meetingId"
                :placeholder="t('tools.webRtcMeeting.entry.meetingIdPlaceholder')"
                class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm"
                @keyup.enter="handleJoin" />
            </div>

            <div class="flex flex-col gap-2">
              <label for="joinPassword" class="font-semibold text-black dark:text-white text-sm">
                房间密码 (如需要)
              </label>
              <input id="joinPassword" v-model="joinPassword" type="password" placeholder="输入房间密码"
                class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm"
                @keyup.enter="handleJoin" />
            </div>

            <button :disabled="isJoinDisabled" @click="handleJoin"
              class="w-full py-2 px-4 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm">
              <span>{{ t('tools.webRtcMeeting.entry.joinMeeting') }}</span>
              <ArrowRightIcon class="h-4 w-4" />
            </button>
          </div>
        </template>
        <div class="flex flex-col gap-6" v-else>
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <h3 class="font-medium text-black dark:text-white mb-3">
              {{ t('tools.webRtcMeeting.entry.testAccounts') }}
            </h3>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li class="font-mono">邮箱：bug@bug.com 密码：bug@bug.com</li>
              <li class="font-mono">邮箱：bbql@qq.com 密码：bbql@qq.com</li>
            </ul>
          </div>
          <button @click="handleLogin"
            class="w-full py-2 px-4 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all text-sm">
            {{ t('tools.webRtcMeeting.entry.login') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 会议列表浮动面板 - 右下角 -->
    <div v-if="userStore.info.uuid && roomList.length > 0"
      class="fixed bottom-20 right-6 z-40 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg transition-all duration-300"
      :class="{ 'h-auto': showMeetingList, '': !showMeetingList }">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 class="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
          <VideoCameraIcon class="h-4 w-4" />
          {{ t('tools.webRtcMeeting.entry.myMeetings') }}
          <span class="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {{ roomList.length }}
          </span>
        </h3>
        <button @click="showMeetingList = !showMeetingList"
          class="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors" :title="showMeetingList
            ? t('tools.webRtcMeeting.entry.collapse')
            : t('tools.webRtcMeeting.entry.expand')
            ">
          <svg class="h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': !showMeetingList }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <!-- 会议列表内容 -->
      <div v-show="showMeetingList" class="p-3 space-y-2 max-h-60 overflow-y-auto">
        <div v-for="room in roomList" :key="room.uuid"
          class="group flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <div class="font-medium text-black dark:text-white truncate text-sm">
                {{ room.name }}
              </div>
              <svg v-if="room.hasPassword" class="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none"
                stroke="currentColor" viewBox="0 0 24 24" title="需要密码">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ formatDate(room.createdAt) }}
            </div>
          </div>
          <div class="flex gap-1.5 ml-3 opacity-70 group-hover:opacity-100 transition-opacity">
            <button @click="joinRoom(room.uuid)"
              class="px-2.5 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              :title="t('tools.webRtcMeeting.entry.join')">
              {{ t('tools.webRtcMeeting.entry.join') }}
            </button>

            <button @click="deleteRoomHandler(room.uuid)"
              class="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-xs font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600 transition-all"
              :title="t('tools.webRtcMeeting.entry.close')">
              {{ t('tools.webRtcMeeting.entry.close') }}
            </button>
          </div>
        </div>

        <!-- 空状态提示 -->
        <div v-if="roomList.length === 0" class="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          {{ t('tools.webRtcMeeting.entry.noMeetings') }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="fixed bottom-6 left-6 flex items-center gap-6 text-sm">
      <router-link to="/monitoring"
        class="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium transition-colors">
        {{ t('tools.webRtcMeeting.entry.systemMonitoring') }}
      </router-link>
      <span class="text-gray-400 dark:text-gray-600">|</span>
      <a class="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
        href="https://qm.qq.com/q/ayOVUpwjde">QQ群:1064753745</a>
      <span class="text-gray-400 dark:text-gray-600">|</span>
      <span class="text-gray-500 dark:text-gray-400">
        {{ t('tools.webRtcMeeting.entry.copyright', { year: new Date().getFullYear() }) }}
      </span>
    </div>
  </div>

  <!-- 退出登录确认 Modal -->
  <div v-if="showLogoutModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="cancelLogout">
    <div
      class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden"
      @click.stop>
      <!-- 模态框内容 -->
      <div class="p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <!-- 标题区域 -->
        <div class="text-center mb-4 sm:mb-6">
          <div
            class="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-600 mb-3 sm:mb-4 transition-colors">
            <ArrowRightIcon class="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <h2 class="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-black dark:text-white">
            {{ t('tools.webRtcMeeting.entry.logoutConfirmTitle') }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed px-2 sm:px-0">
            {{ t('tools.webRtcMeeting.entry.logoutConfirmMessage') }}
          </p>
        </div>

        <!-- 按钮区域 -->
        <div class="flex gap-2">
          <button @click="confirmLogout"
            class="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-all flex items-center justify-center gap-1.5 order-2 sm:order-1 text-sm">
            <ArrowRightIcon class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">{{ t('tools.webRtcMeeting.entry.logoutConfirm') }}</span>
            <span class="sm:hidden">退出</span>
          </button>
          <button @click="cancelLogout"
            class="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 text-black dark:text-white font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-all order-1 sm:order-2 text-sm flex items-center justify-center gap-1.5">
            <span class="hidden sm:inline">{{ t('tools.webRtcMeeting.entry.logoutCancel') }}</span>
            <span class="sm:hidden">取消</span>
          </button>
        </div>
      </div>
    </div>
  </div>


</template>

<script setup lang="ts">
import theme from '@/services/theme'
import { useUserStore } from '@/stores/user'
import toast from '@/utils/toast'
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'
import { ArrowRightIcon, VideoCameraIcon } from '@heroicons/vue/24/solid'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { handleAvatarError } from '@/utils/helper'
import { createRoom, getRoomList, deleteRoom, joinRoom as joinRoomAPI } from '@/api'
import type { RoomListItem } from '@/types/room'
import { getUserCenterUrl } from '@/utils/helper'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t, locale } = useI18n()

const meetingId = ref((route.query.roomId as string) || '')
const meetingName = ref('')
const roomPassword = ref('') // 创建房间时的密码
const joinPassword = ref('') // 加入房间时的密码
const isCreating = ref(false)
const roomList = ref<RoomListItem[]>([])
const showMeetingList = ref(true) // 控制会议列表展开/收起
const showLogoutModal = ref(false) // 控制退出登录确认 modal
const activeTab = ref<'create' | 'join'>('create') // 控制 tab 切换


// Reactive variable to track current language
const currentLanguage = computed(() => locale.value)
const currentTheme = ref<'light' | 'dark'>('dark')

const handleLogin = () => {
  const searchParams = new URLSearchParams(window.location.search)
  window.location.href = `/login?redirect_uri=${encodeURIComponent(searchParams.get('redirect_uri') || window.location.href)}`
}

// 显示退出登录确认 modal
const showLogoutConfirm = () => {
  showLogoutModal.value = true
}

// 确认退出登录
const confirmLogout = () => {
  showLogoutModal.value = false
  window.location.href = `/logout?redirect_uri=${encodeURIComponent(window.location.href)}`
}

// 取消退出登录
const cancelLogout = () => {
  showLogoutModal.value = false
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

  // 如果 URL 中有 roomId 参数，自动切换到"加入会议" tab
  if (meetingId.value) {
    activeTab.value = 'join'
  }
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
    toast.error('请输入会议ID')
    return
  }

  const mid = meetingId.value.trim()
  try {
    // 先尝试加入房间（包含密码验证）
    await joinRoomAPI(mid, { password: joinPassword.value.trim() || '' })

    // 加入成功后跳转到会议室
    router.push({
      path: `/meeting/${mid}`
    })
  } catch (error: any) {
    if (error.response?.status === 401) {
      toast.error('房间密码错误')
    } else if (error.response?.status === 403) {
      toast.error('您已被该房间拉黑')
    } else if (error.response?.status === 404) {
      toast.error('房间不存在')
    } else {
      toast.error(error.response?.data?.message || '加入房间失败')
    }
  }
}

// 创建会议并加入
const handleCreateAndJoin = async () => {
  if (!meetingName.value.trim()) {
    toast.error('请输入会议名称')
    return
  }

  try {
    isCreating.value = true
    // 调用后端接口创建会议
    const response = await createRoom({
      name: meetingName.value.trim(),
      password: roomPassword.value.trim() || undefined
    })
    if (response.code === 0) {
      // 使用创建的会议ID加入会议
      const roomId = response.data.uuid
      router.push({
        path: `/meeting/${roomId}`
      })

      // 创建成功后刷新房间列表
      await fetchRoomList()
    } else {
      toast.error(response.data.message || '创建会议失败')
    }
  } catch (error: any) {
    console.error('创建会议失败:', error)
    toast.error('创建会议失败')
  } finally {
    isCreating.value = false
  }
}

// 加入房间
const joinRoom = async (roomId: string) => {
  // 检查房间是否需要密码
  const room = roomList.value.find(r => r.uuid === roomId)
  if (room?.hasPassword) {
    // 如果需要密码，提示用户输入
    const password = prompt('请输入房间密码:')
    if (password === null) return // 用户取消

    try {
      await joinRoomAPI(roomId, { password })
      router.push({
        path: `/meeting/${roomId}`
      })
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('房间密码错误')
      } else if (error.response?.status === 403) {
        toast.error('您已被该房间拉黑')
      } else {
        toast.error(error.response?.data?.message || '加入房间失败')
      }
    }
  } else {
    // 无密码房间直接加入
    try {
      await joinRoomAPI(roomId, {})
      router.push({
        path: `/meeting/${roomId}`
      })
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('您已被该房间拉黑')
      } else {
        toast.error(error.response?.data?.message || '加入房间失败')
      }
    }
  }
}



// 删除房间
const deleteRoomHandler = async (roomId: string) => {
  try {
    const response = await deleteRoom(roomId)
    if (response.code === 0) {
      toast.success('房间已关闭')
      // 删除成功后刷新房间列表
      await fetchRoomList()
    } else {
      toast.error(response.message || '关闭房间失败')
    }
  } catch (error: any) {
    console.error('关闭房间失败:', error)
    toast.error('关闭房间失败')
  }
}
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* 会议列表动画 */
.group {
  animation: fadeInUp 0.2s ease-out;
}

/* 自定义模态框样式 */
.fixed.inset-0 {
  animation: fadeIn 0.2s ease-out;
}

.fixed.inset-0>div {
  animation: slideUp 0.3s ease-out;
}

/* Tab 切换动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
