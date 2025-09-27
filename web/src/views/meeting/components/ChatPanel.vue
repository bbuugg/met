<template>
  <div class="w-full md:w-96 h-full bg-white dark:bg-gray-800 flex flex-col">
    <!-- 聊天面板头部 -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ t('tools.webRtcMeeting.chat.title') }}
      </h3>
      <button
        @click="$emit('close')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        :title="t('tools.webRtcMeeting.chat.close')"
      >
        <XMarkIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>

    <div
      class="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-y-auto"
    >
      <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth" ref="messagesContainer">
        <div
          v-for="message in chatMessages"
          :key="message.id"
          class="flex gap-3"
          :class="{ 'flex-row-reverse': message.senderId === clientId }"
        >
          <!-- 头像 -->
          <div class="flex-shrink-0">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden"
              :class="getAvatarClass(message.senderId)"
              :title="message.senderName"
            >
              <img
                v-if="getParticipantAvatar(message.senderId)"
                :src="getParticipantAvatar(message.senderId)!"
                :alt="message.senderName"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ getAvatarText(message.senderName) }}</span>
            </div>
          </div>

          <!-- 消息内容区域 -->
          <div class="flex flex-col gap-1 max-w-[70%] min-w-0" :class="{ 'items-end': message.senderId === clientId }">
            <!-- 发送者信息 -->
            <div
              class="flex gap-2 items-center text-xs text-gray-500 dark:text-gray-400"
              :class="{ 'flex-row-reverse': message.senderId === clientId }"
            >
              <span class="font-medium">{{ message.senderName }}</span>
              <span>{{ formatTime(message.timestamp) }}</span>
            </div>

            <!-- 消息气泡 -->
            <div
              class="relative w-fit max-w-full px-2 py-2 rounded-2xl break-words shadow-md"
              :class="[
                message.senderId === clientId
                  ? 'bg-blue-500 text-white rounded-tr-sm'
                  : message.type === 'file'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded-tl-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-tl-sm'
              ]"
            >
              <template v-if="message.type === 'file'">
                <!-- Image preview -->
                <div
                  v-if="message.fileType && message.fileType.startsWith('image/') && message.fileUrl"
                  class="flex flex-col gap-2 min-w-0"
                >
                  <img
                    :src="message.fileUrl"
                    :alt="message.fileName"
                    class="max-w-full max-h-48 rounded-lg object-contain"
                  />
                  <div class="flex items-center gap-2 min-w-0">
                    <DocumentIcon class="h-4 w-4 flex-shrink-0" />
                    <span class="truncate min-w-0">{{ message.fileName }}</span>
                    <span class="text-xs whitespace-nowrap flex-shrink-0"
                      >({{ formatFileSize(message.fileSize || 0) }})</span
                    >
                    <button
                      @click="downloadFile(message.fileUrl, message.fileName)"
                      class="ml-2 p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-xs flex items-center flex-shrink-0"
                    >
                      <ArrowDownTrayIcon class="h-3 w-3 mr-1" />
                      <span>{{ t('tools.webRtcMeeting.chat.download') }}</span>
                    </button>
                  </div>
                </div>

                <!-- Video preview -->
                <div
                  v-else-if="
                    message.fileType && message.fileType.startsWith('video/') && message.fileUrl
                  "
                  class="flex flex-col gap-2 min-w-0"
                >
                  <video
                    :src="message.fileUrl"
                    controls
                    class="max-w-full max-h-48 rounded-lg"
                  ></video>
                  <div class="flex items-center gap-2 min-w-0">
                    <DocumentIcon class="h-4 w-4 flex-shrink-0" />
                    <span class="truncate min-w-0">{{ message.fileName }}</span>
                    <span class="text-xs whitespace-nowrap flex-shrink-0"
                      >({{ formatFileSize(message.fileSize || 0) }})</span
                    >
                    <button
                      @click="downloadFile(message.fileUrl, message.fileName)"
                      class="ml-2 p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-xs flex items-center flex-shrink-0"
                    >
                      <ArrowDownTrayIcon class="h-3 w-3 mr-1" />
                      <span>{{ t('tools.webRtcMeeting.chat.download') }}</span>
                    </button>
                  </div>
                </div>

                <!-- Other file types -->
                <div v-else class="flex items-center gap-2 min-w-0">
                  <DocumentIcon class="h-4 w-4 flex-shrink-0" />
                  <span class="truncate min-w-0">{{ message.content.replace('File received: ', '') }}</span>
                  <button
                    @click="downloadFileFromMessage(message)"
                    class="ml-2 p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-xs flex items-center flex-shrink-0"
                  >
                    <ArrowDownTrayIcon class="h-3 w-3 mr-1" />
                    <span>{{ t('tools.webRtcMeeting.chat.download') }}</span>
                  </button>
                </div>
              </template>
              <template v-else>
                <span class="break-words">{{ message.content }}</span>
              </template>
            </div>
          </div>
        </div>

        <div
          v-if="chatMessages.length === 0"
          class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center"
        >
          <ChatBubbleLeftRightIcon class="h-12 w-12 mb-4" />
          <p>{{ t('tools.webRtcMeeting.chat.placeholder') }}</p>
        </div>
      </div>

      <!-- Unread messages indicator -->
      <div
        v-if="unreadMessageCount > 0"
        @click="() => scrollToBottom()"
        class="flex items-center justify-center p-2 bg-blue-500 text-white text-sm cursor-pointer hover:bg-blue-600 transition-colors"
      >
        {{ t('tools.webRtcMeeting.chat.unreadMessages', { count: unreadMessageCount }) }}
      </div>

      <div
        class="flex gap-2 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
      >
        <input ref="fileInputRef" type="file" multiple @change="handleFileSelect" class="hidden" />
        <button
          @click="() => fileInputRef?.click()"
          class="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center shadow-md"
          :title="t('tools.webRtcMeeting.chat.sendFile')"
        >
          <PaperClipIcon class="h-5 w-5" />
        </button>
        <input
          v-model="newMessage"
          :placeholder="t('tools.webRtcMeeting.chat.placeholder')"
          @keyup.enter="sendMessage"
          class="flex-1 bg-gray-50 dark:bg-gray-700 border-0 text-gray-800 dark:text-white rounded-xl shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none px-4 py-2 input-field"
        />
        <button
          @click="sendMessage"
          :disabled="!newMessage.trim()"
          class="w-10 h-10 rounded-full flex items-center justify-center shadow-md transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="t('tools.webRtcMeeting.chat.send')"
        >
          <PaperAirplaneIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { useMeetingStore } from '@/stores/meeting'
