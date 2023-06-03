<script setup>
import { computed } from 'vue'
import cntl from 'cntl'

const props = defineProps({
  fragment: Object,
})

const dynamicClasses = computed(() => {
  if (props.fragment.empty) {
    return cntl`
      hover:cursor-default hover:border-gray-800
      shadow-[inset_0px_5px_10px_rgba(0,0,0,0.5)]
    `
  }

  return cntl`
    hover:cursor-pointer hover:border-indigo-500
    hover:ring hover:ring-indigo-500 hover:ring-opacity-50 hover:z-10
    ${props.fragment.transitionClasses}
  `
})
</script>

<template>
  <div :style="fragment.styles"
    :class="['border border-gray-800', dynamicClasses]">
  </div>
</template>