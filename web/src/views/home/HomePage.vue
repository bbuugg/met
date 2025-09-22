<template>
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
    <div class="w-full max-w-md glass-card rounded-xl bg-white dark:bg-gray-800">
      <div class="flex flex-col gap-6 p-8">
        <div class="text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 mb-4 shadow-lg"
          >
            <VideoCameraIcon class="h-8 w-8 text-white" />
          </div>
          <h2 class="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
            {{ t('tools.webRtcMeeting.title') }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ t('tools.webRtcMeeting.subtitle') }}
          </p>
        </div>

        <template v-if="userStore.info.uuid">
          <div class="flex flex-col gap-2">
            <label for="displayName" class="font-semibold text-gray-700 dark:text-gray-300">{{
              t('tools.webRtcMeeting.entry.displayName')
            }}</label>
            <input
              id="displayName"
              v-model="displayName"
              :placeholder="t('tools.webRtcMeeting.entry.displayNamePlaceholder')"
              class="input-field"
              @keyup.enter="handleJoin"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="meetingId" class="font-semibold text-gray-700 dark:text-gray-300">{{
              t('tools.webRtcMeeting.entry.meetingId')
            }}</label>
            <input
              id="meetingId"
              v-model="meetingId"
              :placeholder="t('tools.webRtcMeeting.entry.meetingIdPlaceholder')"
              class="input-field"
              @keyup.enter="handleJoin"
            />
          </div>

          <div class="flex justify-center pt-2">
            <a-button type="primary" size="large" @click="handleJoin">
              <span>{{ t('tools.webRtcMeeting.entry.joinMeeting') }}</span>
              <ArrowRightIcon class="h-5 w-5 ml-2" />
            </a-button>
          </div>
        </template>
        <div class="flex flex-col gap-6 p-8" v-else>
          <button @click="handleLogin" class="btn-primary">登录</button>
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
import { useMeetingStore } from '@/stores/meeting'
import { useUserStore } from '@/stores/user'
import { Message } from '@arco-design/web-vue'
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'
import { ArrowRightIcon, VideoCameraIcon } from '@heroicons/vue/24/solid'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const meetingStore = useMeetingStore()
const userStore = useUserStore()
const { t, locale } = useI18n()

// 表单数据
const displayName = ref('')
const meetingId = ref((route.query.roomId as string) || '')

// Reactive variable to track current language
const currentLanguage = computed(() => locale.value)
const currentTheme = ref<'light' | 'dark'>('dark')

const handleLogin = () => {
  window.location.href = `/login?redirect_uri=${encodeURIComponent(window.location.href)}`
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

onMounted(() => {
  // 设置初始主题
  currentTheme.value = theme.getCurrentTheme()

  // 监听主题变化
  theme.addListener(themeChangeListener)
})

onUnmounted(() => {
  // 移除主题监听器
  theme.removeListener(themeChangeListener)
})

// 计算属性：是否禁用加入按钮
const isJoinDisabled = computed(() => {
  return !meetingId.value.trim()
})

// 将显示名称存储到 sessionStorage
const setStoredDisplayName = (name: string) => {
  try {
    sessionStorage.setItem('displayName', name)
  } catch (e) {
    console.warn('Failed to save to sessionStorage:', e)
  }
}

// Event handlers for components
const handleJoin = () => {
  if (isJoinDisabled.value) {
    Message.error('请输入会议ID')
    return
  }
  const trimmedName = displayName.value.trim()
  meetingStore.displayName = trimmedName

  // 将显示名称存储到 sessionStorage
  setStoredDisplayName(trimmedName)

  // Navigate to meeting room without clientId in URL
  if (meetingId.value.trim()) {
    router.push({
      path: `/meeting/${meetingId.value.trim()}`
    })
  }
}
</script>
