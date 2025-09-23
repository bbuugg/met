<template>
  <div class="w-full md:w-96 h-full bg-white dark:bg-gray-800 flex flex-col">
    <div
      class="h-full flex flex-col bg-white dark:bg-gray-800"
    >
      <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3" ref="messagesContainer">
        <div
          v-for="message in chatMessages"
          :key="message.id"
          class="flex flex-col gap-1"
          :class="{ 'items-end': message.senderId === clientId }"
        >
          <div
            class="flex gap-2 items-center text-xs text-gray-500 dark:text-gray-400"
            :class="{ 'flex-row-reverse': message.senderId === clientId }"
          >
            <span class="font-medium">{{ message.senderName }}</span>
            <span>{{ formatTime(message.timestamp) }}</span>
          </div>
          <div
            class="w-fit px-4 py-3 rounded-2xl break-words flex items-center gap-2 shadow-md"
            :class="
              message.senderId === clientId
                ? 'bg-black text-white'
                : message.type === 'file'
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
            "
          >
            <template v-if="message.type === 'file'">
              <!-- Image preview -->
              <div
                v-if="message.fileType && message.fileType.startsWith('image/') && message.fileUrl"
                class="flex flex-col gap-2"
              >
                <img
                  :src="message.fileUrl"
                  :alt="message.fileName"
                  class="max-w-full max-h-48 rounded-lg object-contain"
                />
                <div class="flex items-center gap-2">
                  <DocumentIcon class="h-4 w-4 flex-shrink-0" />
                  <span class="truncate">{{ message.fileName }}</span>
                  <span class="text-xs whitespace-nowrap"
                    >({{ formatFileSize(message.fileSize || 0) }})</span
                  >
                  <button
                    @click="downloadFile(message.fileUrl, message.fileName)"
                    class="ml-2 p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-xs flex items-center"
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
                class="flex flex-col gap-2"
              >
                <video
                  :src="message.fileUrl"
                  controls
                  class="max-w-full max-h-48 rounded-lg"
                ></video>
                <div class="flex items-center gap-2">
                  <DocumentIcon class="h-4 w-4 flex-shrink-0" />
                  <span class="truncate">{{ message.fileName }}</span>
                  <span class="text-xs whitespace-nowrap"
                    >({{ formatFileSize(message.fileSize || 0) }})</span
                  >
                  <button
                    @click="downloadFile(message.fileUrl, message.fileName)"
                    class="ml-2 p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-xs flex items-center"
                  >
                    <ArrowDownTrayIcon class="h-3 w-3 mr-1" />
                    <span>{{ t('tools.webRtcMeeting.chat.download') }}</span>
                  </button>
                </div>
              </div>

              <!-- Other file types -->
              <div v-else class="flex items-center gap-2">
                <DocumentIcon class="h-4 w-4 flex-shrink-0" />
                <span class="truncate">{{ message.content.replace('File received: ', '') }}</span>
                <button
                  @click="downloadFileFromMessage(message)"
                  class="ml-2 p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-xs flex items-center"
                >
                  <ArrowDownTrayIcon class="h-3 w-3 mr-1" />
                  <span>{{ t('tools.webRtcMeeting.chat.download') }}</span>
                </button>
              </div>
            </template>
            <template v-else>
              {{ message.content }}
            </template>
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
        @click="scrollToBottom"
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
import MicrophoneDisabledIcon from '@/components/icons/MicrophoneDisabledIcon.vue'
import { useMeetingStore } from '@/stores/meeting'
import { Message } from '@arco-design/web-vue'
import {
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  DocumentIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  VideoCameraIcon
} from '@heroicons/vue/24/outline'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

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
const participantsList = computed(() => meetingStore.participantsList)

// Utility function to get participant initials
function getParticipantInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

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
        Message.error(t('tools.webRtcMeeting.chat.sendFile'))
      }
    }

    // Reset file input
    target.value = ''
  }
}

function downloadFile(url: string, fileName?: string) {
  if (!url || !fileName) {
    // Fallback to old method for non-preview files
    const content = typeof url === 'string' ? url : ''
    const fileNameFromContent = content.replace('File received: ', '')
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

function downloadFileFromMessage(message: any) {
  // For non-preview files, we need to handle them differently
  // Extract file name from content (assuming it's in the format "File received: filename")
  const fileName = message.content.replace('File received: ', '')

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

// 检查用户是否在底部（允许一些像素的误差）
function checkIfScrolledToBottom() {
  if (!messagesContainer.value) return true
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  // 允许5像素的误差
  return scrollTop + clientHeight >= scrollHeight - 5
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      unreadMessageCount.value = 0
    }
  })
}

// Auto-scroll to bottom when new messages arrive
watch(
  chatMessages,
  () => {
    nextTick(() => {
      if (messagesContainer.value) {
        // 如果之前在底部，则自动滚动到底部
        if (isScrolledToBottom.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
          unreadMessageCount.value = 0
        } else {
          // 如果不在底部，增加未读消息计数
          unreadMessageCount.value++
        }
      }
    })
  },
  { deep: true }
)

// 监听滚动事件来更新滚动状态
watch(
  () => messagesContainer.value,
  (container) => {
    if (container) {
      const handleScroll = () => {
        isScrolledToBottom.value = checkIfScrolledToBottom()
        // 如果滚动到底部，清除未读消息计数
        if (isScrolledToBottom.value) {
          unreadMessageCount.value = 0
        }
      }

      container.addEventListener('scroll', handleScroll)

      // 初始化滚动状态
      nextTick(() => {
        isScrolledToBottom.value = checkIfScrolledToBottom()
      })
    }
  },
  { immediate: true }
)
</script>
