<template>
  <div class="relative" ref="dropdownRef">
    <!-- Trigger slot -->
    <div @click="toggleDropdown" class="h-full">
      <slot name="trigger"></slot>
    </div>

    <!-- Dropdown content -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="contentRef"
        :style="dropdownStyle"
        class="fixed z-[9999] min-w-[160px] max-h-[240px] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
        @click="handleContentClick"
      >
        <slot name="content"></slot>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface Props {
  trigger?: 'click' | 'hover'
  position?: 'top' | 'bottom' | 'left' | 'right'
  popupMaxHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  trigger: 'click',
  position: 'bottom',
  popupMaxHeight: 240
})

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const dropdownStyle = ref<Record<string, string>>({})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      updatePosition()
    })
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

const handleContentClick = () => {
  // Close dropdown when an option is clicked
  closeDropdown()
}

const updatePosition = () => {
  if (!dropdownRef.value || !contentRef.value) return

  const triggerRect = dropdownRef.value.getBoundingClientRect()
  const contentRect = contentRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  let top = 0
  let left = 0

  switch (props.position) {
    case 'top':
      top = triggerRect.top - contentRect.height - 8
      left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
      // If not enough space on top, show at bottom
      if (top < 8) {
        top = triggerRect.bottom + 8
      }
      break
    case 'bottom':
      top = triggerRect.bottom + 8
      left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
      // If not enough space at bottom, show at top
      if (top + contentRect.height > viewportHeight - 8) {
        top = triggerRect.top - contentRect.height - 8
      }
      break
    case 'left':
      top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
      left = triggerRect.left - contentRect.width - 8
      // If not enough space on left, show on right
      if (left < 8) {
        left = triggerRect.right + 8
      }
      break
    case 'right':
      top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
      left = triggerRect.right + 8
      // If not enough space on right, show on left
      if (left + contentRect.width > viewportWidth - 8) {
        left = triggerRect.left - contentRect.width - 8
      }
      break
  }

  // Ensure dropdown stays within viewport
  if (left < 8) left = 8
  if (left + contentRect.width > viewportWidth - 8) {
    left = viewportWidth - contentRect.width - 8
  }
  if (top < 8) top = 8
  if (top + contentRect.height > viewportHeight - 8) {
    top = viewportHeight - contentRect.height - 8
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    maxHeight: `${props.popupMaxHeight}px`
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (!dropdownRef.value || !contentRef.value) return
  
  const target = event.target as Node
  if (!dropdownRef.value.contains(target) && !contentRef.value.contains(target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
})

watch(isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      updatePosition()
    })
  }
})
</script>

<style scoped>
/* Custom scrollbar for dropdown */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
</style>
