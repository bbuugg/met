<template>
  <div class="px-6 py-3 flex justify-between items-center bg-white dark:bg-gray-800">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <UserGroupIcon class="h-5 w-5 text-indigo-400" />
        <span class="text-gray-800 dark:text-white font-medium">{{ roomId }}</span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button
        @click="showShareModal"
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-lg flex items-center transition-colors duration-200"
      >
        <LinkIcon class="h-5 w-5 mr-2" />
        <span>{{ t('tools.webRtcMeeting.meeting.share') }}</span>
      </button>
    </div>
  </div>

  <!-- Share Meeting Modal -->
  <div
    v-if="shareModalVisible"
    class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm"
    @click.self="shareModalVisible = false"
  >
    <div
      class="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 z-10 mx-4"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl">
        <div
          class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <h3 class="m-0 text-xl font-semibold text-gray-800 dark:text-white">
            {{ t('tools.webRtcMeeting.meeting.shareMeeting') }}
          </h3>
          <button
            @click="shareModalVisible = false"
            class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :aria-label="t('tools.webRtcMeeting.meeting.close')"
          >
            <XMarkIcon class="h-5 w-5 text-gray-800 dark:text-white" />
          </button>
        </div>

        <div class="flex flex-col gap-6 p-6">
          <div class="text-center">
            <div
              class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 mb-4 shadow-lg"
            >
              <LinkIcon class="h-8 w-8 text-white" />
            </div>
            <h2 class="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
              {{ t('tools.webRtcMeeting.meeting.shareMeeting') }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400">
              {{ t('tools.webRtcMeeting.meeting.invitedToMeeting') }}
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <label class="font-medium text-gray-700 dark:text-gray-300">{{
              t('tools.webRtcMeeting.meeting.meetingLink')
            }}</label>
            <div
              class="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center border border-gray-200 dark:border-gray-600"
            >
              <LinkIcon class="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
              <span class="font-medium text-gray-800 dark:text-white truncate">{{
                meetingLink
              }}</span>
            </div>
          </div>

          <div class="flex justify-center">
            <button
              @click="copyLink"
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              <CheckIcon v-if="copySuccess" class="h-5 w-5 mr-2" />
              <ClipboardIcon v-else class="h-5 w-5 mr-2" />
              <span>{{
                copySuccess
                  ? t('tools.webRtcMeeting.meeting.copySuccess')
                  : t('tools.webRtcMeeting.meeting.copyLink')
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '@/stores/meeting'
import {
  CheckIcon,
  ClipboardIcon,
  LinkIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const meetingStore = useMeetingStore()

const shareModalVisible = ref(false)
const copySuccess = ref('')

const roomId = computed(() => meetingStore.roomId)

// 计算不包含clientId的会议链接
const meetingLink = computed(() => {
  const baseUrl = window.location.origin
  return `${baseUrl}/meeting/${roomId.value}`
})

function showShareModal() {
  shareModalVisible.value = true
  copySuccess.value = ''
}

function copyLink() {
  navigator.clipboard.writeText(meetingLink.value).then(() => {
    copySuccess.value = 'Link copied to clipboard!'
    setTimeout(() => {
      copySuccess.value = ''
    }, 3000)
  })
}
</script>
