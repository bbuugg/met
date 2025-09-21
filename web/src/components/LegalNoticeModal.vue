<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('legalNotice.title') }}
          </h3>
        </div>
        <div class="mb-6">
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {{ t('legalNotice.content') }}
          </p>
        </div>
        <div class="flex justify-end">
          <button
            @click="onAccept"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            {{ t('legalNotice.accept') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'accept'): void
}>()

const onAccept = () => {
  emit('accept')
}
</script>