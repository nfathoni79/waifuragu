<script setup>
import { ref } from 'vue'
import loadImage from 'blueimp-load-image'

import Board from './components/Board.vue'
import AButton from './components/AButton.vue'
import Spinner from './components/Spinner.vue'

import WaifuService from './services/WaifuService'

const image = ref(null)
const board = ref(null)

const loading = ref(false)
const playing = ref(false)

/**
 * Trigger start in Board component.
 * @param args Image URL and dimension. 
 */
const start = (args) => {
  playing.value = true
  board.value.start(args)
}

/**
 * Shuffle fragments in Board component.
 */
const shuffleFragments = () => board.value.shuffleFragments()

/**
 * Get Waifu image URL.
 */
const getWaifu = () => {
  loading.value = true

  WaifuService.getWaifu().then(res => {
    const url = `https:/anime.sahabatgemarikan.id/cors/${res.data.url}`

    const container = document.querySelector('#container')
    const maxWidth = container.offsetWidth * 0.9
    const maxHeight = container.offsetHeight * 0.7

    const loadImageOptions = {
      // maxWidth: 300,
      // maxHeight: 300,
      // minWidth: 100,
      // minHeight: 100,
      maxWidth,
      maxHeight,
      canvas: true,
    }
    
    // Get image as blob
    fetch(url).then(res => res.blob()).then(blob => {
      loadImage(blob, img => {
        image.value = img.toDataURL()

        start({
          image: image.value,
          dimens: { x: 3, y: 3},
        })
      }, loadImageOptions)
    }).catch(err => {
      alert(err)
    }).finally(() => {
      loading.value = false
    })
  }).catch(err => {
    loading.value = false
    alert(err)
  })
}

/**
 * Get current year for footer.
 */
const getCurrentYear = () => {
  return new Date().getFullYear()
}
</script>

<template>
  <div id="container" class="mx-auto max-w-4xl min-h-screen p-4">
    <header>
      <div class="text-center">
        <h1 class="text-4xl font-semibold">
          Wai<span class="bg-indigo-500 px-1 text-indigo-50">Fu</span>ragu
        </h1>
        <p class="mt-2">Defragment your fragmented Waifu</p>
      </div>
    </header>

    <div class="my-4">
      <div v-show="playing">
        <Board ref="board" />

        <div class="mt-4 flex justify-center gap-2">
          <AButton color="red" @click="shuffleFragments">Re-fragment</AButton>
          <AButton @click="getWaifu" :disabled="loading">
            <Spinner v-if="loading" class="mr-2 w-6"/>
            Get another Waifu
          </AButton>
        </div>
      </div>

      <div v-show="!playing" class="flex items-center justify-center h-32">
        <AButton @click="getWaifu" :disabled="loading">
          <Spinner v-if="loading" class="mr-2 w-6"/>
          Get a Waifu
        </AButton>
      </div>
    </div>

    <footer>
      <p class="text-center text-gray-800">
        {{ `&copy; ${getCurrentYear()} by ` }}
        <a href="https://github.com/nfathoni79" target="_blank"
          class="hover:text-indigo-600 hover:underline">
          NN
        </a>
      </p>
    </footer>
  </div>
</template>
