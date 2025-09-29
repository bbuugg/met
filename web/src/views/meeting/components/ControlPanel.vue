<template>
  <div
    class="flex justify-center items-center px-6 py-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 transition-colors"
  >
    <div class="flex gap-3 items-center justify-center md:justify-between w-full">
      <div>
        <!-- 录屏按钮 -->
        <button
          v-if="isGetDisplayMediaSupported"
          @click="toggleRecording"
          class="min-w-[60px] sm:min-w-[90px] h-12 px-3 rounded-lg border shadow-sm transform hover:scale-105 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex flex-col items-center justify-center gap-1"
          :class="{
            'bg-red-600 hover:bg-red-700 text-white border-red-600': meetingStore.isRecording,
            'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-black dark:text-white':
              !meetingStore.isRecording
          }"
        >
          <div v-if="meetingStore.isRecording" class="w-4 h-4 bg-white rounded-sm"></div>
          <VideoCameraIcon v-else class="h-5 w-5" />
          <span class="text-xs font-medium max-sm:hidden">{{
            meetingStore.isRecording
              ? t('tools.webRtcMeeting.meeting.stopRecording')
              : t('tools.webRtcMeeting.meeting.startRecording')
          }}</span>
        </button>
      </div>
      <div class="flex flex-wrap gap-3 items-center justify-center">
        <!-- 麦克风设备选择 -->
        <div
          class="relative min-w-[60px] sm:min-w-[90px] h-12 rounded-lg transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
        >
          <button
            @click="toggleAudio"
            class="min-w-[60px] sm:min-w-[90px] h-full px-3 border shadow-sm flex flex-col items-center justify-center gap-1 transition-all duration-200 active:translate-y-0"
            :class="{
              'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-black dark:text-white':
                !currentUser?.mediaState.audio,
              'bg-red-500 hover:bg-red-600 text-white border-red-500':
                currentUser?.mediaState.audio,
              'rounded-lg': audioDevices.length <= 1,
              'rounded-l-lg': audioDevices.length > 1
            }"
          >
            <MicrophoneDisabledIcon v-if="currentUser?.mediaState.audio" class="h-5 w-5" />
            <MicrophoneIcon v-else class="h-5 w-5" />
            <span class="text-xs font-medium max-sm:hidden">{{
              currentUser?.mediaState.audio
                ? t('tools.webRtcMeeting.controls.muteMic')
                : t('tools.webRtcMeeting.controls.unmuteMic')
            }}</span>
          </button>

          <!-- 音频设备下拉菜单 -->
          <a-dropdown
            v-if="audioDevices.length > 1"
            trigger="click"
            position="top"
            :popup-max-height="240"
          >
            <button
              class="w-5 h-full flex items-center justify-center rounded-r-lg border shadow-sm"
              :class="{
                'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-black dark:text-white':
                  !currentUser?.mediaState.audio,
                'bg-red-500 hover:bg-red-600 text-white border-red-500':
                  currentUser?.mediaState.audio
              }"
            >
              <ChevronDownIcon class="h-4 w-4" />
            </button>
            <template #content>
              <a-doption
                v-for="device in audioDevices"
                :key="device.deviceId"
                :value="device.deviceId"
                @click="selectAudioDevice(device.deviceId)"
              >
                <div class="flex items-center whitespace-nowrap">
                  <CheckIcon
                    v-if="device.deviceId === currentAudioDeviceId"
                    class="h-4 w-4 text-black dark:text-white mr-2 flex-shrink-0"
                  />
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
          class="relative min-w-[60px] sm:min-w-[90px] h-12 rounded-lg transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
        >
          <button
            @click="toggleVideo"
            class="px-3 h-full border shadow-sm flex flex-col items-center justify-center gap-1 transition-all duration-200 active:translate-y-0"
            :class="{
              'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-black dark:text-white':
                !currentUser?.mediaState.video,
              'bg-red-500 hover:bg-red-600 text-white border-red-500':
                currentUser?.mediaState.video,
              'rounded-lg': videoDevices.length <= 1,
              'rounded-l-lg': videoDevices.length > 1
            }"
          >
            <VideoCameraIcon v-if="!currentUser?.mediaState.video" class="h-5 w-5" />
            <VideoCameraSlashIcon v-else class="h-5 w-5" />
            <span class="text-xs font-medium max-sm:hidden">{{
              currentUser?.mediaState.video
                ? t('tools.webRtcMeeting.controls.turnOffCamera')
                : t('tools.webRtcMeeting.controls.turnOnCamera')
            }}</span>
          </button>

          <!-- 视频设备下拉菜单 -->
          <a-dropdown
            v-if="videoDevices.length > 1"
            trigger="click"
            position="top"
            :popup-max-height="240"
          >
            <button
              class="w-5 h-full flex items-center justify-center rounded-r-lg border shadow-sm"
              :class="{
                'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-black dark:text-white':
                  !currentUser?.mediaState.video,
                'bg-red-500 hover:bg-red-600 text-white border-red-500':
                  currentUser?.mediaState.video
              }"
            >
              <ChevronDownIcon class="h-4 w-4" />
            </button>
            <template #content>
              <a-doption
                v-for="device in videoDevices"
                :key="device.deviceId"
                :value="device.deviceId"
                @click="selectVideoDevice(device.deviceId)"
              >
                <div class="flex items-center whitespace-nowrap">
                  <CheckIcon
                    v-if="device.deviceId === currentVideoDeviceId"
                    class="h-4 w-4 text-black dark:text-white mr-2 flex-shrink-0"
                  />
                  <span class="truncate">{{
                    device.label || t('tools.webRtcMeeting.controls.unnamedDevice')
                  }}</span>
                </div>
              </a-doption>
            </template>
          </a-dropdown>
        </div>

        <!-- 屏幕共享按钮组 -->
        <div
          v-if="isGetDisplayMediaSupported"
          class="relative min-w-[60px] sm:min-w-[90px] h-12 rounded-lg transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
        >
          <button
            @click="toggleScreenShare"
            class="min-w-[60px] sm:min-w-[90px] h-full px-3 border shadow-sm flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-200 active:translate-y-0"
            :class="{
              'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white':
                currentUser?.mediaState.screen,
              'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-black dark:text-white':
                !currentUser?.mediaState.screen
            }"
          >
            <ComputerDesktopIcon class="h-5 w-5" />
            <span class="text-xs font-medium max-sm:hidden">{{
              currentUser?.mediaState.screen
                ? t('tools.webRtcMeeting.controls.stopScreenShare')
                : t('tools.webRtcMeeting.controls.startScreenShare')
            }}</span>
          </button>

          <!-- 桌面音频控制按钮 - 仅当屏幕共享且存在桌面音频轨道时显示 -->
          <button
            v-if="currentUser?.mediaState.screen && hasDesktopAudioTrack"
            @click="toggleDesktopAudio"
            class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-black shadow-sm flex items-center justify-center transform hover:scale-110 transition-all duration-200"
            :class="{
              'bg-green-500 hover:bg-green-600 text-white': currentUser?.mediaState.desktopAudio,
              'bg-gray-400 hover:bg-gray-500 text-white': !currentUser?.mediaState.desktopAudio
            }"
            :title="
              currentUser?.mediaState.desktopAudio
                ? t('tools.webRtcMeeting.controls.muteDesktopAudio')
                : t('tools.webRtcMeeting.controls.unmuteDesktopAudio')
            "
          >
            <SpeakerWaveIcon v-if="currentUser?.mediaState.desktopAudio" class="h-3 w-3" />
            <SpeakerXMarkIcon v-else class="h-3 w-3" />
          </button>
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <button
          @click="showLeaveConfirm"
          class="min-w-[60px] sm:min-w-[90px] h-12 px-3 rounded-lg border shadow-sm transform hover:scale-105 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex flex-col items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white border-red-600"
        >
          <ArrowRightIcon class="h-5 w-5" />
          <span class="text-xs font-medium max-sm:hidden">{{ t('tools.webRtcMeeting.meeting.leave') }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- 退出确认 Modal -->
  <div
    v-if="showLeaveModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="cancelLeave"
  >
    <div
      class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden"
      @click.stop
    >
      <!-- 模态框内容 -->
      <div class="p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <!-- 标题区域 -->
        <div class="text-center mb-4 sm:mb-6">
          <div
            class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 mb-3 sm:mb-4 transition-colors"
          >
            <ArrowRightIcon class="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <h2 class="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-black dark:text-white">
            {{ t('tools.webRtcMeeting.meeting.leaveConfirmTitle') }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed px-2 sm:px-0">
            {{ t('tools.webRtcMeeting.meeting.leaveConfirmMessage') }}
          </p>
        </div>

        <!-- 按钮区域 -->
        <div class="flex flex-col sm:flex-row gap-2">
          <button
            @click="confirmLeave"
            class="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-all flex items-center justify-center gap-2 order-2 sm:order-1 text-sm"
          >
            <ArrowRightIcon class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">{{
              t('tools.webRtcMeeting.meeting.leaveConfirm')
            }}</span>
            <span class="sm:hidden">离开</span>
          </button>
          <button
            @click="cancelLeave"
            class="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-black dark:text-white font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 text-sm"
          >
            <span class="hidden sm:inline">{{ t('tools.webRtcMeeting.meeting.leaveCancel') }}</span>
            <span class="sm:hidden">取消</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MicrophoneDisabledIcon from '@/components/icons/MicrophoneDisabledIcon.vue'
