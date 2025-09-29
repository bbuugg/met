<template>
  <div class="h-screen relative bg-white dark:bg-black" :class="{ 'arco-theme-dark': isDarkTheme }">
    <RouterView />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useUserStore } from './stores/user';

const userStore = useUserStore();

userStore.updateInfo();

// 暗色主题
const isDarkTheme = computed(() => {
  return document.documentElement.classList.contains('dark')
})
</script>