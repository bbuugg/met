<template>
  <div class="flex justify-center items-center px-6 py-4 bg-white dark:bg-gray-800">
    <div class="flex gap-3 items-center justify-center md:justify-between w-full">
      <div>
        <!-- 录屏按钮 -->
        <button v-if="isGetDisplayMediaSupported" @click="toggleRecording"
          class="min-w-[80px] h-12 px-3 rounded-lg border-none shadow-lg transform hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center gap-1"
          :class="{
            'bg-red-600 hover:bg-red-700 text-white': meetingStore.isRecording,
            'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600':
              !meetingStore.isRecording
          }">
          <div v-if="meetingStore.isRecording" class="w-4 h-4 bg-white rounded-sm"></div>
          <VideoCameraIcon v-else class="h-6 w-6" />
          <span class="text-xs font-medium">{{
            meetingStore.isRecording
              ? t('tools.webRtcMeeting.meeting.stopRecording')
              : t('tools.webRtcMeeting.meeting.startRecording')
          }}</span>
        </button>
      </div>
      <div class="flex flex-wrap gap-3 items-center justify-center">
        <!-- 麦克风设备选择 -->
        <div
          class="relative min-w-[80px] h-12 border-none rounded-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center">
          <button @click="toggleAudio"
            class="min-w-[80px] h-full px-3 border-none shadow-lg flex flex-col items-center justify-center gap-1"
            :class="{
              'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600':
                !currentUser?.mediaState.audio,
              'bg-red-500 hover:bg-red-600 text-white': currentUser?.mediaState.audio,
              'rounded-lg': audioDevices.length <= 1,
              'rounded-l-lg': audioDevices.length > 1
            }">
            <MicrophoneDisabledIcon v-if="currentUser?.mediaState.audio" class="h-6 w-6" />
            <MicrophoneIcon v-else class="h-6 w-6" />
            <span class="text-xs font-medium">{{
              currentUser?.mediaState.audio
                ? t('tools.webRtcMeeting.controls.muteMic')
                : t('tools.webRtcMeeting.controls.unmuteMic')
            }}</span>
          </button>

          <!-- 音频设备下拉菜单 -->
          <a-dropdown v-if="audioDevices.length > 1" trigger="click" position="top" :popup-max-height="240">
            <button class="w-5 h-full flex items-center justify-center rounded-r-lg shadow-lg" :class="{
              'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600':
                !currentUser?.mediaState.audio,
              'bg-red-500 hover:bg-red-600 text-white': currentUser?.mediaState.audio
            }">
              <ChevronDownIcon class="h-5 w-5" />
            </button>
            <template #content>
              <a-doption v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId"
                @click="selectAudioDevice(device.deviceId)">
                <div class="flex items-center whitespace-nowrap">
                  <CheckIcon v-if="device.deviceId === currentAudioDeviceId"
                    class="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                  <span class="truncate">{{
                    device.label || t('tools.webRtcMeeting.controls.unnamedDevice')
                    }}</span>
                </div>
              </a-doption>
            </template>
          </a-dropdown>
        </div>

        <!-- 摄像头设备选择 -->
        <div
          class="relative min-w-[80px] h-12 border-none rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center">
          <button @click="toggleVideo" class="px-3 h-full flex flex-col items-center justify-center gap-1" :class="{
            'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600':
              !currentUser?.mediaState.video,
            'bg-red-500 hover:bg-red-600 text-white': currentUser?.mediaState.video,
            'rounded-lg': videoDevices.length <= 1,
            'rounded-l-lg': videoDevices.length > 1
          }">
            <VideoCameraIcon v-if="!currentUser?.mediaState.video" class="h-6 w-6" />
            <VideoCameraSlashIcon v-else class="h-6 w-6" />
            <span class="text-xs font-medium">{{
              currentUser?.mediaState.video
                ? t('tools.webRtcMeeting.controls.turnOffCamera')
                : t('tools.webRtcMeeting.controls.turnOnCamera')
            }}</span>
          </button>

          <!-- 视频设备下拉菜单 -->
          <a-dropdown v-if="videoDevices.length > 1" trigger="click" position="top" :popup-max-height="240">
            <button class="w-5 h-full flex items-center justify-center rounded-r-lg" :class="{
              'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600':
                !currentUser?.mediaState.video,
              'bg-red-500 hover:bg-red-600 text-white': currentUser?.mediaState.video
            }">
              <ChevronDownIcon class="h-5 w-5" />
            </button>
            <template #content>
              <a-doption v-for="device in videoDevices" :key="device.deviceId" :value="device.deviceId"
                @click="selectVideoDevice(device.deviceId)">
                <div class="flex items-center whitespace-nowrap">
                  <CheckIcon v-if="device.deviceId === currentVideoDeviceId"
                    class="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                  <span class="truncate">{{
                    device.label || t('tools.webRtcMeeting.controls.unnamedDevice')
                    }}</span>
                </div>
              </a-doption>
            </template>
          </a-dropdown>
        </div>

        <!-- 屏幕共享按钮组 -->
        <div v-if="isGetDisplayMediaSupported"
          class="relative min-w-[80px] h-12 border-none rounded-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center">
          <button @click="toggleScreenShare"
            class="min-w-[80px] h-full px-3 border-none shadow-lg flex flex-col items-center justify-center gap-1 rounded-lg"
            :class="{
              'bg-indigo-600 hover:bg-indigo-700 text-white': currentUser?.mediaState.screen,
              'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600':
                !currentUser?.mediaState.screen
            }">
            <ComputerDesktopIcon class="h-6 w-6" />
            <span class="text-xs font-medium">{{
              currentUser?.mediaState.screen
                ? t('tools.webRtcMeeting.controls.stopScreenShare')
                : t('tools.webRtcMeeting.controls.startScreenShare')
            }}</span>
          </button>

          <!-- 桌面音频控制按钮 - 仅当屏幕共享且存在桌面音频轨道时显示 -->
          <button v-if="currentUser?.mediaState.screen && hasDesktopAudioTrack" @click="toggleDesktopAudio"
            class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transform hover:scale-110 transition-all duration-200"
            :class="{
              'bg-green-500 hover:bg-green-600 text-white': currentUser?.mediaState.desktopAudio,
              'bg-gray-400 hover:bg-gray-500 text-white': !currentUser?.mediaState.desktopAudio
            }" :title="currentUser?.mediaState.desktopAudio
              ? t('tools.webRtcMeeting.controls.muteDesktopAudio')
              : t('tools.webRtcMeeting.controls.unmuteDesktopAudio')">
            <SpeakerWaveIcon v-if="currentUser?.mediaState.desktopAudio" class="h-3 w-3" />
            <SpeakerXMarkIcon v-else class="h-3 w-3" />
          </button>
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <!-- 聊天按钮 -->
        <button @click="toggleChatPanel"
          class="min-w-[80px] h-12 px-3 rounded-lg border-none shadow-lg transform hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center gap-1 relative"
          :class="{
            'bg-blue-600 hover:bg-blue-700 text-white': props.showChatPanel,
            'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600': !props.showChatPanel
          }">
          <ChatBubbleLeftRightIcon class="h-6 w-6" />
          <span class="text-xs font-medium">{{ t('tools.webRtcMeeting.chat.title') }}</span>
          <!-- 未读消息计数 -->
          <div v-if="props.unreadMessagesCount > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold">
            {{ props.unreadMessagesCount > 99 ? '99+' : props.unreadMessagesCount }}
          </div>
        </button>

        <!-- 离开按钮 -->
        <button @click="showLeaveConfirm"
          class="min-w-[80px] h-12 px-3 rounded-lg border-none shadow-lg transform hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white">
          <ArrowRightIcon class="h-6 w-6" />
          <span class="text-xs font-medium">{{ t('tools.webRtcMeeting.meeting.leave') }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- 退出确认 Modal -->
  <a-modal v-model:visible="showLeaveModal" :title="t('tools.webRtcMeeting.meeting.leaveConfirmTitle')"
    @ok="confirmLeave" @cancel="cancelLeave" :ok-text="t('tools.webRtcMeeting.meeting.leaveConfirm')"
    :cancel-text="t('tools.webRtcMeeting.meeting.leaveCancel')" :width="400">
    <p>{{ t('tools.webRtcMeeting.meeting.leaveConfirmMessage') }}</p>
  </a-modal>
</template>

<script setup lang="ts">
import MicrophoneDisabledIcon from '@/components/icons/MicrophoneDisabledIcon.vue'
import { useMeetingStore } from '@/stores/meeting'
import { getMediaDevices } from '@/utils/helper'
import { Modal as AModal, Message, Dropdown as ADropdown, Doption as ADoption } from '@arco-design/web-vue'
import { ArrowRightIcon, MicrophoneIcon, ChatBubbleLeftRightIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/vue/24/outline'
import {
  CheckIcon,
  ChevronDownIcon,
  ComputerDesktopIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon
} from '@heroicons/vue/24/solid'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

// 定义props
interface Props {
  showChatPanel: boolean
  unreadMessagesCount: number
}

const props = defineProps<Props>()

// 定义emit事件
const emit = defineEmits<{
  toggleChatPanel: []
}>()

const router = useRouter()
const meetingStore = useMeetingStore()
const { t } = useI18n()

// 退出确认 Modal 相关状态
const showLeaveModal = ref(false)

// 设备相关状态
const videoDevices = ref<MediaDeviceInfo[]>([])
const audioDevices = ref<MediaDeviceInfo[]>([])
const currentVideoDeviceId = ref<string | null>(null)
const currentAudioDeviceId = ref<string | null>(null)

const currentUser = computed(() => meetingStore.currentUser)
const isGetDisplayMediaSupported = computed(
  () => !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function')
)

// 是否存在桌面音频轨道（用于控制桌面音频开关的显示）
// 依赖于 screen 状态和 localStream，以确保在开始/停止共享时能重新计算
const hasDesktopAudioTrack = computed(() => {
  // reactive deps
  void currentUser.value?.mediaState.screen
  void meetingStore.localStream
  return !!meetingStore.webrtcService?.hasDesktopAudioTrack()
})

// 录屏相关状态
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])
const recordingStartTime = ref<number | null>(null)

