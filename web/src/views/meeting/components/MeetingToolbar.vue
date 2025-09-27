<template>
  <div class="px-6 py-3 flex justify-between items-center bg-white dark:bg-gray-800">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <UserGroupIcon class="h-5 w-5 text-indigo-400" />
        <span class="text-gray-800 dark:text-white font-medium">{{ meetingStore.roomName }}</span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Language Switch Button -->
      <button
        @click="toggleLanguage"
        class="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-sm flex items-center justify-center shadow transition-colors duration-200"
        :title="currentLanguage === 'en-US' ? 'Switch to Chinese' : '切换到英文'"
      >
        <span>{{ currentLanguage === 'en-US' ? '中' : 'EN' }}</span>
      </button>

      <!-- Theme Switch Button -->
      <button
        @click="toggleTheme"
        class="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-sm flex items-center justify-center shadow transition-colors duration-200"
        :title="currentTheme === 'light' ? 'Switch to Dark Theme' : '切换到亮色主题'"
      >
        <MoonIcon v-if="currentTheme === 'light'" class="h-5 w-5" />
        <SunIcon v-else class="h-5 w-5" />
      </button>

      <button
        @click="showShareModal"
        class="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-sm flex items-center justify-center shadow transition-colors duration-200"
        :title="t('tools.webRtcMeeting.meeting.share')"
      >
        <ShareIcon class="h-5 w-5" />
      </button>
    </div>
  </div>

  <!-- Share Meeting Modal using Arco Design -->
  <a-modal
    v-model:visible="shareModalVisible"
    :title="t('tools.webRtcMeeting.meeting.shareMeeting')"
    :ok-text="t('tools.webRtcMeeting.meeting.copyLink')"
    :cancel-text="t('tools.webRtcMeeting.meeting.close')"
    :width="400"
    @ok="copyLink"
    @cancel="closeModal"
  >
    <div class="flex flex-col gap-6">
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 mb-4 shadow-lg"
        >
          <LinkIcon class="h-8 w-8 text-white" />
        </div>
        <h2 class="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
          {{ t('tools.webRtcMeeting.meeting.shareMeeting') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          {{ t('tools.webRtcMeeting.meeting.invitedToMeeting') }}
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-medium text-gray-700 dark:text-gray-300">{{
          t('tools.webRtcMeeting.meeting.meetingLink')
        }}</label>
        <div
          class="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center border border-gray-200 dark:border-gray-600"
        >
          <LinkIcon class="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
          <span class="font-medium text-gray-800 dark:text-white truncate">{{ meetingLink }}</span>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { useMeetingStore } from '@/stores/meeting'
import { Modal as AModal, Message } from '@arco-design/web-vue'
import { LinkIcon, UserGroupIcon, MoonIcon, SunIcon, ShareIcon } from '@heroicons/vue/24/outline'
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import theme from '@/services/theme'

const { t, locale } = useI18n()
const meetingStore = useMeetingStore()
const shareModalVisible = ref(false)
const roomId = computed(() => meetingStore.roomId)

// Reactive variable to track current language
const currentLanguage = computed(() => locale.value)
const currentTheme = ref<'light' | 'dark'>('dark')

// Initialize theme
currentTheme.value = theme.getCurrentTheme()

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
  currentTheme.value = theme.getCurrentTheme()
}

// Theme change listener
const themeChangeListener = (newTheme: 'light' | 'dark') => {
  currentTheme.value = newTheme
}

// Add theme listener on mount
theme.addListener(themeChangeListener)

// Remove theme listener on unmount
onUnmounted(() => {
  theme.removeListener(themeChangeListener)
})

// 计算不包含clientId的会议链接
const meetingLink = computed(() => {
  const baseUrl = window.location.origin
  return `${baseUrl}/meeting/${roomId.value}`
})

function showShareModal() {
  shareModalVisible.value = true
}

function closeModal() {
  shareModalVisible.value = false
}

function copyLink() {
  navigator.clipboard.writeText(meetingLink.value).then(() => {
    Message.success(t('tools.webRtcMeeting.meeting.copySuccess'))
  })
}
</script>
