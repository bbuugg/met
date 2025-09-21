<template>
  <div class="relative bg-white dark:bg-gray-800">
    <RouterView />
    <!-- 自定义Toast组件 -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="p-4 rounded-lg shadow-lg flex items-start max-w-sm animate-fade-in"
        :class="{
          'bg-green-500 text-white': toast.severity === 'success',
          'bg-red-500 text-white': toast.severity === 'error',
          'bg-blue-500 text-white': toast.severity === 'info',
          'bg-yellow-500 text-white': toast.severity === 'warn'
        }"
      >
        <div class="flex-1">
          <div class="font-medium" v-if="toast.summary">{{ toast.summary }}</div>
          <div class="text-sm" v-if="toast.detail">{{ toast.detail }}</div>
        </div>
        <button @click="removeToast(toast.id)" class="ml-2 text-white hover:text-gray-200">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { onMounted, onUnmounted, ref } from 'vue'

// Toast状态管理
const toasts = ref<{id: number, severity: string, summary?: string, detail?: string}[]>([])

// 添加Toast的方法
function addToast(event: MessageEvent) {
  if (event.data.type === 'ADD_TOAST') {
    const { severity, summary, detail } = event.data
    const id = Date.now() + Math.random()
    toasts.value.push({ id, severity, summary, detail })
    
    // 3秒后自动移除
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  } else if (event.data.type === 'REMOVE_TOAST') {
    const { id } = event.data
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }
}

// 移除Toast的方法
function removeToast(id: number) {
  const index = toasts.value.findIndex(toast => toast.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

onMounted(() => {
  // 监听来自服务的消息
  window.addEventListener('message', addToast)
})

onUnmounted(() => {
  // 移除事件监听器
  window.removeEventListener('message', addToast)
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>