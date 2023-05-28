<script setup>
import { ref, computed } from 'vue'
import { sample } from 'lodash'
import Fragment from './Fragment.vue'

const image = ref(null)
const dimens = ref({ x: 0, y: 0 })
const fragments = ref([])
const fragmentSize = ref({ width: 0, height: 0 })

const preparing = ref(true)
const shuffling = ref(false)

const frameSizeStyles = computed(() => {
  return {
    width: `${fragmentSize.value.width * dimens.value.x}px`,
    height: `${fragmentSize.value.height * dimens.value.y}px`,
  }
})

const totalFragments = computed(() => dimens.value.x * dimens.value.y)

const solved = computed(() => {
  if (preparing.value || !fragments.value.length) return false

  for (let i = 0; i < totalFragments.value; i++) {
    if (fragments.value[i].styles.order !== fragments.value[i].position) {
      return false
    }
  }

  return true
})


/**
 * Load image, make fragments, shuffle.
 * @param args Image URL and dimension.
 */
const start = (args) => {
  preparing.value = true

  image.value = args.image
  dimens.value = args.dimens

  const img = new Image()
  img.src = image.value

  img.onload = async () => {
    // Setting new dimension and fragment size
    if (img.width < img.height) {
      fragmentSize.value.width = Math.floor(img.width / dimens.value.x)

      dimens.value.y = Math.floor(img.height / fragmentSize.value.width)
      fragmentSize.value.height = Math.floor(img.height / dimens.value.y)
    } else {
      fragmentSize.value.height = Math.floor(img.height / dimens.value.y)

      dimens.value.x = Math.floor(img.width / fragmentSize.value.height)
      fragmentSize.value.width = Math.floor(img.width / dimens.value.x)
    }
    
    generateFragments()
    await shuffleFragments()

    preparing.value = false
  }
}

/**
 * Generate fragments from image.
 */
const generateFragments = () => {
  fragments.value = []

  const bgStyle = (index) => {
    return (index === totalFragments.value - 1)
      ? 'transparent'
      : `url(${image.value})`
  }

  const bgPositionXStyle = (index) => {
    return `-${(index % dimens.value.x) * fragmentSize.value.width}px`
  }

  const bgPositionYStyle = (index) => {
    return `-${Math.floor(index / dimens.value.x) * fragmentSize.value.height}px`
  }
 
  for (let i = 0; i < totalFragments.value; i++) {
    fragments.value.push({
      position: i,
      empty: i === totalFragments.value - 1,
      styles: {
        background: bgStyle(i),
        backgroundPositionX: bgPositionXStyle(i),
        backgroundPositionY: bgPositionYStyle(i),
        width: `${fragmentSize.value.width}px`,
        height: `${fragmentSize.value.height}px`,
        order: i,
      },
    })
  }
}

/**
 * Wait for a specific time.
 * @param {Number} time Time in milliseconds .
 */
const delay = (time) => new Promise(res => setTimeout(res, time))

/**
 * Move generated fragments randomly.
 */
const shuffleFragments = async () => {
  shuffling.value = true

  for (let i = 0; i < totalFragments.value * 5; i++) {
    const emptyFragment = fragments.value.find(frag => frag.empty)
    const movableFragments = fragments.value.filter(frag => {
      return getAdjacentOrders(emptyFragment).indexOf(frag.styles.order) > -1
    })

    const randomFragment = sample(movableFragments)
    await delay(10)

    switchFragments(emptyFragment, randomFragment)
  }

  shuffling.value = false
}

/**
 * Move fragment to an empty space.
 * @param frag Fragment to be moved.
 */
const moveFragment = (fragment) => {
  if (fragment.empty) return

  // Find 4 direct adjacent fragments and see if any of them is empty.
  const target = fragments.value.find(frag => {
    return frag.empty && getAdjacentOrders(fragment).indexOf(frag.styles.order) > -1
  })

  // If found the empty fragment, switch the flex order
  target && switchFragments(target, fragment)
}

/**
 * Switch two fragments.
 * @param frag1 Fragment 1. 
 * @param frag2 Fragment 2.
 */
const switchFragments = (frag1, frag2) => {
  [frag1.styles.order, frag2.styles.order] = [frag2.styles.order, frag1.styles.order]
}

/**
 * Get the order values of 4 adjacent fragment.
 * @param fragment Fragment reference. 
 */
const getAdjacentOrders = (fragment) => {
  const pos = fragment.styles.order
  
  // Left, Right, Top, Bottom order values
  return [
    pos % dimens.value.x ? pos - 1 : null,
    (pos + 1) % dimens.value.x ? pos + 1 : null,
    pos - dimens.value.x,
    pos + dimens.value.x,
  ]
}

defineExpose({ start, shuffleFragments })
</script>

<template>
  <div>
    <div class="mx-auto relative" :style="frameSizeStyles">
      <!-- Solved image -->
      <div v-if="solved" :style="{ background: `url(${image})`}"
        class="absolute top-0 left-0 h-full w-full">
      </div>

      <!-- Cover -->
      <div v-if="preparing || shuffling"
        class="absolute top-0 left-0 h-full w-full bg-indigo-900/60">
      </div>

      <!-- Fragments -->
      <div class="flex flex-wrap bg-indigo-900">
        <Fragment v-for="fragment in fragments" :key="fragment.position"
          :fragment="fragment"
          @click="moveFragment(fragment)" />
      </div>
    </div>
  </div>
</template>