import { useMeetingStore } from '@/stores/meeting'
import { getMediaDevices } from '@/utils/helper'
import {
  Doption as ADoption,
  Dropdown as ADropdown,
  Message
} from '@arco-design/web-vue'
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/vue/24/outline'
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
  unreadMessagesCount: number
}

const props = defineProps<Props>()
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
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })

    let finalStream = displayStream

    // 如果麦克风打开，混合桌面音频和麦克风音频
    if (meetingStore.webrtcService?.getMediaState().audio) {
      try {
        // 获取麦克风音频流
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        })

        // 创建音频上下文来混合音频
        const audioContext = new AudioContext()
        const displayAudioTracks = displayStream.getAudioTracks()
        const micAudioTracks = micStream.getAudioTracks()

        if (displayAudioTracks.length > 0 && micAudioTracks.length > 0) {
          // 创建音频源
          const displaySource = audioContext.createMediaStreamSource(new MediaStream(displayAudioTracks))
          const micSource = audioContext.createMediaStreamSource(micStream)

          // 创建增益节点来控制音量
          const displayGain = audioContext.createGain()
          const micGain = audioContext.createGain()

          // 设置音量（桌面音频稍微降低，避免过响）
          displayGain.gain.value = 0.8
          micGain.gain.value = 1.0

          // 创建混合器
          const mixer = audioContext.createGain()

          // 连接音频节点
          displaySource.connect(displayGain)
          micSource.connect(micGain)
          displayGain.connect(mixer)
          micGain.connect(mixer)

          // 创建输出流
          const destination = audioContext.createMediaStreamDestination()
          mixer.connect(destination)

          // 创建包含视频和混合音频的最终流
          const videoTracks = displayStream.getVideoTracks()
          const mixedAudioTracks = destination.stream.getAudioTracks()

          finalStream = new MediaStream([...videoTracks, ...mixedAudioTracks])

          console.log('录制将包含桌面音频和麦克风音频')
        } else if (micAudioTracks.length > 0) {
          // 只有麦克风音频，添加到显示流中
          const videoTracks = displayStream.getVideoTracks()
          finalStream = new MediaStream([...videoTracks, ...micAudioTracks])
          console.log('录制将包含桌面视频和麦克风音频')
        }
      } catch (micError) {
        console.warn('无法获取麦克风音频，将只录制桌面音频:', micError)
        Message.warning('无法获取麦克风音频，将只录制桌面音频')
      }
    } else {
      console.log('麦克风关闭，只录制桌面音频')
    }

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

    const recorder = new MediaRecorder(finalStream, options)

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
      finalStream.getTracks().forEach((track: MediaStreamTrack) => track.stop())

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
    const audioInfo = meetingStore.webrtcService?.getMediaState().audio
      ? '（包含桌面音频和麦克风音频）'
      : '（仅桌面音频）'
    Message.success(t('tools.webRtcMeeting.meeting.recordingStarted') + audioInfo)

    // 监听屏幕共享结束事件
    const videoTrack = finalStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.onended = () => {
        stopRecording()
      }
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
      console.log(
        `${t('tools.webRtcMeeting.meeting.recordingDuration')}: ${duration} ${t('tools.webRtcMeeting.meeting.seconds')}`
      )
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
      if (currentUser.value) {
        currentUser.value.mediaState.screen = false
      }
      Message.info(t('tools.webRtcMeeting.controls.stopScreenShare'))
    } else {
      await meetingStore.startScreenShare()
      // 启动屏幕共享会自动关闭摄像头
      if (currentUser.value) {
        currentUser.value.mediaState.screen = true
        currentUser.value.mediaState.video = false
      }
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

<style scoped>
.fixed.inset-0 {
  animation: fadeIn 0.2s ease-out;
}

.fixed.inset-0 > div {
  animation: slideUp 0.3s ease-out;
}
</style>
