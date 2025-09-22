<template>
  <a-modal
    v-model:visible="visible"
    :title="t('legalNotice.title')"
    :ok-text="t('legalNotice.accept')"
    :cancel-text="t('legalNotice.decline')"
    :closable="false"
    :mask-closable="false"
    @ok="onAccept"
    @cancel="onDecline"
    :width="400"
  >
    <div class="mb-6">
      <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {{ t('legalNotice.content') }}
      </p>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Modal as AModal } from '@arco-design/web-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const emit = defineEmits<{
  (e: 'accept'): void
}>()

// 控制Modal显示的响应式变量
const visible = ref(true)

// 监听visible变化，如果Modal被关闭，则触发accept事件
watch(visible, (newVal) => {
  if (!newVal) {
    emit('accept')
  }
})

const onAccept = () => {
  visible.value = false
}

const onDecline = () => {
  // 用户拒绝法律声明，返回首页
  router.push('/')
}
</script>