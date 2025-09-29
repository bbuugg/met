<template>
  <div class="w-full md:w-96 h-full flex flex-col transition-colors">
    <!-- 聊天面板头部 -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center gap-3">
        <div>
          <h3 class="text-sm font-semibold text-black dark:text-white">
            {{ t('tools.webRtcMeeting.chat.title') }}
          </h3>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col overflow-y-auto">
      <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth" ref="messagesContainer">
        <div v-for="message in chatMessages" :key="message.id" class="flex gap-4"
          :class="{ 'flex-row-reverse': message.senderId === clientId }">
          <!-- 头像 -->
          <div class="flex-shrink-0">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-base font-semibold overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors"
              :class="message.senderId === clientId
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
                " :title="message.senderName">
              <img v-if="getParticipantAvatar(message.senderId)" :src="getParticipantAvatar(message.senderId)!"
                :alt="message.senderName" class="w-full h-full object-cover rounded-lg" />
              <span v-else>{{ getAvatarText(message.senderName) }}</span>
            </div>
          </div>

          <!-- 消息内容区域 -->
          <div class="flex flex-col gap-1 max-w-[70%] min-w-0" :class="{ 'items-end': message.senderId === clientId }">
            <!-- 发送者信息 -->
            <div class="flex gap-2 items-center text-xs text-gray-600 dark:text-gray-400"
              :class="{ 'flex-row-reverse': message.senderId === clientId }">
              <span class="font-medium">{{ message.senderName }}</span>
              <span class="opacity-75">{{ formatTime(message.timestamp) }}</span>
            </div>

            <!-- 消息气泡 -->
            <div
              class="relative w-fit max-w-full px-4 py-3 rounded-lg break-words shadow-sm transition-colors text-sm leading-relaxed"
              :class="[
                message.senderId === clientId
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : message.type === 'file'
                    ? 'bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-700'
              ]">
              <template v-if="message.type === 'file'">
                <!-- Image preview -->
                <div v-if="
                  message.fileType && message.fileType.startsWith('image/') && message.fileUrl
                " class="flex flex-col gap-2 min-w-0">
                  <img :src="message.fileUrl" :alt="message.fileName"
                    class="max-w-full max-h-48 rounded-lg object-contain" />
                  <div class="flex items-center gap-2 min-w-0">
                    <DocumentIcon class="h-4 w-4 flex-shrink-0" />
                    <span class="truncate min-w-0">{{ message.fileName }}</span>
                    <span class="text-xs whitespace-nowrap flex-shrink-0">({{ formatFileSize(message.fileSize || 0)
                    }})</span>
                    <button @click="downloadFile(message.fileUrl, message.fileName)"
                      class="ml-2 px-2 py-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded text-xs flex items-center flex-shrink-0 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                      <ArrowDownTrayIcon class="h-3 w-3 mr-1" />
                      <span>{{ t('tools.webRtcMeeting.chat.download') }}</span>
                    </button>
                  </div>
                </div>

                <!-- Video preview -->
                <div v-else-if="
                  message.fileType && message.fileType.startsWith('video/') && message.fileUrl
                " class="flex flex-col gap-2 min-w-0">
                  <video :src="message.fileUrl" controls class="max-w-full max-h-48 rounded-lg"></video>
                  <div class="flex items-center gap-2 min-w-0">
                    <DocumentIcon class="h-4 w-4 flex-shrink-0" />
                    <span class="truncate min-w-0">{{ message.fileName }}</span>
                    <span class="text-xs whitespace-nowrap flex-shrink-0">({{ formatFileSize(message.fileSize || 0)
                    }})</span>
                    <button @click="downloadFile(message.fileUrl, message.fileName)"
                      class="ml-2 px-2 py-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded text-xs flex items-center flex-shrink-0 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                      <ArrowDownTrayIcon class="h-3 w-3 mr-1" />
                      <span>{{ t('tools.webRtcMeeting.chat.download') }}</span>
                    </button>
                  </div>
                </div>

                <!-- Other file types -->
                <div v-else class="flex items-center gap-2 min-w-0">
                  <DocumentIcon class="h-4 w-4 flex-shrink-0" />
                  <span class="truncate min-w-0">{{
                    message.content.replace('File received: ', '')
                  }}</span>
                  <button @click="downloadFileFromMessage(message)"
                    class="ml-2 px-2 py-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded text-xs flex items-center flex-shrink-0 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
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

        <div v-if="chatMessages.length === 0"
          class="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400 text-center">
          <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-4">
            <ChatBubbleLeftRightIcon class="h-8 w-8" />
          </div>
          <h3 class="font-medium text-black dark:text-white mb-2">开始对话</h3>
          <p class="text-sm">{{ t('tools.webRtcMeeting.chat.placeholder') }}</p>
        </div>
      </div>

      <!-- Unread messages indicator -->
      <div v-if="unreadMessageCount > 0" @click="scrollToBottomAndMarkRead"
        class="flex items-center justify-center p-3 bg-black dark:bg-white text-white dark:text-black text-sm cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0">
        <span class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full animate-pulse"></div>
          <span class="font-medium">{{ unreadMessageCount }} 条新消息</span>
          <span class="opacity-75">点击查看</span>
        </span>
      </div>
    </div>
    <div class="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
      <input ref="fileInputRef" type="file" multiple @change="handleFileSelect" class="hidden" />
      <button @click="() => fileInputRef?.click()"
        class="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        :title="t('tools.webRtcMeeting.chat.sendFile')">
        <PaperClipIcon class="h-4 w-4 text-black dark:text-white" />
      </button>
      <input v-model="newMessage" :placeholder="t('tools.webRtcMeeting.chat.placeholder')" @keyup.enter="sendMessage"
        class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none px-4 py-2 transition-all placeholder-gray-500 dark:placeholder-gray-400" />
      <button @click="sendMessage" :disabled="!newMessage.trim()"
        class="w-10 h-10 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center justify-center shadow-sm transform hover:scale-105 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:translate-y-0"
        :title="t('tools.webRtcMeeting.chat.send')">
        <PaperAirplaneIcon class="h-4 w-4" />
      </button>
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
  PaperClipIcon
} from '@heroicons/vue/24/outline'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const meetingStore = useMeetingStore()
const newMessage = ref('')
const messagesContainer = ref<HTMLElement>()
const fileInputRef = ref<HTMLInputElement>()

