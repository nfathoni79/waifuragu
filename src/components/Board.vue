<script setup>
import { ref, computed } from 'vue'
import { sample } from 'lodash'
import cntl from 'cntl'
import Fragment from './Fragment.vue'

const image = ref(null)
const dimens = ref({ x: 0, y: 0 })
const fragments = ref([])
const fragmentSize = ref({ width: 0, height: 0 })
const orderPositionMaps = ref([])

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
  orderPositionMaps.value = []

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
      adjacentOrders: [
        i % dimens.value.x ? i - 1 : null,
        (i + 1) % dimens.value.x ? i + 1 : null,
        (i - dimens.value.x) >= 0 ? i - dimens.value.x : null,
        (i + dimens.value.x) < totalFragments.value ? i + dimens.value.x : null,
      ],
    })

    orderPositionMaps.value.push(i)
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
      return emptyFragment.adjacentOrders.indexOf(frag.styles.order) > -1
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

  // Find the empty fragment order from the clicked fragment's adjacent orders
  const targetOrder = fragment.adjacentOrders.find(order => {
    return orderPositionMaps.value[order] === totalFragments.value - 1
  })

  // If found the empty fragment order, switch the fragments with animation.
  if (targetOrder > -1) {
    const directionIndex = fragment.adjacentOrders.indexOf(targetOrder)
    await switchFragmentsWithAnim(fragment, fragments.value[orderPositionMaps.value[targetOrder]], directionIndex)
  }
}

/**
 * Switch two fragments.
 * @param frag1 Fragment 1. 
 * @param frag2 Fragment 2.
 */
const switchFragments = (frag1, frag2) => {
  [
    orderPositionMaps.value[frag1.styles.order],
    orderPositionMaps.value[frag2.styles.order],
    frag1.styles.order,
    frag2.styles.order,
    frag1.adjacentOrders,
    frag2.adjacentOrders
  ] = [
    orderPositionMaps.value[frag2.styles.order],
    orderPositionMaps.value[frag1.styles.order],
    frag2.styles.order,
    frag1.styles.order,
    frag2.adjacentOrders,
    frag1.adjacentOrders
  ]
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