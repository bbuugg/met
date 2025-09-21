<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">系统监控</h1>
        <p class="text-gray-600 dark:text-gray-400">实时查看在线会议室和用户信息</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">在线会议室</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">房间ID</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">创建时间</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">人数</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="room in rooms" :key="room.id" class="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{{ room.id }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ formatTime(room.startTime) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {{ room.clientCount }} 人
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    @click="viewRoomDetails(room)" 
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    查看详情
                  </button>
                </td>
              </tr>
              <tr v-if="rooms.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  暂无在线会议室
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Room Details Modal -->
      <div v-if="showRoomDetails" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">房间详情 - {{ selectedRoom?.id }}</h3>
            <button 
              @click="closeRoomDetails" 
              class="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="p-6 overflow-y-auto max-h-[70vh]">
            <div class="mb-4">
              <h4 class="text-md font-medium text-gray-900 dark:text-white mb-2">房间信息</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">房间ID</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRoom?.id }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">创建时间</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatTime(selectedRoom?.startTime) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">在线人数</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRoom?.clientCount }} 人</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 class="text-md font-medium text-gray-900 dark:text-white mb-2">房间成员</h4>
              <div class="bg-gray-50 dark:bg-gray-750 rounded-lg overflow-hidden">
                <ul class="divide-y divide-gray-200 dark:divide-gray-700">
                  <li 
                    v-for="client in selectedRoom?.clients" 
                    :key="client.id" 
                    class="px-4 py-3 flex items-center justify-between"
                  >
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span class="text-indigo-800 dark:text-indigo-200 font-medium">{{ client.name.charAt(0) }}</span>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">{{ client.name }}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">{{ client.id }}</div>
                      </div>
                    </div>
                    <div>
                      <span 
                        :class="[
                          'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                          client.role === 'master' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        ]"
                      >
                        {{ client.role === 'master' ? '主持人' : '成员' }}
                      </span>
                    </div>
                  </li>
                  <li v-if="selectedRoom?.clients.length === 0" class="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    该房间暂无成员
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { RoomInfo, ClientInfo } from '@/types/monitoring'

const rooms = ref<RoomInfo[]>([])
const showRoomDetails = ref(false)
const selectedRoom = ref<RoomInfo | null>(null)
const refreshInterval = ref<number | null>(null)

// 格式化时间
const formatTime = (timeString: string | undefined) => {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

// 获取监控数据
const fetchMonitoringData = async () => {
  try {
    // 获取WebSocket URL或使用默认值
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
    const response = await fetch(`${apiUrl}/api/monitoring`)
    if (response.ok) {
      rooms.value = await response.json()
    }
  } catch (error) {
    console.error('获取监控数据失败:', error)
  }
}

// 查看房间详情
const viewRoomDetails = (room: RoomInfo) => {
  selectedRoom.value = room
  showRoomDetails.value = true
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