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
