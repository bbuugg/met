<template>
  <div
    class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
    @click="handleClick"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  value?: string | number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  emit('click')
}
</script>
