<template>
  <div class="flex justify-center items-center px-6 py-4 bg-white dark:bg-gray-800">
    <div class="flex gap-4 items-center">
      <!-- 麦克风设备选择 -->
      <div class="relative" v-if="audioDevices.length > 1">
        <button
          @click="toggleAudio"
          class="w-10 h-10 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-none shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
          :title="
            currentUser?.mediaState.audio
              ? t('tools.webRtcMeeting.controls.muteMic')
              : t('tools.webRtcMeeting.controls.unmuteMic')
          "
        >
          <MicrophoneDisabledIcon
            v-if="currentUser?.mediaState.audio"
            class="h-8 w-8 text-gray-700 dark:text-white"
          />
          <MicrophoneIcon v-else class="h-8 w-8 text-gray-700 dark:text-white" />
        </button>
        <div
          class="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
          @click.stop="toggleAudioDropdown"
        >
          <ChevronDownIcon class="h-3 w-3 text-white" />
        </div>

        <!-- 音频设备下拉菜单 -->
        <div
          v-if="showAudioDropdown"
          class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[200px] max-w-xs z-10 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
        >
          <div
            v-for="device in audioDevices"
            :key="device.deviceId"
            class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-white flex items-center whitespace-nowrap text-sm"
            @click="selectAudioDevice(device.deviceId)"
          >
            <CheckIcon
              v-if="device.deviceId === currentAudioDeviceId"
              class="h-4 w-4 text-blue-500 mr-2 flex-shrink-0"
            />
            <span class="truncate">{{
              device.label || t('tools.webRtcMeeting.controls.unnamedDevice')
            }}</span>
          </div>
        </div>
      </div>

      <button
        v-else
        @click="toggleAudio"
        class="w-10 h-10 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-none shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
        :title="
          currentUser?.mediaState.audio
            ? t('tools.webRtcMeeting.controls.muteMic')
            : t('tools.webRtcMeeting.controls.unmuteMic')
        "
      >
        <MicrophoneDisabledIcon
          v-if="currentUser?.mediaState.audio"
          class="h-8 w-8 text-gray-700 dark:text-white"
        />
        <MicrophoneIcon v-else class="h-8 w-8 text-gray-700 dark:text-white" />
      </button>

      <!-- 摄像头设备选择 -->
      <div class="relative" v-if="videoDevices.length > 1">
        <button
          @click="toggleVideo"
          class="w-10 h-10 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-none shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
        >
          <VideoCameraIcon class="h-8 w-8 text-gray-700 dark:text-white" />
        </button>
        <div
          class="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
          @click.stop="toggleVideoDropdown"
        >
          <ChevronDownIcon class="h-3 w-3 text-white" />
        </div>

        <!-- 视频设备下拉菜单 -->
        <div
          v-if="showVideoDropdown"
          class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[200px] max-w-xs z-10 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
        >
          <div
            v-for="device in videoDevices"
            :key="device.deviceId"
            class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-white flex items-center whitespace-nowrap text-sm"
            @click="selectVideoDevice(device.deviceId)"
          >
            <CheckIcon
              v-if="device.deviceId === currentVideoDeviceId"
              class="h-4 w-4 text-blue-500 mr-2 flex-shrink-0"
            />
            <span class="truncate">{{
              device.label || t('tools.webRtcMeeting.controls.unnamedDevice')
            }}</span>
          </div>
        </div>
      </div>

      <button
        v-else
        @click="toggleVideo"
        class="w-10 h-10 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-none shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
        :title="
          currentUser?.mediaState.video
            ? t('tools.webRtcMeeting.controls.turnOffCamera')
            : t('tools.webRtcMeeting.controls.turnOnCamera')
        "
      >
        <VideoCameraIcon class="h-8 w-8 text-gray-700 dark:text-white" />
      </button>

      <button
        v-if="isGetDisplayMediaSupported"
        @click="toggleScreenShare"
        class="w-10 h-10 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-none shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
        :title="
          currentUser?.mediaState.screen
            ? t('tools.webRtcMeeting.controls.stopScreenShare')
            : t('tools.webRtcMeeting.controls.startScreenShare')
        "
      >
        <ComputerDesktopIcon
          v-if="currentUser?.mediaState.screen"
          class="h-8 w-8 text-gray-700 dark:text-white"
        />
        <ComputerDesktopIcon v-else class="h-8 w-8 text-gray-700 dark:text-white" />
      </button>
      <button
        @click="leaveMeeting"
        class="w-10 h-10 p-2 rounded-lg border-none shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center bg-red-600 hover:bg-red-700"
        :title="t('tools.webRtcMeeting.meeting.leave')"
      >
        <ArrowRightIcon class="h-8 w-8 text-white" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import MicrophoneDisabledIcon from '@/components/icons/MicrophoneDisabledIcon.vue'
