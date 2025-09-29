<template>
  <div class="h-screen flex flex-col text-gray-900 dark:text-white relative">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-40 -right-40 w-80 h-80 bg-indigo-900 rounded-full mix-blend-soft-light filter blur-3xl opacity-20"
      ></div>
      <div
        class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-900 rounded-full mix-blend-soft-light filter blur-3xl opacity-20"
      ></div>
    </div>

    <div class="flex-1 flex flex-col overflow-hidden">
      <MeetingToolbar />
      <!-- 在移动端设备上，视频区域和聊天区域上下分布 -->
      <div class="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
        <VideoGrid class="flex-1 justify-center" />
        <!-- 聊天面板 - 可收起 -->
        <ChatPanel
          v-show="showChatPanel"
          :class="[
            'h-full flex-shrink-0 transition-all duration-300 ease-in-out',
            'fixed md:relative z-40',
            'inset-0 md:inset-auto md:w-96',
          ]"
          @close="toggleChatPanel"
        />
      </div>
      <ControlPanel
        :showChatPanel="showChatPanel"
        :unreadMessagesCount="unreadMessagesCount"
        @toggleChatPanel="toggleChatPanel"
      />
    </div>
    <!-- Loading overlay -->
    <div
      v-if="isJoining"
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
    >
      <div class="flex flex-col items-center gap-4 text-white">
        <!-- 自定义加载动画 -->
        <div
          class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="text-lg m-0">{{ t('tools.webRtcMeeting.status.connecting') }}</p>
      </div>
    </div>

    <!-- Reconnecting overlay -->
    <div
      v-if="isReconnecting"
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
    >
      <div class="flex flex-col items-center gap-4 text-white">
        <!-- 自定义加载动画 -->
        <div
          class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="text-lg m-0">{{ t('tools.webRtcMeeting.status.reconnecting') }}</p>
      </div>
    </div>

    <!-- Legal Notice Modal -->
    <LegalNoticeModal v-if="showLegalNotice" @accept="handleLegalNoticeAccept" />
  </div>
</template>

<script setup lang="ts">
import { generateSignature } from '@/api'
import LegalNoticeModal from '@/components/LegalNoticeModal.vue'
import { wsUrl } from '@/config'
import { useMeetingStore } from '@/stores/meeting'
import { useUserStore } from '@/stores/user'
import { Message } from '@arco-design/web-vue'

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ChatPanel from './components/ChatPanel.vue'
import ControlPanel from './components/ControlPanel.vue'
import MeetingToolbar from './components/MeetingToolbar.vue'
import VideoGrid from './components/VideoGrid.vue'

const { t } = useI18n()

interface Props {
  roomId: string
}

const props = defineProps<Props>()
const router = useRouter()
const meetingStore = useMeetingStore()
const userStore = useUserStore()
const isJoining = ref(false)
const isReconnecting = ref(false)
const showLegalNotice = ref(true) // 默认显示法律提示
const showChatPanel = ref(false) // 聊天面板显示状态

// 计算未读消息数量
const unreadMessagesCount = computed(() => {
  return meetingStore.chatMessages.filter(
    (msg) => !msg.read && msg.senderId !== meetingStore.clientId
  ).length
})

// 切换聊天面板显示状态
const toggleChatPanel = () => {
  showChatPanel.value = !showChatPanel.value

  // 当打开聊天面板时，标记所有消息为已读
  if (showChatPanel.value) {
    meetingStore.markMessagesAsRead()
  }
}

// 监听WebSocket连接状态变化
watch(
  () => meetingStore.webrtcService,
  (newVal) => {
    if (newVal) {
      // 保存原始的回调函数
      const originalCallback = newVal.onConnectionStateChanged

      // 设置新的回调函数
      newVal.onConnectionStateChanged = (
        state: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
      ) => {
        // 调用原始回调函数（如果存在）
        if (originalCallback) {
          originalCallback(state)
        }

        // 根据状态更新UI
        if (state === 'reconnecting') {
          isReconnecting.value = true
        } else if (state === 'connected') {
          isReconnecting.value = false
        } else if (state === 'disconnected') {
          isReconnecting.value = false
        }
      }
    }
  },
  { immediate: true }
)

// 处理法律声明接受事件
const handleLegalNoticeAccept = async () => {
  showLegalNotice.value = false
  await userStore.updateInfo()
  initializeMeeting(userStore.info?.name)
}

async function initializeMeeting(clientId: string) {
  // 使用props中的roomId而不是route.params.roomId
  const roomId = props.roomId

  if (!roomId) {
    Message.error(t('tools.webRtcMeeting.errors.meetingIdRequired'))
    router.push('/')
    return
  }

  try {
    isJoining.value = true

    // 加载用户信息以获取头像
    try {
      await userStore.updateInfo()
    } catch (error) {
      console.warn('Failed to load user info:', error)
      // 继续执行，即使用户信息加载失败
    }

    const signRes = await generateSignature({
      timestamp: Date.now(),
      name: clientId,
      roomId
    })

    await meetingStore.joinMeeting(wsUrl, signRes.data)

    // 设置连接状态变化的监听器
    if (meetingStore.webrtcService) {
      meetingStore.webrtcService.onConnectionStateChanged = (
        state: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
      ) => {
        if (state === 'reconnecting') {
          isReconnecting.value = true
        } else if (state === 'connected') {
          isReconnecting.value = false
        } else if (state === 'disconnected') {
          isReconnecting.value = false
        }
      }
    }
  } catch (error: any) {
    console.error('Failed to join meeting:', error)
    Message.error(t('tools.webRtcMeeting.errors.connectionFailed'))
    router.push('/')
  } finally {
    isJoining.value = false
  }
}

onMounted(async () => {
  // 页面加载时彻底重置所有状态
  meetingStore.resetAllState()
})

onUnmounted(() => {
  meetingStore.leaveMeeting()
})

// Handle page refresh/close
window.addEventListener('beforeunload', () => {
  meetingStore.leaveMeeting()
})
</script>
