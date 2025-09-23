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
            class="min-w-[80px] h-full px-3 rounded-l-lg border-none shadow-lg flex flex-col items-center justify-center gap-1"
            :class="{
              'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600':
                !currentUser?.mediaState.audio,
              'bg-red-500 hover:bg-red-600 text-white': currentUser?.mediaState.audio,
              'rounded-lg': audioDevices.length <= 1
            }">
            <MicrophoneDisabledIcon v-if="currentUser?.mediaState.audio" class="h-6 w-6" />
            <MicrophoneIcon v-else class="h-6 w-6" />
            <span class="text-xs font-medium">{{
              currentUser?.mediaState.audio
                ? t('tools.webRtcMeeting.controls.muteMic')
                : t('tools.webRtcMeeting.controls.unmuteMic')
            }}</span>
          </button>
          <button v-if="audioDevices.length > 1" @click.stop="toggleAudioDropdown"
            class="w-5 h-full flex items-center justify-center rounded-r-lg" :class="{
              'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600':
                !currentUser?.mediaState.audio,
              'bg-red-500 hover:bg-red-600 text-white': currentUser?.mediaState.audio
            }">
            <ChevronDownIcon class="h-5 w-5" />
          </button>

          <!-- 音频设备下拉菜单 -->
          <div v-if="showAudioDropdown"
            class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[200px] max-w-xs z-10 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
            <div v-for="device in audioDevices" :key="device.deviceId"
              class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-white flex items-center whitespace-nowrap text-sm"
              @click="selectAudioDevice(device.deviceId)">
              <CheckIcon v-if="device.deviceId === currentAudioDeviceId"
                class="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
              <span class="truncate">{{
                device.label || t('tools.webRtcMeeting.controls.unnamedDevice')
              }}</span>
            </div>
          </div>
        </div>

        <!-- 摄像头设备选择 -->
        <div
          class="relative min-w-[80px] h-12 border-none rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center">
          <button @click="toggleVideo" class="px-3 h-full flex rounded-l-lg flex-col items-center justify-center gap-1"
            :class="{
              'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600':
                !currentUser?.mediaState.video,
              'bg-red-500 hover:bg-red-600 text-white': currentUser?.mediaState.video,
              'rounded-lg': videoDevices.length <= 1
            }">
            <VideoCameraIcon class="h-6 w-6" />
            <span class="text-xs font-medium">{{
              currentUser?.mediaState.video
                ? t('tools.webRtcMeeting.controls.turnOffCamera')
                : t('tools.webRtcMeeting.controls.turnOnCamera')
            }}</span>
          </button>

          <!-- 视频设备选择按钮 -->
          <button v-if="videoDevices.length > 1" @click.stop="toggleVideoDropdown"
            class="w-5 h-full flex items-center justify-center rounded-r-lg" :class="{
              'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600':
                !currentUser?.mediaState.video,
              'bg-red-500 hover:bg-red-600 text-white': currentUser?.mediaState.video
            }">
            <ChevronDownIcon class="h-5 w-5" />
          </button>

          <!-- 视频设备下拉菜单 -->
          <div v-if="showVideoDropdown"
            class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[200px] max-w-xs z-10 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
            <div v-for="device in videoDevices" :key="device.deviceId"
              class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-white flex items-center whitespace-nowrap text-sm"
              @click="selectVideoDevice(device.deviceId)">
              <CheckIcon v-if="device.deviceId === currentVideoDeviceId"
                class="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
              <span class="truncate">{{
                device.label || t('tools.webRtcMeeting.controls.unnamedDevice')
              }}</span>
            </div>
          </div>
        </div>

        <button v-if="isGetDisplayMediaSupported" @click="toggleScreenShare"
          class="min-w-[80px] h-12 px-3 rounded-lg border-none shadow-lg transform hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center gap-1"
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
      </div>
      <div>
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
import { Modal as AModal, Message } from '@arco-design/web-vue'
import { ArrowRightIcon, MicrophoneIcon } from '@heroicons/vue/24/outline'
import {
  CheckIcon,
  ChevronDownIcon,
  ComputerDesktopIcon,
  VideoCameraIcon
} from '@heroicons/vue/24/solid'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

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
const showAudioDropdown = ref(false)
const showVideoDropdown = ref(false)
const currentUser = computed(() => meetingStore.currentUser)
const isGetDisplayMediaSupported = computed(
  () => !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function')
)

// 录屏相关状态
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])
const recordingStartTime = ref<number | null>(null)

// 计算当前选中的设备
const currentVideoDevice = computed(() => {
  return videoDevices.value.find((device) => device.deviceId === currentVideoDeviceId.value) || null
})

const currentAudioDevice = computed(() => {
  return audioDevices.value.find((device) => device.deviceId === currentAudioDeviceId.value) || null
})

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  if (showAudioDropdown.value || showVideoDropdown.value) {
    showAudioDropdown.value = false
    showVideoDropdown.value = false
  }
}

