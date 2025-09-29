<template>
  <div class="flex flex-col md:h-full">
    <div class="h-72 md:h-full">
      <!-- 当没有任何参与者时显示提示 -->
      <div
        v-show="!currentUser && participantsWithStreams.length === 0"
        class="flex items-center justify-center h-full rounded-xl border border-gray-200 dark:border-gray-800 transition-colors"
      >
        <div class="text-center p-8">
          <div
            class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-6"
          >
            <VideoCameraIcon class="h-10 w-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 class="text-xl font-semibold text-black dark:text-white mb-3">
            {{ t('tools.webRtcMeeting.video.waitingForParticipant') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
            {{ t('tools.webRtcMeeting.meeting.invitedToMeeting') }}
          </p>
        </div>
      </div>

      <!-- 视频网格 -->
      <div
        class="flex-1 grid gap-4 h-full w-full p-4 rounded-xl transition-colors"
        :class="gridClass"
      >
        <!-- Local video - always show if current user exists -->
        <div
          v-show="currentUser && (!fullscreenParticipantId || fullscreenParticipantId === 'local')"
          class="relative bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden min-h-[200px] shadow-sm border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex items-center justify-center group hover:-translate-y-0.5"
        >
          <!-- 视频元素 -->
          <video
            ref="localVideoRef"
            autoplay
            muted
            playsinline
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full object-contain w-full h-full"
            :class="{ 'opacity-0': !showLocalVideo }"
            :style="{ display: !showLocalVideo ? 'none' : 'block' }"
          />

          <!-- 只有音频时显示头像占位符 -->
          <div
            v-if="!showLocalVideo"
            class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors"
          >
            <div class="text-center">
              <div
                class="w-24 h-24 bg-white/20 dark:bg-black/20 rounded-full flex items-center justify-center mb-6 mx-auto overflow-hidden border-2 border-white/30 dark:border-black/30"
              >
                <img
                  referrerpolicy="no-referrer"
                  @error="handleAvatarError"
                  v-if="currentUser?.avatar"
                  :src="currentUser.avatar"
                  :alt="currentUser?.name || 'You'"
                  class="w-full h-full object-cover rounded-full"
                />
                <span v-else class="text-3xl font-bold text-white dark:text-black">{{
                  currentUser?.name?.charAt(0).toUpperCase() || 'Y'
                }}</span>
              </div>
              <p class="dark:text-white text-black font-medium text-sm">
                {{ t('tools.webRtcMeeting.audioOnly') }}
              </p>
            </div>
          </div>

          <div
            class="absolute bottom-0 left-0 right-0 p-4 rounded-b-xl"
          >
            <div class="flex justify-between items-center">
              <span class="dark:text-white font-semibold text-sm">{{
                `${currentUser?.name} (${t('tools.webRtcMeeting.you')})`
              }}</span>
              <div class="flex gap-2 items-center">
                <div class="size-7 rounded-lg bg-gray-800/20 dark:bg-white/20 flex items-center justify-center">
                  <MicrophoneDisabledIcon
                    class="w-4 h-4 text-red-400"
                    v-if="!currentUser?.mediaState.audio"
                  />
                  <MicrophoneIcon v-else class="w-4 h-4 text-green-400" />
                </div>
                <div
                  v-if="currentUser?.mediaState.screen"
                  class="size-8 rounded-lg bg-gray-800/20 dark:bg-white/20 flex items-center justify-center"
                >
                  <ComputerDesktopIcon class="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
          <!-- Local video controls -->
          <div
            class="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <button
              @click="toggleFullscreen('local')"
              class="size-8 rounded-lg bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black border border-gray-200/50 dark:border-gray-700/50 text-black dark:text-white flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ArrowsPointingInIcon v-if="fullscreenParticipantId === 'local'" class="w-4 h-4" />
              <ArrowsPointingOutIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Remote videos - only show participants with streams -->
        <template v-for="participant in participantsWithStreams" :key="participant.id">
          <div
            v-if="!fullscreenParticipantId || fullscreenParticipantId === participant.id"
            class="relative bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden min-h-[200px] shadow-sm border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex items-center justify-center group hover:shadow-md hover:-translate-y-0.5"
          >
            <!-- 视频元素 -->
            <video
              :ref="(el) => setRemoteVideoRef(participant.id, el)"
              autoplay
              playsinline
              class="video-element remote absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full object-contain w-full h-full"
              :class="{ 'opacity-0': !showRemoteVideo(participant.id) }"
              :style="{ display: !showRemoteVideo(participant.id) ? 'none' : 'block' }"
            />

            <!-- 只有音频或无视频时显示头像占位符 -->
            <div
              v-if="!showRemoteVideo(participant.id)"
              class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors"
            >
              <div class="text-center">
                <div
                  class="w-24 h-24 bg-white/20 dark:bg-black/20 rounded-full flex items-center justify-center mb-6 mx-auto overflow-hidden border-2 border-white/30 dark:border-black/30"
                >
                  <img
                    referrerpolicy="no-referrer"
                    @error="handleAvatarError"
                    v-if="participant.avatar"
                    :src="participant.avatar"
                    :alt="participant.name || 'User'"
                    class="w-full h-full object-cover rounded-full"
                  />
                  <span v-else class="text-3xl font-bold text-white dark:text-black">{{
                    participant.name?.charAt(0).toUpperCase() || 'U'
                  }}</span>
                </div>
                <p class="dark:text-white text-black font-medium text-sm">
                  {{ t('tools.webRtcMeeting.audioOnly') }}
                </p>
              </div>
            </div>

            <div
              class="video-overlay absolute bottom-0 left-0 right-0 p-4 rounded-b-xl"
            >
              <div class="participant-info flex justify-between items-center">
                <span class="participant-name dark:text-white font-semibold text-sm">{{
                  participant.name
                }}</span>
                <div class="media-indicators flex gap-2 items-center">
                  <div class="size-8 rounded-lg bg-gray-800/20 dark:bg-white/20 flex items-center justify-center">
                    <MicrophoneDisabledIcon
                      v-if="!participant.mediaState.audio"
                      class="w-4 h-4 text-red-400"
                    />
                    <MicrophoneIcon v-else class="w-4 h-4 text-green-400" />
                  </div>
                  <div
                    v-if="participant.mediaState.video"
                    class="size-8 rounded-lg bg-gray-800/20 dark:bg-white/20 flex items-center justify-center"
                  >
                    <VideoCameraIcon class="w-4 h-4 text-white" />
                  </div>
                  <div
                    v-if="participant.mediaState.screen"
                    class="size-8 rounded-lg bg-gray-800/20 dark:bg-white/20 flex items-center justify-center"
                  >
                    <ComputerDesktopIcon class="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Remote video controls -->
            <div
              class="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <button
                @click="toggleFullscreen(participant.id)"
                class="size-8 rounded-lg bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black border border-gray-200/50 dark:border-gray-700/50 text-black dark:text-white flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <ArrowsPointingInIcon
                  v-if="fullscreenParticipantId === participant.id"
                  class="w-4 h-4"
                />
                <ArrowsPointingOutIcon v-else class="w-4 h-4" />
              </button>
              <button
                @click="toggleRemoteAudio(participant.id)"
                class="size-8 rounded-lg bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black border border-gray-200/50 dark:border-gray-700/50 text-black dark:text-white flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
                :class="{ 'text-red-500 dark:text-red-400': isRemoteAudioMuted(participant.id) }"
              >
                <SpeakerWaveIcon v-if="!isRemoteAudioMuted(participant.id)" class="w-4 h-4" />
                <SpeakerXMarkIcon v-else class="w-4 h-4" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MicrophoneDisabledIcon from '@/components/icons/MicrophoneDisabledIcon.vue'
import { useMeetingStore } from '@/stores/meeting'
import { handleAvatarError } from '@/utils/helper'
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ComputerDesktopIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon
} from '@heroicons/vue/24/outline'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const meetingStore = useMeetingStore()

// Refs for video elements
const localVideoRef = ref<HTMLVideoElement>()
const remoteVideoRefs = ref<Map<string, HTMLVideoElement>>(new Map())

// Refs for audio mute state
const remoteAudioMuted = ref<Map<string, boolean>>(new Map())

// Ref for fullscreen state
const fullscreenParticipantId = ref<string | null>(null)

// Computed properties
const localStream = computed(() => meetingStore.localStream)
const currentUser = computed(() => meetingStore.currentUser)
const remoteParticipants = computed(() =>
  meetingStore.participantsList.filter((p) => p.id !== meetingStore.clientId)
)

// 计算属性：显示所有远程参与者，不管是否有流
const participantsWithStreams = computed(() => {
  // 显示所有远程参与者
  return remoteParticipants.value
})

// 显示本地视频：基于媒体状态（摄像头或屏幕共享任一开启）
const showLocalVideo = computed(
  () =>
    !!currentUser.value &&
    (!!currentUser.value.mediaState?.video || !!currentUser.value.mediaState?.screen)
)

// 显示远端视频：基于对方媒体状态（摄像头或屏幕共享任一开启）
function showRemoteVideo(participantId: string): boolean {
  const p = meetingStore.participants.get(participantId)
  if (!p) return false
  return !!p.mediaState?.video || !!p.mediaState?.screen
}

// 网格列数：基于当前实际可见的网格项数量（无论是否有视频）
const gridClass = computed(() => {
  // 计算当前实际显示的卡片数量（local + remote），与模板中的 v-show/v-if 条件一致
  const showsLocal =
    !!currentUser.value &&
    (!fullscreenParticipantId.value || fullscreenParticipantId.value === 'local')
  const visibleRemoteCount = participantsWithStreams.value.filter(
    (p) => !fullscreenParticipantId.value || fullscreenParticipantId.value === p.id
  ).length

  const totalTiles = (showsLocal ? 1 : 0) + visibleRemoteCount

  if (totalTiles <= 1) return 'grid-cols-1'
  if (totalTiles <= 2) return 'grid-cols-2'
  if (totalTiles <= 4) return 'grid-cols-2 grid-rows-2'
  if (totalTiles <= 6) return 'grid-cols-3 grid-rows-2'
  return 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))]'
})

