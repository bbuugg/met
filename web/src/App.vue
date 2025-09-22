<template>
  <div class="relative bg-white dark:bg-gray-800" :class="{ 'arco-theme-dark': isDarkTheme }">
    <RouterView />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

// 暗色主题
const isDarkTheme = computed(() => {
  return document.documentElement.classList.contains('dark')
})
</script>