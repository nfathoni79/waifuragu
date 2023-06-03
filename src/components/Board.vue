<script setup>
import { ref, computed } from 'vue'
import { sample } from 'lodash'
import cntl from 'cntl'
import Fragment from './Fragment.vue'

const image = ref(null)
const dimens = ref({ x: 0, y: 0 })
const fragments = ref([])
const fragmentSize = ref({ width: 0, height: 0 })

const preparing = ref(true)
const shuffling = ref(false)
const imageReady = ref(false)

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
  imageReady.value = false
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
    imageReady.value = true
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
      transitionClasses: cntl`transition ease-in-out duration-75`,
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
    const emptyFragment = fragments.value[totalFragments.value - 1]
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
const moveFragment = async (fragment) => {
  if (fragment.empty) return

  // Find 4 direct adjacent fragments and see if any of them is empty.
  // Also find the direction of the empty fragment.
  let directionIndex = -1
  const adjacentOrders = getAdjacentOrders(fragment)
  const target = fragments.value.find(frag => {
    directionIndex = adjacentOrders.indexOf(frag.styles.order)
    return frag.empty && directionIndex > -1
  })

  // If found the empty fragment, switch the fragments with animation.
  if (target) {
    await switchFragmentsWithAnim(fragment, target, directionIndex)
  }
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
 * Switch two fragments with animation.
 * @param fragment Fragment to be switched.
 * @param target Target fragment.
 * @param {Number} direction Direction relative to fragment. 0=L, 1=R, 2=T, 3=B.
 */
 const switchFragmentsWithAnim = async (fragment, target, direction) => {
  let translateClass = null

  switch (direction) {
    case 0:
      translateClass = cntl`translate-x-full`
      break
    case 1:
      translateClass = cntl`-translate-x-full`
      break
    case 2:
      translateClass = cntl`translate-y-full`
      break
    case 3:
      translateClass = cntl`-translate-y-full`
      break
    default:
      break
  }

  if (!translateClass) return

  const baseTransitionClass = cntl`transition ease-in-out`

  switchFragments(fragment, target)
  fragment.transitionClasses = cntl`
    ${baseTransitionClass} ${translateClass} duration-0
  `

  await delay(0)
  fragment.transitionClasses = cntl`
    ${baseTransitionClass} translate-x-0 translate-y-0 duration-75
  `
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
    <div class="mx-auto relative shadow-xl" :style="frameSizeStyles">
      <!-- Solved image -->
      <div v-if="solved" :style="{ background: `url(${image})`}"
        class="absolute top-0 left-0 h-full w-full z-50">
      </div>

      <!-- Cover -->
      <div v-if="preparing || shuffling"
        class="absolute top-0 left-0 h-full w-full bg-indigo-900/60 z-40">
      </div>

      <!-- Fragments -->
      <div v-show="imageReady" class="flex flex-wrap bg-indigo-900">
        <Fragment v-for="fragment in fragments" :key="fragment.position"
          :fragment="fragment"
          @click="moveFragment(fragment)" />
      </div>
    </div>
  </div>
</template>