// 添加用于跟踪滚动状态的变量
const isScrolledToBottom = ref(true)
const unreadMessageCount = ref(0)
const lastReadMessageId = ref<string | null>(null)
const totalMessageCount = ref(0)

const chatMessages = computed(() => meetingStore.chatMessages)
const clientId = computed(() => meetingStore.clientId)

// 初始化聊天面板
function initializeChatPanel() {
  // 如果有消息，将最后一条消息标记为已读
  if (chatMessages.value.length > 0) {
    const lastMessage = chatMessages.value[chatMessages.value.length - 1]
    lastReadMessageId.value = lastMessage.id
  }
  unreadMessageCount.value = 0
}

// 滚动到底部并标记已读
function scrollToBottomAndMarkRead() {
  scrollToBottom(true)
  markAllMessagesAsRead()
}

function sendMessage() {
  const content = newMessage.value.trim()
  if (content) {
    meetingStore.sendChatMessage(content)
    newMessage.value = ''
    // 发送消息后立即滚动到底部
    nextTick(() => {
      scrollToBottom(false)
    })
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

// 检查用户是否在底部（允许一些像素的误差）
function checkIfScrolledToBottom() {
  if (!messagesContainer.value) return true
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  // 允许10像素的误差
  return scrollTop + clientHeight >= scrollHeight - 10
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
      // 滚动到底部时，标记所有消息为已读
      markAllMessagesAsRead()
    }
  })
}

// 标记所有消息为已读
function markAllMessagesAsRead() {
  if (chatMessages.value.length > 0) {
    const lastMessage = chatMessages.value[chatMessages.value.length - 1]
    lastReadMessageId.value = lastMessage.id
    unreadMessageCount.value = 0
  }
}

// 计算未读消息数量
function calculateUnreadCount() {
  if (!lastReadMessageId.value) {
    // 如果没有已读消息ID，则所有非自己发送的消息都是未读的
    const count = chatMessages.value.filter(msg => msg.senderId !== clientId.value).length
    return count
  }

  // 找到最后已读消息的索引
  const lastReadIndex = chatMessages.value.findIndex(msg => msg.id === lastReadMessageId.value)
  if (lastReadIndex === -1) {
    // 如果找不到已读消息，则所有非自己发送的消息都是未读的
    const count = chatMessages.value.filter(msg => msg.senderId !== clientId.value).length
    return count
  }

  // 计算最后已读消息之后的未读消息数量（排除自己发送的消息）
  const unreadMessages = chatMessages.value.slice(lastReadIndex + 1)
  const count = unreadMessages.filter(msg => msg.senderId !== clientId.value).length
  return count
}

// Auto-scroll to bottom when new messages arrive
watch(
  chatMessages,
  (newMessages, oldMessages) => {
    const oldCount = oldMessages?.length || 0
    const newCount = newMessages.length

    // 只有在新增消息时才处理滚动
    if (newCount > oldCount) {
      // 检查新增的消息
      const newMessagesAdded = newMessages.slice(oldCount)
      const hasNewMessageFromOthers = newMessagesAdded.some(msg => msg.senderId !== clientId.value)
      const hasNewMessageFromSelf = newMessagesAdded.some(msg => msg.senderId === clientId.value)

      nextTick(() => {
        if (messagesContainer.value) {
          // 如果用户在底部，或者是自己发送的消息，则自动滚动到底部
          if (isScrolledToBottom.value || hasNewMessageFromSelf) {
            scrollToBottom(false) // 新消息时使用即时滚动
          } else if (hasNewMessageFromOthers) {
            // 如果不在底部且有来自他人的新消息，更新未读计数
            unreadMessageCount.value = calculateUnreadCount()
          }
        }
      })
    }

    // 更新总消息数
    totalMessageCount.value = newCount
  },
  { deep: true, immediate: true }
)

// 滚动事件处理函数
const handleScroll = () => {
  const wasAtBottom = isScrolledToBottom.value
  isScrolledToBottom.value = checkIfScrolledToBottom()

  // 如果用户滚动到底部，标记消息为已读
  if (!wasAtBottom && isScrolledToBottom.value) {
    markAllMessagesAsRead()
  }
}

// 监听滚动事件来更新滚动状态
watch(
  () => messagesContainer.value,
  (container, oldContainer) => {
    // 移除旧的事件监听器
    if (oldContainer) {
      oldContainer.removeEventListener('scroll', handleScroll)
    }

    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })

      // 初始化滚动状态和滚动到底部
      nextTick(() => {
        isScrolledToBottom.value = checkIfScrolledToBottom()
        // 初始加载时滚动到底部并标记为已读
        scrollToBottom(false)
      })
    }
  },
  { immediate: true }
)

// 组件挂载时初始化
onMounted(() => {
  initializeChatPanel()
})

// 组件卸载时清理
onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll)
  }
})
</script>