<template>
  <div class="items scrollable-file-mentions file-mention-items">
    <q-list v-if="items && items.length" dense>
      <q-item
        clickable
        :class="{ 'is-selected': index === selectedIndex }"
        :focused="index === selectedIndex"
        v-for="(item, index) in items"
        :key="index"
        @click="selectItem(index)"
      >
        <q-item-section>{{ item.title }}</q-item-section>
      </q-item>
    </q-list>
    <div class="item" v-else>
      No result
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  command: {
    type: Function,
    required: true
  }
})

const selectedIndex = ref(0)

watch(
  () => props.items,
  () => {
    selectedIndex.value = 0
  }
)

function selectItem(index) {
  const item = props.items[index]
  if (item) {
    props.command({ id: item })
  }
}
</script>

<style scoped lang="scss">
.items {
  padding: 0.2rem;
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  font-size: 0.9rem;
}

.scrollable-file-mentions {
  max-height: 400px;
  overflow-y: auto;
}
</style>