import { Message } from '@arco-design/web-vue'
import {
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 定义emit事件
defineEmits<{
  close: []
}>()

const { t } = useI18n()
const meetingStore = useMeetingStore()

const newMessage = ref('')
const messagesContainer = ref<HTMLElement>()
const fileInputRef = ref<HTMLInputElement>()

// 添加用于跟踪滚动状态的变量
const isScrolledToBottom = ref(true)
const unreadMessageCount = ref(0)

const chatMessages = computed(() => meetingStore.chatMessages)
const clientId = computed(() => meetingStore.clientId)

function sendMessage() {
  const content = newMessage.value.trim()
  if (content) {
    meetingStore.sendChatMessage(content)
    newMessage.value = ''
  }
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (files && files.length > 0) {
    for (const file of Array.from(files)) {
      try {
        await meetingStore.sendFile(file)
        Message.success(t('tools.webRtcMeeting.chat.sendFile'))
      } catch (error) {
        Message.error(t('tools.webRtcMeeting.chat.sendFileFailed'))
      }
    }

    // Reset file input
    target.value = ''
  }
}

function downloadFile(url: string, fileName?: string) {
  if (!url || !fileName) {
    // Fallback to old method for non-preview files
    Message.info(t('tools.webRtcMeeting.chat.download'))
    return
  }

  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function downloadFileFromMessage(_message: any) {
  // For non-preview files, we need to handle them differently
  // In a real implementation, you would need to have the actual file data
  // For now, we'll just show a message
  Message.info(t('tools.webRtcMeeting.chat.download'))
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生成头像文本（名字首字母）
function getAvatarText(name: string): string {
  if (!name) return 'U'
  return name.charAt(0).toUpperCase()
}

// 获取参与者头像URL
function getParticipantAvatar(senderId: string): string | null {
  const participant = meetingStore.participants.get(senderId)
  return participant?.avatar || null
}

// 生成头像背景颜色类
function getAvatarClass(senderId: string): string {
  // 为不同用户生成不同的背景颜色
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ]

  // 基于 senderId 生成一致的颜色索引
  let hash = 0
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// 检查用户是否在底部（允许一些像素的误差）
function checkIfScrolledToBottom() {
  if (!messagesContainer.value) return true
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  // 允许5像素的误差
  return scrollTop + clientHeight >= scrollHeight - 5
}

// 滚动到底部
function scrollToBottom(smooth = true) {
  nextTick(() => {
    if (messagesContainer.value) {
      if (smooth) {
        messagesContainer.value.scrollTo({
          top: messagesContainer.value.scrollHeight,
          behavior: 'smooth'
        })
      } else {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
      unreadMessageCount.value = 0
    }
  })
}

// Auto-scroll to bottom when new messages arrive
watch(
  chatMessages,
  (newMessages, oldMessages) => {
    // 只有在新增消息时才处理滚动
    if (newMessages.length > (oldMessages?.length || 0)) {
      nextTick(() => {
        if (messagesContainer.value) {
          // 如果之前在底部，则自动滚动到底部
          if (isScrolledToBottom.value) {
            scrollToBottom(false) // 新消息时使用即时滚动
          } else {
            // 如果不在底部，增加未读消息计数
            unreadMessageCount.value++
          }
        }
      })
    }
  },
  { deep: true }
)

// 监听滚动事件来更新滚动状态
watch(
  () => messagesContainer.value,
  (container, oldContainer) => {
    // 移除旧的事件监听器
    if (oldContainer) {
      oldContainer.removeEventListener('scroll', handleScroll)
    }

    if (container) {
      const handleScroll = () => {
        isScrolledToBottom.value = checkIfScrolledToBottom()
        // 如果滚动到底部，清除未读消息计数
        if (isScrolledToBottom.value) {
          unreadMessageCount.value = 0
        }
      }

      container.addEventListener('scroll', handleScroll)

      // 初始化滚动状态和滚动到底部
      nextTick(() => {
        isScrolledToBottom.value = checkIfScrolledToBottom()
        // 初始加载时滚动到底部
        scrollToBottom(false)
      })
    }
  },
  { immediate: true }
)

// 在组件卸载时清理事件监听器
const handleScroll = () => {
  isScrolledToBottom.value = checkIfScrolledToBottom()
  if (isScrolledToBottom.value) {
    unreadMessageCount.value = 0
  }
}

// 组件卸载时清理
onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

/* 深色模式下的滚动条 */
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}

/* 消息动画 */
.flex.gap-3 {
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

/* 头像悬停效果 */
.w-8.h-8.rounded-full {
  transition: transform 0.2s ease;
}

.w-8.h-8.rounded-full:hover {
  transform: scale(1.1);
}

/* 消息气泡尖角效果 */
.relative.rounded-2xl::before {
  content: '';
  position: absolute;
  top: 0;
  width: 0;
  height: 0;
  border: 8px solid transparent;
}

/* 自己发送的消息 - 右侧尖角 */
.relative.rounded-2xl.bg-blue-500::before {
  right: -8px;
  border-left-color: rgb(59 130 246);
  border-top: none;
  border-right: none;
  border-bottom: none;
}

/* 别人发送的消息 - 左侧尖角 */
.relative.rounded-2xl.bg-gray-100::before {
  left: -8px;
  border-right-color: rgb(243 244 246);
  border-top: none;
  border-left: none;
  border-bottom: none;
}

.dark .relative.rounded-2xl.bg-gray-700::before {
  left: -8px;
  border-right-color: rgb(55 65 81);
  border-top: none;
  border-left: none;
  border-bottom: none;
}

/* 文件消息尖角 */
.relative.rounded-2xl.bg-yellow-100::before {
  left: -8px;
  border-right-color: rgb(254 249 195);
  border-top: none;
  border-left: none;
  border-bottom: none;
}

.dark .relative.rounded-2xl.bg-yellow-900::before {
  left: -8px;
  border-right-color: rgb(113 63 18);
  border-top: none;
  border-left: none;
  border-bottom: none;
}
</style>