// 切换下拉菜单显示状态
const toggleAudioDropdown = () => {
  showAudioDropdown.value = !showAudioDropdown.value
  if (showAudioDropdown.value) {
    showVideoDropdown.value = false
  }
}

const toggleVideoDropdown = () => {
  showVideoDropdown.value = !showVideoDropdown.value
  if (showVideoDropdown.value) {
    showAudioDropdown.value = false
  }
}

// 选择设备
const selectAudioDevice = (deviceId: string) => {
  switchAudioDevice(deviceId)
  showAudioDropdown.value = false
}

const selectVideoDevice = (deviceId: string) => {
  switchVideoDevice(deviceId)
  showVideoDropdown.value = false
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
    currentVideoDeviceId.value = deviceId
    // 如果当前正在使用摄像头，则重新启动
    if (meetingStore.localStream && currentUser.value?.mediaState.video) {
      // 在切换设备前，检查是否有屏幕共享流，如果有则停止
      if (currentUser.value?.mediaState.screen) {
        await meetingStore.stopScreenShare()
      }

      await meetingStore.stopCamera()
      await meetingStore.startCamera(deviceId)
      Message.success(t('tools.webRtcMeeting.controls.cameraSwitched'))
    }
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
    // 如果当前正在使用麦克风，则重新启动
    if (meetingStore.localStream && currentUser.value?.mediaState.audio) {
      // 注意：切换音频设备不需要停止屏幕共享，因为音频和视频是独立的
      // 但我们需要确保在有屏幕共享时不启动摄像头音频
      if (!currentUser.value?.mediaState.screen) {
        await meetingStore.stopCamera()
        await meetingStore.startCamera(currentVideoDeviceId.value || undefined)
        Message.success(t('tools.webRtcMeeting.controls.microphoneSwitched'))
      }
    } else if (currentUser.value?.mediaState.screen) {
      // 如果只有屏幕共享，也需要切换音频设备
      // 先停止当前的屏幕共享
      await meetingStore.stopScreenShare()
      // 重新启动屏幕共享并指定音频设备
      await meetingStore.startScreenShareWithAudio(deviceId)
      Message.success(t('tools.webRtcMeeting.controls.microphoneSwitched'))
    } else if (!meetingStore.localStream) {
      // 如果没有视频流，但需要切换音频设备，创建一个仅音频的流
      await meetingStore.startAudioOnly(deviceId)
      Message.success(t('tools.webRtcMeeting.controls.microphoneSwitched'))
    }
  } catch (error) {
    console.error('Failed to switch audio device:', error)
    Message.error(t('tools.webRtcMeeting.controls.microphoneSwitchFailed'))
  }
}

async function toggleAudio() {
  const enabled = await meetingStore.toggleAudio(currentAudioDeviceId.value || undefined)
  if (enabled) {
    Message.success(t('tools.webRtcMeeting.controls.unmuteMic'))
  } else {
    Message.info(t('tools.webRtcMeeting.controls.muteMic'))
  }
}

async function toggleVideo() {
  try {
    // 检查是否只有音频流（没有视频轨道）
    const hasVideoTrack =
      meetingStore.localStream && meetingStore.localStream.getVideoTracks().length > 0

    if (!meetingStore.localStream || !hasVideoTrack) {
      // 在启动摄像头前，检查是否有屏幕共享流，如果有则停止
      if (currentUser.value?.mediaState.screen) {
        await meetingStore.stopScreenShare()
      }

      // 如果已有音频流，先停止它
      if (meetingStore.localStream) {
        await meetingStore.stopCamera()
      }

      await meetingStore.startCamera(
        currentVideoDeviceId.value || undefined,
      )
      Message.success(t('tools.webRtcMeeting.controls.turnOnCamera'))
    } else {
      const enabled = meetingStore.toggleVideo()
      if (enabled) {
        Message.success(t('tools.webRtcMeeting.controls.turnOnCamera'))
      } else {
        Message.info(t('tools.webRtcMeeting.controls.turnOffCamera'))
      }
    }
  } catch (error) {
    Message.error(t('tools.webRtcMeeting.controls.turnOnCamera'))
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
    console.error('录屏失败:', error)
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
      console.log(`录制时长: ${duration} 秒`)
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
    console.error('下载录制文件失败:', error)
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
      meetingStore.stopScreenShare()
      Message.info(t('tools.webRtcMeeting.controls.stopScreenShare'))
    } else {
      // 在启动屏幕共享前，检查是否有摄像头流，如果有则停止
      if (meetingStore.localStream) {
        await meetingStore.stopCamera()
      }

      await meetingStore.startScreenShare()
      Message.success(t('tools.webRtcMeeting.controls.startScreenShare'))
    }
  } catch (error: any) {
    Message.error(t('tools.webRtcMeeting.controls.startScreenShare'))
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

// 组件挂载时获取设备列表
onMounted(() => {
  fetchMediaDevices()
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)

  // 确保停止录制
  if (meetingStore.isRecording) {
    stopRecording()
  }
})
</script>
