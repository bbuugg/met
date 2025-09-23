<template>
  <div class="flex flex-col h-full">
    <div class="h-72 md:h-full">
      <!-- 当没有任何流时显示提示 -->
      <div v-show="!localStream && participantsWithStreams.length === 0"
        class="flex items-center justify-center h-full bg-gray-100 dark:bg-black rounded-xl">
        <div class="text-center p-8">
          <VideoCameraIcon class="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('tools.webRtcMeeting.video.waitingForParticipant') }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 max-w-md">
            {{ t('tools.webRtcMeeting.meeting.invitedToMeeting') }}
          </p>
        </div>
      </div>

      <!-- 视频网格 -->
      <div class="bg-gray-100 dark:bg-black flex-1 grid gap-4 h-full w-full p-2 rounded-xl" :class="gridClass">
        <!-- Local video - only show if we have a local stream -->
        <div v-show="localStream && (!fullscreenParticipantId || fullscreenParticipantId === 'local')"
          class="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden min-h-[200px] shadow-lg border border-gray-300/50 dark:border-gray-600/50 transition-all duration-300 ease-in-out flex items-center justify-center">
          <video ref="localVideoRef" autoplay muted playsinline
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full object-contain w-full h-full" />
          <div
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 rounded-b-xl">
            <div class="flex justify-between items-center">
              <span class="text-white font-semibold text-sm shadow-md">{{
                t('tools.webRtcMeeting.you')
                }}</span>
              <div class="flex gap-2 items-center">
                <MicrophoneDisabledIcon class="h-4 w-4 text-red-400 shadow-md" v-if="!currentUser?.mediaState.audio" />
                <ComputerDesktopIcon v-if="currentUser?.mediaState.screen" class="h-4 w-4 text-blue-400 shadow-md" />
              </div>
            </div>
          </div>
          <!-- Local video controls -->
          <div class="video-controls absolute top-2.5 right-2.5 z-10 flex">
            <button @click="toggleFullscreen('local')"
              class="control-button w-9 h-9 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-white flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110">
              <ArrowsPointingInIcon v-if="fullscreenParticipantId === 'local'" class="h-5 w-5" />
              <ArrowsPointingOutIcon v-else class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Remote videos - only show participants with streams -->
        <template v-for="participant in participantsWithStreams" :key="participant.id">
          <div v-if="!fullscreenParticipantId || fullscreenParticipantId === participant.id"
            class="video-tile remote-video relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden min-h-[200px] shadow-lg border border-gray-300/50 dark:border-gray-600/50 transition-all duration-300 ease-in-out flex items-center justify-center">
            <video :ref="(el) => setRemoteVideoRef(participant.id, el)" autoplay playsinline
              class="video-element remote absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full object-contain w-full h-full" />

            <div
              class="video-overlay absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 rounded-b-xl">
              <div class="participant-info flex justify-between items-center">
                <span class="participant-name text-white font-semibold text-sm shadow-md">{{
                  participant.name
                  }}</span>
                <div class="media-indicators flex gap-2 items-center">
                  <MicrophoneDisabledIcon v-if="!participant.mediaState.audio" class="h-4 w-4 text-red-400 shadow-md" />
                  <VideoCameraIcon v-if="participant.mediaState.video" class="h-4 w-4 text-blue-400 shadow-md" />
                  <ComputerDesktopIcon v-if="participant.mediaState.screen" class="h-4 w-4 text-blue-400 shadow-md" />
                </div>
              </div>
            </div>

            <!-- Remote video controls -->
            <div class="video-controls absolute top-2.5 right-2.5 z-10 flex">
              <button @click="toggleFullscreen(participant.id)"
                class="control-button w-9 h-9 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-white flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110">
                <ArrowsPointingInIcon v-if="fullscreenParticipantId === participant.id" class="h-5 w-5" />
                <ArrowsPointingOutIcon v-else class="h-5 w-5" />
              </button>
              <button @click="toggleRemoteAudio(participant.id)"
                class="control-button ml-2 w-9 h-9 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-white flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                :class="{ 'text-red-500': isRemoteAudioMuted(participant.id) }">
                <SpeakerWaveIcon v-if="!isRemoteAudioMuted(participant.id)" class="h-5 w-5" />
                <SpeakerXMarkIcon v-else class="h-5 w-5" />
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
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ComputerDesktopIcon,
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
const localAudioEnabled = ref<boolean>(true)

// Ref for fullscreen state
const fullscreenParticipantId = ref<string | null>(null)

// Computed properties
const localStream = computed(() => meetingStore.localStream)
const currentUser = computed(() => meetingStore.currentUser)
const remoteParticipants = computed(() =>
  meetingStore.participantsList.filter((p) => p.id !== meetingStore.clientId)
)

// 计算属性：只包含拥有有效流的参与者
const participantsWithStreams = computed(() => {
  // 只要流中有音频或视频 track 就显示
  return remoteParticipants.value.filter((participant) => {
    const stream = meetingStore.remoteStreams.get(participant.id)
    return (
      stream !== undefined &&
      stream !== null &&
      (stream.getAudioTracks().length > 0 || stream.getVideoTracks().length > 0) &&
      stream.active === true
    )
  })
})

// 修改gridClass计算属性，只计算有流的参与者数量
const gridClass = computed(() => {
  // 只计算本地流和拥有远程流的参与者
  const localStreamCount = localStream.value ? 1 : 0
  const remoteStreamCount = participantsWithStreams.value.length
  let totalParticipants = localStreamCount + remoteStreamCount
  if (fullscreenParticipantId.value) {
    totalParticipants = 1
  }

  if (totalParticipants <= 1) return 'grid-cols-1'
  if (totalParticipants <= 2) return 'grid-cols-2'
  if (totalParticipants <= 4) return 'grid-cols-2 grid-rows-2'
  if (totalParticipants <= 6) return 'grid-cols-3 grid-rows-2'
  return 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))]'
})

// Computed property for local audio state
const isLocalAudioEnabled = computed(() => {
  return localAudioEnabled.value && currentUser.value?.mediaState.audio
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
    if (stream) {
      videoElement.srcObject = stream
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
      console.log('Setting local video stream:', newStream)
      if (newStream) {
        console.log('Local stream tracks:', newStream.getTracks())
        newStream.getTracks().forEach((track) => {
          console.log('Track info:', track.kind, track.label, track.readyState)
          // @ts-ignore
          if (track.getSettings) {
            // @ts-ignore
            console.log('Track settings:', track.getSettings())
          }
        })
      }
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
          videoElement.srcObject = stream
        }
      }
    })
  },
  { deep: true, immediate: true }
)
</script>