// 选择设备
const selectAudioDevice = (deviceId: string) => {
  switchAudioDevice(deviceId)
}

const selectVideoDevice = (deviceId: string) => {
  switchVideoDevice(deviceId)
}

// 获取媒体设备列表
async function fetchMediaDevices() {
  try {
    const [video, audio] = await getMediaDevices()
    videoDevices.value = video
    audioDevices.value = audio
  } catch (error) {
    Message.error(t('tools.webRtcMeeting.controls.deviceError'))
    console.error('Failed to fetch media devices:', error)
  }
}

// 切换视频设备
async function switchVideoDevice(deviceId: string) {
  if (currentVideoDeviceId.value === deviceId) return
  try {
    await meetingStore.switchVideoDevice(deviceId)
    Message.success(t('tools.webRtcMeeting.controls.cameraSwitched'))
  } catch (error) {
    console.error('Failed to switch video device:', error)
    Message.error(t('tools.webRtcMeeting.controls.cameraSwitchFailed'))
  }
}

// 切换音频设备
async function switchAudioDevice(deviceId: string) {
  if (currentAudioDeviceId.value === deviceId) return

  try {
    currentAudioDeviceId.value = deviceId
    const enabled = await meetingStore.switchAudioDevice(deviceId)
    if (enabled) {
      Message.success(t('tools.webRtcMeeting.controls.microphoneSwitched'))
    } else {
      Message.success(t('tools.webRtcMeeting.controls.microphoneSwitched'))
    }
  } catch (error) {
    console.error('Failed to switch audio device:', error)
    Message.error(t('tools.webRtcMeeting.controls.microphoneSwitchFailed'))
  }
}