import toast from '@/services/toast'
import { useMeetingStore } from '@/stores/meeting'
import { getMediaDevices } from '@/utils/helper'
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
    console.error('Failed to fetch media devices:', error)
    toast.error(
      t('tools.webRtcMeeting.controls.deviceError'),
      t('tools.webRtcMeeting.controls.deviceFetchFailed'),
      3000
    )
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
      await meetingStore.startCamera(deviceId, currentAudioDeviceId.value || undefined)
      toast.success(
        t('tools.webRtcMeeting.controls.cameraSwitched'),
        videoDevices.value.find((d) => d.deviceId === deviceId)?.label || deviceId,
        2000
      )
    }
  } catch (error) {
    console.error('Failed to switch video device:', error)
    toast.error(
      t('tools.webRtcMeeting.controls.cameraSwitchFailed'),
      t('tools.webRtcMeeting.errors.connectionFailed'),
      3000
    )
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
        await meetingStore.startCamera(currentVideoDeviceId.value || undefined, deviceId)
        toast.success(
          t('tools.webRtcMeeting.controls.microphoneSwitched'),
          audioDevices.value.find((d) => d.deviceId === deviceId)?.label || deviceId,
          2000
        )
      }
    }
  } catch (error) {
    console.error('Failed to switch audio device:', error)
    toast.error(
      t('tools.webRtcMeeting.controls.microphoneSwitchFailed'),
      t('tools.webRtcMeeting.errors.connectionFailed'),
      3000
    )
  }
}

async function toggleAudio() {
  try {
    const enabled = meetingStore.toggleAudio()
    if (enabled) {
      toast.success(t('tools.webRtcMeeting.controls.unmuteMic'), '', 2000)
    } else {
      toast.info(t('tools.webRtcMeeting.controls.muteMic'), '', 2000)
    }
  } catch (error) {
    toast.error(
      t('tools.webRtcMeeting.controls.muteMic'),
      t('tools.webRtcMeeting.errors.connectionFailed'),
      3000
    )
  }
}

async function toggleVideo() {
  try {
    if (!meetingStore.localStream) {
      // 在启动摄像头前，检查是否有屏幕共享流，如果有则停止
      if (currentUser.value?.mediaState.screen) {
        await meetingStore.stopScreenShare()
      }

      await meetingStore.startCamera(
        currentVideoDeviceId.value || undefined,
        currentAudioDeviceId.value || undefined
      )
      toast.success(t('tools.webRtcMeeting.controls.turnOnCamera'), '', 2000)
    } else {
      const enabled = meetingStore.toggleVideo()
      if (enabled) {
        toast.success(t('tools.webRtcMeeting.controls.turnOnCamera'), '', 2000)
      } else {
        toast.info(t('tools.webRtcMeeting.controls.turnOffCamera'), '', 2000)
      }
    }
  } catch (error) {
    toast.error(
      t('tools.webRtcMeeting.controls.turnOnCamera'),
      t('tools.webRtcMeeting.errors.connectionFailed'),
      3000
    )
  }
}

async function toggleScreenShare() {
  try {
    if (currentUser.value?.mediaState.screen) {
      meetingStore.stopScreenShare()
      toast.info(t('tools.webRtcMeeting.controls.stopScreenShare'), '', 2000)
    } else {
      // 在启动屏幕共享前，检查是否有摄像头流，如果有则停止
      if (meetingStore.localStream) {
        await meetingStore.stopCamera()
      }

      await meetingStore.startScreenShare()
      toast.success(t('tools.webRtcMeeting.controls.startScreenShare'), '', 2000)
    }
  } catch (error) {
    toast.error(t('tools.webRtcMeeting.controls.startScreenShare'), error.message || '出错了', 3000)
  }
}

function leaveMeeting() {
  meetingStore.leaveMeeting()
  router.push('/')
}

// 组件挂载时获取设备列表
onMounted(() => {
  fetchMediaDevices()
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
