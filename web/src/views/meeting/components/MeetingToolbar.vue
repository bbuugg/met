<template>
  <div class="px-6 py-4 flex justify-between items-center bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 transition-colors">
    <!-- 左侧：会议信息 -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center">
          <UserGroupIcon class="h-4 w-4 text-white dark:text-black" />
        </div>
        <div class="flex flex-col">
          <span class="text-black dark:text-white font-semibold text-sm">{{ meetingStore.roomName }}</span>
          <div class="flex items-center gap-2 text-xs">
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-gray-600 dark:text-gray-400">会议进行中</span>
            </div>
            <span class="text-gray-400 dark:text-gray-600">•</span>
            <span class="text-gray-600 dark:text-gray-400">{{ participantCount }} 人参与</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：控制按钮 -->
    <div class="flex items-center gap-2">
      <!-- Theme Switch Button -->
      <button
        @click="toggleTheme"
        class="w-10 h-10 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-center shadow-sm transition-all"
        :title="currentTheme === 'light' ? 'Switch to Dark Theme' : '切换到亮色主题'"
      >
        <MoonIcon v-if="currentTheme === 'light'" class="h-4 w-4" />
        <SunIcon v-else class="h-4 w-4" />
      </button>

      <!-- Language Switch Button -->
      <button
        @click="toggleLanguage"
        class="w-10 h-10 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 font-medium text-sm flex items-center justify-center shadow-sm transition-all"
        :title="currentLanguage === 'en-US' ? 'Switch to Chinese' : '切换到英文'"
      >
        <span>{{ currentLanguage === 'en-US' ? '中' : 'EN' }}</span>
      </button>

      <!-- Share Button -->
      <button
        @click="showShareModal"
        class="w-10 h-10 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-center shadow-sm transition-all"
        :title="t('tools.webRtcMeeting.meeting.share')"
      >
        <ShareIcon class="h-4 w-4" />
      </button>
    </div>
  </div>

  <!-- Share Meeting Modal -->
  <div
    v-if="shareModalVisible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="closeModal"
  >
    <div
      class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden"
      @click.stop
    >
      <!-- 模态框内容 -->
      <div class="p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <!-- 标题区域 -->
        <div class="text-center mb-6 sm:mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black dark:bg-white mb-4 sm:mb-6 transition-colors">
            <LinkIcon class="h-6 w-6 sm:h-8 sm:w-8 text-white dark:text-black" />
          </div>
          <h2 class="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-black dark:text-white">
            {{ t('tools.webRtcMeeting.meeting.shareMeeting') }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed px-2 sm:px-0">
            {{ t('tools.webRtcMeeting.meeting.invitedToMeeting') }}
          </p>
        </div>

        <!-- 链接区域 -->
        <div class="mb-6 sm:mb-8">
          <label class="font-semibold text-black dark:text-white text-sm mb-3 block">{{
            t('tools.webRtcMeeting.meeting.meetingLink')
          }}</label>
          <div
            class="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <div class="flex items-center gap-3 mb-3">
              <LinkIcon class="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span class="font-medium text-black dark:text-white truncate text-sm">{{ meetingLink }}</span>
            </div>
            <button
              @click="copyLink"
              class="w-full py-2 px-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              复制链接
            </button>
          </div>
        </div>

        <!-- 按钮区域 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="copyLink"
            class="flex-1 py-3 px-4 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center justify-center gap-2 order-2 sm:order-1"
          >
            <LinkIcon class="h-4 w-4" />
            <span class="hidden sm:inline">{{ t('tools.webRtcMeeting.meeting.copyLink') }}</span>
            <span class="sm:hidden">复制</span>
          </button>
          <button
            @click="closeModal"
            class="px-4 sm:px-6 py-3 border border-gray-200 dark:border-gray-700 text-black dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all order-1 sm:order-2"
          >
            <span class="hidden sm:inline">{{ t('tools.webRtcMeeting.meeting.close') }}</span>
            <span class="sm:hidden">关闭</span>
          </button>
        </div>
      </div>
    </div>
  </div>
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

// 计算参与者数量
const participantCount = computed(() => {
  return meetingStore.participantsList.length
})

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
    // 复制成功后自动关闭模态框
    setTimeout(() => {
      closeModal()
    }, 1000)
  }).catch(() => {
    Message.error(t('tools.webRtcMeeting.meeting.copyFailed'))
  })
}
</script>

<style scoped>
/* 状态指示器动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 按钮悬停效果 */
button {
  transition: all 0.2s ease-in-out;
}

button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

/* 模态框内容动画 */
.flex.flex-col.gap-6 > * {
  animation: fadeInUp 0.3s ease-out;
}

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

/* 自定义模态框样式 */
.fixed.inset-0 {
  animation: fadeIn 0.2s ease-out;
}

.fixed.inset-0 > div {
  animation: slideUp 0.3s ease-out;
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

/* 移动端优化 */
@media (max-width: 640px) {
  .max-h-\\[90vh\\] {
    max-height: calc(100vh - 2rem) !important;
  }
  
  .flex-col button {
    min-height: 44px;
  }
}
</style>