async function toggleAudio() {
  try {
    const enabled = await meetingStore.toggleAudio(currentAudioDeviceId.value || undefined)
    if (enabled) {
      Message.success(t('tools.webRtcMeeting.controls.unmuteMic'))
    } else {
      Message.info(t('tools.webRtcMeeting.controls.muteMic'))
    }
  } catch (error) {
    Message.error(`${t('tools.webRtcMeeting.controls.microphoneSwitchFailed')} ${error}`)
  }
}

async function toggleVideo() {
  try {
    const enabled = await meetingStore.toggleVideo(currentVideoDeviceId.value || undefined)
    // 摄像头状态变化后，屏幕共享按钮需同步反映互斥关系
    if (enabled && currentUser.value) {
      currentUser.value.mediaState.screen = false
    }
  } catch (error) {
    Message.error(`${t('tools.webRtcMeeting.controls.turnOnCameraFailed')} ${error}`)
  }
}

// 开始录屏
async function startRecording() {
  try {
    // 获取屏幕媒体流
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })

    // 创建 MediaRecorder 实例
    const options = { mimeType: 'video/webm;codecs=vp9' }
    // 检查浏览器是否支持指定的 MIME 类型
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.warn(`MIME type ${options.mimeType} is not supported`)
      options.mimeType = 'video/webm' // 降级到基本的 webm 格式
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = '' // 让浏览器选择默认格式
      }
    }

    const recorder = new MediaRecorder(stream, options)

    // 清空之前录制的数据
    recordedChunks.value = []
    recordingStartTime.value = Date.now()

    // 监听数据可用事件
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data)
      }
    }

    // 监听停止事件
    recorder.onstop = () => {
      // 停止所有轨道
      stream.getTracks().forEach((track) => track.stop())

      // 保存录制状态
      meetingStore.isRecording = false

      // 下载录制文件
      downloadRecording()
    }

    // 开始录制
    recorder.start(1000) // 每秒触发一次 dataavailable 事件

    // 保存 recorder 实例
    mediaRecorder.value = recorder

    // 更新录制状态
    meetingStore.isRecording = true

    // 显示开始录制提示
    Message.success(t('tools.webRtcMeeting.meeting.recordingStarted'))

    // 监听屏幕共享结束事件
    stream.getVideoTracks()[0].onended = () => {
      stopRecording()
    }
  } catch (error: any) {
    console.error(t('tools.webRtcMeeting.meeting.recordingFailed') + ':', error)
    Message.error(t('tools.webRtcMeeting.meeting.recordingFailed'))
    meetingStore.isRecording = false
  }
}

