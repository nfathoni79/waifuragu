<script setup>
import { computed } from 'vue'
import cntl from 'cntl'

const props = defineProps({
  fragment: Object,
})

const borderClasses = computed(() => {
  if (props.fragment.empty) {
    return cntl`hover:border-gray-800 hover:cursor-default`
  }

  return cntl`hover:border-indigo-500 hover:cursor-pointer`
})
</script>

<template>
  <div :style="fragment.styles"
    :class="['border border-gray-800', borderClasses]">
  </div>
</template>