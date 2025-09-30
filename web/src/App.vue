<template>
  <div class="h-screen relative bg-white dark:bg-black">
    <RouterView />
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from './stores/user';

const userStore = useUserStore();

userStore.updateInfo();
</script>