// Toggle fullscreen
function toggleFullscreen(participantId: string) {
  if (fullscreenParticipantId.value === participantId) {
    // 取消全屏
    fullscreenParticipantId.value = null
  } else {
    // 设置全屏
    fullscreenParticipantId.value = participantId
  }
}

// Function to check if remote audio is muted
function isRemoteAudioMuted(participantId: string): boolean {
  return remoteAudioMuted.value.get(participantId) || false
}

// Toggle remote audio
function toggleRemoteAudio(participantId: string) {
  const videoElement = remoteVideoRefs.value.get(participantId)
  if (videoElement && videoElement.srcObject) {
    const stream = videoElement.srcObject as MediaStream
    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length > 0) {
      const isMuted = !audioTracks[0].enabled
      audioTracks[0].enabled = !audioTracks[0].enabled
      remoteAudioMuted.value.set(participantId, isMuted)
    }
  }
}

// Simple video element management
function setRemoteVideoRef(participantId: string, el: any) {
  if (el) {
    const videoElement = el as HTMLVideoElement
    remoteVideoRefs.value.set(participantId, videoElement)

    // Immediately assign stream if available
    const stream = meetingStore.remoteStreams.get(participantId)
    if (stream && stream.active) {
      videoElement.srcObject = stream
    } else {
      // 如果没有流，清空 srcObject
      videoElement.srcObject = null
    }
  } else {
    remoteVideoRefs.value.delete(participantId)
  }
}

