<template>
  <!-- Legal Notice Modal -->
  <div
    v-if="visible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="onDecline"
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
            class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black dark:bg-white mb-3 sm:mb-4 transition-colors"
          >
            <ShieldCheckIcon class="h-5 w-5 sm:h-6 sm:w-6 text-white dark:text-black" />
          </div>
          <h2 class="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-black dark:text-white">
            {{ t('legalNotice.title') }}
          </h2>
          <p
            class="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed px-2 sm:px-0"
          >
            请仔细阅读以下条款并确认同意
          </p>
        </div>

        <!-- 内容区域 -->
        <div class="mb-4 sm:mb-6">
          <div class="relative">
            <div
              ref="contentContainer"
              @scroll="handleScroll"
              class="max-h-40 sm:max-h-48 overflow-y-auto p-2 sm:p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
            >
              <p
                class="text-black dark:text-white whitespace-pre-line leading-relaxed text-xs sm:text-sm"
              >
                {{ t('legalNotice.content') }}
              </p>
            </div>
            <!-- 滚动提示 -->
            <div
              v-if="!hasScrolledToBottom"
              class="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-600 opacity-50 transition-opacity"
            >
              <span class="flex items-center gap-1 animate-bounce">
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                滚动查看更多
              </span>
            </div>

            <!-- 已读完提示 -->
            <div
              v-if="hasScrolledToBottom"
              class="absolute bottom-2 right-2 text-xs text-green-600 dark:text-green-400 transition-opacity"
            >
              <span class="flex items-center gap-1">
                <CheckIcon class="h-3 w-3" />
                已阅读完毕
              </span>
            </div>
          </div>
        </div>

        <!-- 确认区域 -->
        <div class="mb-4">
          <label class="flex items-start gap-2 cursor-pointer group">
            <div class="relative flex-shrink-0 mt-0.5">
              <input v-model="hasReadTerms" type="checkbox" class="sr-only" />
              <div
                class="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded transition-all group-hover:border-gray-400 dark:group-hover:border-gray-500"
                :class="{
                  'bg-black dark:bg-white border-black dark:border-white': hasReadTerms,
                  'bg-white dark:bg-black': !hasReadTerms
                }"
              >
                <CheckIcon
                  v-if="hasReadTerms"
                  class="h-2.5 w-2.5 text-white dark:text-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                />
              </div>
            </div>
            <span class="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
              我已仔细阅读并同意上述条款和条件
            </span>
          </label>
        </div>

        <!-- 按钮区域 -->
        <div class="flex flex-col sm:flex-row gap-2">
          <button
            @click="onAccept"
            :disabled="!hasReadTerms"
            class="flex-1 py-2 px-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none transition-all flex items-center justify-center gap-1.5 order-2 sm:order-1 text-sm"
          >
            <CheckIcon class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">{{ t('legalNotice.accept') }}</span>
            <span class="sm:hidden">同意</span>
          </button>
          <button
            @click="onDecline"
            class="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 text-black dark:text-white font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-all order-1 sm:order-2 text-sm flex items-center justify-center gap-1.5"
          >
            <XMarkIcon class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">{{ t('legalNotice.decline') }}</span>
            <span class="sm:hidden">拒绝</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheckIcon, CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()

const emit = defineEmits<{
  (e: 'accept'): void
}>()

// 控制Modal显示的响应式变量
const visible = ref(true)
// 控制是否已阅读条款
const hasReadTerms = ref(false)
// 内容容器引用
const contentContainer = ref<HTMLElement>()
// 是否已滚动到底部
const hasScrolledToBottom = ref(false)

const onAccept = () => {
  visible.value = false
  emit('accept')
}

const onDecline = () => {
  // 用户拒绝法律声明，返回首页
  visible.value = false
  router.push('/')
}

// 处理滚动事件
const handleScroll = () => {
  if (!contentContainer.value) return

  const { scrollTop, scrollHeight, clientHeight } = contentContainer.value
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5 // 5px tolerance

  if (isAtBottom && !hasScrolledToBottom.value) {
    hasScrolledToBottom.value = true
    // 可以在这里添加一些视觉反馈，比如高亮复选框
  }
}
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

/* 按钮悬停效果 */
button {
  transition: all 0.2s ease-in-out;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dark button:hover {
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.05);
}

button:active {
  transform: translateY(0);
}

button:disabled {
  transform: none !important;
  box-shadow: none !important;
}

button:disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}

/* 内容区域动画 */
.p-8 > * {
  animation: fadeInUp 0.3s ease-out;
}

.p-8 > *:nth-child(2) {
  animation-delay: 0.1s;
}

.p-8 > *:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 图标容器脉冲效果 */
.inline-flex.items-center.justify-center.w-16.h-16 {
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 弹跳动画 */
.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

/* 内容区域样式优化 */
.max-h-48,
.max-h-64 {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.dark .max-h-48,
.dark .max-h-64 {
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

/* 自定义模态框样式 */
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

/* 移动端优化 */
@media (max-width: 640px) {
  .max-h-\[90vh\] {
    max-height: calc(100vh - 2rem) !important;
  }

  .flex-col button {
    min-height: 36px;
  }
}
</style>
