<template>
  <div class="min-h-screen bg-white dark:bg-black transition-colors">
    <!-- 顶部导航栏 -->
    <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link
              to="/"
              class="flex items-center gap-2 text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              <ArrowLeftIcon class="h-5 w-5" />
              <span class="font-medium">返回首页</span>
            </router-link>
          </div>
          <div class="flex items-center gap-2">
            <!-- 刷新按钮 -->
            <button
              @click="fetchMonitoringData"
              :disabled="loading"
              class="w-10 h-10 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-center shadow-sm transition-all disabled:opacity-50"
              title="刷新数据"
            >
              <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="max-w-7xl mx-auto p-6">
      <!-- 页面标题 -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-lg bg-black dark:bg-white flex items-center justify-center">
            <ChartBarIcon class="h-6 w-6 text-white dark:text-black" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-black dark:text-white">
              {{ t('tools.webRtcMeeting.monitoring.systemMonitoring') }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {{ t('tools.webRtcMeeting.monitoring.realTimeInfo') }}
            </p>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">活跃房间</p>
                <p class="text-2xl font-bold text-black dark:text-white">{{ rooms.length }}</p>
              </div>
              <div
                class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
              >
                <HomeIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>

          <div
            class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">总参与人数</p>
                <p class="text-2xl font-bold text-black dark:text-white">{{ totalParticipants }}</p>
              </div>
              <div
                class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
              >
                <UsersIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>

          <div
            class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">最后更新</p>
                <p class="text-sm font-medium text-black dark:text-white">{{ lastUpdateTime }}</p>
              </div>
              <div
                class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
              >
                <ClockIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 房间列表 -->
      <div class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
        <div class="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-black dark:text-white">
            {{ t('tools.webRtcMeeting.monitoring.onlineRooms') }}
          </h2>
        </div>

        <div class="p-6">
          <!-- 空状态 -->
          <div v-if="!loading && rooms.length === 0" class="text-center py-12">
            <div
              class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-4"
            >
              <HomeIcon class="h-8 w-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 class="text-lg font-medium text-black dark:text-white mb-2">暂无活跃房间</h3>
            <p class="text-gray-600 dark:text-gray-400">当前没有正在进行的会议</p>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="text-center py-12">
            <div
              class="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"
            ></div>
            <p class="text-gray-600 dark:text-gray-400">加载中...</p>
          </div>

          <!-- 房间卡片列表 -->
          <div v-if="!loading && rooms.length > 0" class="space-y-4">
            <div
              v-for="room in rooms"
              :key="room.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all group"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <router-link
                      :to="`/meeting/${room.id}`"
                      class="font-medium text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors truncate"
                    >
                      {{ room.id }}
                    </router-link>
                    <div class="flex items-center gap-1">
                      <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span class="text-xs text-gray-600 dark:text-gray-400">活跃</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">开始时间</span>
                      <p class="text-black dark:text-white font-medium">
                        {{ formatTime(room.startTime) }}
                      </p>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">最后活跃</span>
                      <p class="text-black dark:text-white font-medium">
                        {{ formatTime(room.lastActive) }}
                      </p>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">当前人数</span>
                      <p class="text-black dark:text-white font-medium">
                        {{ room.clientCount }} 人
                      </p>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">最大人数</span>
                      <p class="text-black dark:text-white font-medium">{{ room.maxOnline }} 人</p>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 ml-4">
                  <button
                    @click="viewRoomDetails(room)"
                    class="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-black dark:text-white text-sm font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition-all opacity-70 group-hover:opacity-100"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Room Details Modal -->
      <div
        v-if="showRoomDetails"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="closeRoomDetails"
      >
        <div
          class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
          @click.stop
        >
          <!-- 模态框头部 -->
          <div
            class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center"
              >
                <HomeIcon class="h-5 w-5 text-white dark:text-black" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-black dark:text-white">
                  {{ t('tools.webRtcMeeting.monitoring.roomDetails') }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ selectedRoom?.id }}</p>
              </div>
            </div>
            <button
              @click="closeRoomDetails"
              class="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center justify-center transition-colors"
            >
              <XMarkIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- 模态框内容 -->
          <div class="p-6 overflow-y-auto max-h-[60vh]">
            <div v-if="roomDetailLoading" class="text-center py-8">
              <div
                class="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"
              ></div>
              <p class="text-gray-600 dark:text-gray-400">加载中...</p>
            </div>

            <div v-else-if="selectedRoom" class="space-y-6">
              <!-- 房间信息 -->
              <div>
                <h4 class="text-sm font-semibold text-black dark:text-white mb-4">
                  {{ t('tools.webRtcMeeting.monitoring.roomInfo') }}
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400">房间ID</p>
                    <p class="font-medium text-black dark:text-white">{{ selectedRoom.id }}</p>
                  </div>
                  <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400">创建时间</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ formatTime(selectedRoom.startTime) }}
                    </p>
                  </div>
                  <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400">在线人数</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ selectedRoom.clientCount }} 人
                    </p>
                  </div>
                  <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400">最大人数</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ selectedRoom.maxOnline }} 人
                    </p>
                  </div>
                </div>
              </div>

              <!-- 参与者列表 -->
              <div>
                <h4 class="text-sm font-semibold text-black dark:text-white mb-4">
                  {{ t('tools.webRtcMeeting.monitoring.roomMembers') }}
                </h4>
                <div class="space-y-3">
                  <div
                    v-for="client in selectedRoom.clients"
                    :key="client.id"
                    class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        :class="
                          client.role === 'master'
                            ? 'bg-black dark:bg-white'
                            : 'bg-gray-600 dark:bg-gray-400'
                        "
                      >
                        <span
                          :class="
                            client.role === 'master'
                              ? 'text-white dark:text-black'
                              : 'text-white dark:text-black'
                          "
                        >
                          {{ client.name.charAt(0) }}
                        </span>
                      </div>
                      <div>
                        <p class="font-medium text-black dark:text-white">{{ client.name }}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">{{ client.id }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span
                        class="px-2 py-1 text-xs font-medium rounded"
                        :class="
                          client.role === 'master'
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        "
                      >
                        {{
                          client.role === 'master'
                            ? t('tools.webRtcMeeting.participants.host')
                            : t('tools.webRtcMeeting.participants.member')
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 模态框底部 -->
          <div class="flex justify-end p-6 border-t border-gray-200 dark:border-gray-800">
            <button
              @click="closeRoomDetails"
              class="px-4 py-2 border border-gray-200 dark:border-gray-700 text-black dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RoomInfo } from '@/types/monitoring'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getMinitorData } from '@/api'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChartBarIcon,
  HomeIcon,
  UsersIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()

const rooms = ref<RoomInfo[]>([])
const showRoomDetails = ref(false)
const selectedRoom = ref<RoomInfo | null>(null)
const refreshInterval = ref<number | null>(null)
const loading = ref(false)
const roomDetailLoading = ref(false)
const lastUpdateTime = ref('')

// 计算总参与人数
const totalParticipants = computed(() => {
  return rooms.value.reduce((total, room) => total + room.clientCount, 0)
})

// 格式化时间
const formatTime = (timeString: string | undefined) => {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

// 获取监控数据
const fetchMonitoringData = async () => {
  try {
    loading.value = true
    const response = await getMinitorData()
    rooms.value = response.data
    lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN')
  } catch (error) {
    console.error('获取监控数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 查看房间详情
const viewRoomDetails = async (room: RoomInfo) => {
  selectedRoom.value = room
  showRoomDetails.value = true

  // 模拟加载状态
  roomDetailLoading.value = true
  // 这里可以调用API获取更详细的房间信息
  setTimeout(() => {
    roomDetailLoading.value = false
  }, 300)
}

// 关闭房间详情
const closeRoomDetails = () => {
  showRoomDetails.value = false
  selectedRoom.value = null
}

// 开始定时刷新
const startRefresh = () => {
  refreshInterval.value = window.setInterval(fetchMonitoringData, 5000) // 每5秒刷新一次
}

// 停止定时刷新
const stopRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

onMounted(() => {
  fetchMonitoringData()
  startRefresh()
})

onUnmounted(() => {
  stopRefresh()
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* 卡片悬停效果 */
.group {
  transition: all 0.2s ease-in-out;
}

.group:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dark .group:hover {
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.05);
}

/* 按钮悬停效果 */
button {
  transition: all 0.2s ease-in-out;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

/* 状态指示器动画 */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 加载动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 模态框动画 */
.fixed.inset-0 {
  animation: fadeIn 0.2s ease-out;
}

.fixed.inset-0 > div {
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 统计卡片动画 */
.grid > div {
  animation: fadeInUp 0.3s ease-out;
}

.grid > div:nth-child(2) {
  animation-delay: 0.1s;
}

.grid > div:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