// Simple watchers for stream changes
watch(
  localStream,
  (newStream) => {
    if (localVideoRef.value) {
      localVideoRef.value.srcObject = newStream
    }
  },
  { immediate: true }
)

watch(
  () => meetingStore.remoteStreams,
  (streams) => {
    console.log('Remote streams updated:', streams)
    nextTick(() => {
      // Assign streams to video elements
      for (const [participantId, stream] of streams) {
        const videoElement = remoteVideoRefs.value.get(participantId)
        if (videoElement) {
          console.log(`Assigning stream to video element for ${participantId}, stream: `, stream)
          if (stream && stream.active) {
            videoElement.srcObject = stream
          } else {
            videoElement.srcObject = null
          }
        }
      }

      // 为没有流的参与者清空 srcObject
      remoteVideoRefs.value.forEach((videoElement, participantId) => {
        if (!streams.has(participantId)) {
          videoElement.srcObject = null
        }
      })
    })
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
/* 响应式网格优化 */
@media (max-width: 768px) {
  .grid {
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .w-24.h-24 {
    width: 4rem;
    height: 4rem;
  }

  .text-3xl {
    font-size: 1.5rem;
  }
}

@media (max-width: 640px) {
  .grid {
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .w-24.h-24 {
    width: 3rem;
    height: 3rem;
  }

  .text-3xl {
    font-size: 1.25rem;
  }

  .absolute.top-3.right-3 {
    top: 0.5rem;
    right: 0.5rem;
  }

  .size-8 {
    width: 1.75rem;
    height: 1.75rem;
  }

  .size-8 svg {
    width: 0.875rem;
    height: 0.875rem;
  }
}

/* 全屏模式优化 */
.grid-cols-1 .group {
  max-height: 100%;
}

.grid-cols-1 .w-24.h-24 {
  width: 6rem;
  height: 6rem;
}

.grid-cols-1 .text-3xl {
  font-size: 2.5rem;
}

/* 加载状态动画 */
@keyframes pulse-custom {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

</style>
