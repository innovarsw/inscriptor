<template>
  <span class="animated-dots" :style="{ width: fixedWidth }">
    {{ currentDots }}
  </span>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  fixedWidth: {
    type: String,
    default: '30px'
  },
  speed: {
    type: Number,
    default: 500
  }
})

const currentDots = ref('')
const intervalId = ref(null)
const dotCount = ref(0)

const updateDots = () => {
  currentDots.value = '.'.repeat(dotCount.value)
  dotCount.value = (dotCount.value + 1) % 4 // Cycle through 0, 1, 2, 3 dots
}

onMounted(() => {
  updateDots()
  intervalId.value = setInterval(updateDots, props.speed)
})

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})
</script>

<style scoped>
.animated-dots {
  display: inline-block;
  text-align: left;
}
</style>