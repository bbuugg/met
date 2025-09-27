<template>
  <div class="min-h-screen p-4">
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <a-typography-title :heading="2">{{ t('tools.webRtcMeeting.monitoring.systemMonitoring') }}</a-typography-title>
        <a-typography-paragraph>{{ t('tools.webRtcMeeting.monitoring.realTimeInfo') }}</a-typography-paragraph>
      </div>

      <a-card>
        <a-typography-title :heading="4" style="margin-bottom: 16px">{{ t('tools.webRtcMeeting.monitoring.onlineRooms') }}</a-typography-title>
        <a-table
          :columns="columns"
          :data="rooms"
          :loading="loading"
          :pagination="false"
          :bordered="{ wrapper: true, cell: true }"
        >
          <template #id="{ record }">
            <RouterLink :to="`/meeting/${record.id}`">{{ record.id }}</RouterLink>
          </template>
          <template #clientCount="{ record }">
            <a-tag color="green">{{ record.clientCount }} {{ t('tools.webRtcMeeting.participants.count') }}</a-tag>
          </template>
          <template #action="{ record }">
            <a-button type="text" @click="viewRoomDetails(record)">{{ t('tools.webRtcMeeting.monitoring.viewDetails') }}</a-button>
          </template>
        </a-table>
      </a-card>

      <!-- Room Details Modal -->
      <a-modal
        v-model:visible="showRoomDetails"
        :title="t('tools.webRtcMeeting.monitoring.roomDetails') + ' - ' + (selectedRoom?.id || '')"
        @cancel="closeRoomDetails"
        @ok="closeRoomDetails"
        :width="800"
      >
        <a-spin :loading="roomDetailLoading">
          <div v-if="selectedRoom">
            <a-descriptions :title="t('tools.webRtcMeeting.monitoring.roomInfo')" :column="2" style="margin-bottom: 20px">
              <a-descriptions-item label="房间ID">{{ selectedRoom.id }}</a-descriptions-item>
              <a-descriptions-item label="创建时间">{{
                formatTime(selectedRoom.startTime)
              }}</a-descriptions-item>
              <a-descriptions-item label="在线人数">
                <a-tag color="green">{{ selectedRoom.clientCount }} {{ t('tools.webRtcMeeting.participants.count') }}</a-tag>
              </a-descriptions-item>
            </a-descriptions>

            <a-typography-title :heading="6" style="margin: 20px 0">{{ t('tools.webRtcMeeting.monitoring.roomMembers') }}</a-typography-title>
            <a-list :bordered="true">
              <a-list-item v-for="client in selectedRoom.clients" :key="client.id">
                <a-list-item-meta>
                  <template #avatar>
                    <a-avatar
                      :style="{ backgroundColor: client.role === 'master' ? '#6268ff' : '#165dff' }"
                    >
                      {{ client.name.charAt(0) }}
                    </a-avatar>
                  </template>
                  <template #title>
                    <div>{{ client.name }}</div>
                  </template>
                  <template #description>
                    <div>{{ client.id }}</div>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-tag :color="client.role === 'master' ? 'purple' : 'blue'">
                    {{ client.role === 'master' ? t('tools.webRtcMeeting.participants.host') : t('tools.webRtcMeeting.participants.member') }}
                  </a-tag>
                </template>
              </a-list-item>
            </a-list>
          </div>
        </a-spin>
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RoomInfo } from '@/types/monitoring'
import axios from 'axios'
import { onMounted, onUnmounted, ref, render } from 'vue'
import {
  TypographyTitle as ATypographyTitle,
  TypographyParagraph as ATypographyParagraph,
  Card as ACard,
  Table as ATable,
  Tag as ATag,
  Button as AButton,
  Modal as AModal,
  Spin as ASpin,
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  List as AList,
  ListItem as AListItem,
  ListItemMeta as AListItemMeta,
  Avatar as AAvatar,
  Empty as AEmpty
} from '@arco-design/web-vue'
import { getMinitorData } from '@/api'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const rooms = ref<RoomInfo[]>([])
const showRoomDetails = ref(false)
const selectedRoom = ref<RoomInfo | null>(null)
const refreshInterval = ref<number | null>(null)
const loading = ref(false)
const roomDetailLoading = ref(false)

const columns = [
  {
    title: '房间ID',
    dataIndex: 'id',
    slotName: 'id'
  },
  {
    title: '开始时间',
    dataIndex: 'startTime',
    render: (record: any) => formatTime(record.record.startTime)
  },
  {
    title: '活跃时间',
    dataIndex: 'lastActive',
    render: (record: any) => formatTime(record.record.lastActive)
  },
  {
    title: '当前参会人数',
    dataIndex: 'clientCount',
    slotName: 'clientCount'
  },
  {
    title: '最大参会人数',
    dataIndex: 'maxOnline',
    slotName: 'maxOnline'
  },
  {
    title: '操作',
    slotName: 'action'
  }
]

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
