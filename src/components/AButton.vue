<script setup>
import { computed } from 'vue'
import cntl from 'cntl'

const props = defineProps({
  color: String,
})

const colorClasses = computed(() => {
  switch (props.color) {
    case 'indigo':
      return cntl`
        bg-indigo-500 dark:bg-indigo-600
        hover:bg-indigo-600 dark:hover:bg-indigo-700
        text-indigo-50
        focus:ring-indigo-300 dark:focus:ring-indigo-500
      `
    case 'red':
      return cntl`
        bg-red-500 dark:bg-red-600
        hover:bg-red-600 dark:hover:bg-red-700
        text-red-50
        focus:ring-red-300 dark:focus:ring-red-500
      `
    default:
      return cntl`
        bg-indigo-500 dark:bg-indigo-600
        hover:bg-indigo-600 dark:hover:bg-indigo-700
        text-indigo-50
        focus:ring-indigo-300 dark:focus:ring-indigo-500
      `
  }
})
</script>

<template>
  <button
    :class="['inline-flex items-center justify-center',
    'px-4 py-2 font-semibold',
    'focus:outline-none focus:ring-2', colorClasses]">
    <slot></slot>
  </button>
</template>