// 停止录屏
function stopRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
    mediaRecorder.value = null

    // 计算录制时长
    if (recordingStartTime.value) {
      const duration = Math.round((Date.now() - recordingStartTime.value) / 1000)
      console.log(`${t('tools.webRtcMeeting.meeting.recordingDuration')}: ${duration} ${t('tools.webRtcMeeting.meeting.seconds')}`)
      recordingStartTime.value = null
    }

    // 显示停止录制提示
    Message.info(t('tools.webRtcMeeting.meeting.recordingStopped'))
  }
}

// 下载录制文件
function downloadRecording() {
  if (recordedChunks.value.length === 0) {
    Message.error(t('tools.webRtcMeeting.meeting.noRecordingData'))
    return
  }

  try {
    // 创建录制文件
    const blob = new Blob(recordedChunks.value, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)

    // 创建下载链接
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `meeting-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`

    // 触发下载
    document.body.appendChild(a)
    a.click()

    // 清理
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    // 清空录制数据
    recordedChunks.value = []

    // 显示下载成功提示
    Message.success(t('tools.webRtcMeeting.meeting.recordingSaved'))
  } catch (error: any) {
    console.error(t('tools.webRtcMeeting.meeting.downloadRecordingFailed'), error)
    Message.error(t('tools.webRtcMeeting.meeting.recordingSaveFailed'))
  }
}

// 切换录屏状态
function toggleRecording() {
  if (meetingStore.isRecording) {
    stopRecording()
  } else {
    startRecording()
  }
}

async function toggleScreenShare() {
  try {
    if (currentUser.value?.mediaState.screen) {
      await meetingStore.stopScreenShare()
      // 屏幕共享关闭后，保持按钮状态一致
      currentUser.value.mediaState.screen = false
      Message.info(t('tools.webRtcMeeting.controls.stopScreenShare'))
    } else {
      await meetingStore.startScreenShare()
      // 启动屏幕共享会自动关闭摄像头
      currentUser.value.mediaState.screen = true
      currentUser.value.mediaState.video = false
      Message.success(t('tools.webRtcMeeting.controls.startScreenShare'))
    }
  } catch (error: any) {
    Message.error(`${t('tools.webRtcMeeting.controls.startScreenShareFailed')} ${error}`)
  }
}

async function toggleDesktopAudio() {
  try {
    const enabled = await meetingStore.toggleDesktopAudio()
    if (enabled) {
      Message.success(t('tools.webRtcMeeting.controls.unmuteDesktopAudio'))
    } else {
      Message.info(t('tools.webRtcMeeting.controls.muteDesktopAudio'))
    }
  } catch (error: any) {
    Message.error(`${t('tools.webRtcMeeting.controls.desktopAudioToggleFailed')} ${error}`)
  }
}

// 显示退出确认 Modal
function showLeaveConfirm() {
  showLeaveModal.value = true
}

// 确认退出
function confirmLeave() {
  showLeaveModal.value = false
  // 确保停止录制
  if (meetingStore.isRecording) {
    stopRecording()
  }

  meetingStore.leaveMeeting()
  router.push('/')
}

// 取消退出
function cancelLeave() {
  showLeaveModal.value = false
}

// 切换聊天面板
function toggleChatPanel() {
  emit('toggleChatPanel')
}

// 组件挂载时获取设备列表
onMounted(() => {
  fetchMediaDevices()
})

// 组件卸载时确保停止录制
onUnmounted(() => {
  // 确保停止录制
  if (meetingStore.isRecording) {
    stopRecording()
  }
})
</script>
