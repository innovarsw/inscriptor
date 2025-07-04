<template>
  <router-view />
</template>

<script setup>

import {onMounted} from "vue";
import {useFileStore} from "stores/file-store";
import {useLayoutStore} from "stores/layout-store";
import {useQuasar} from "quasar";

const fileStore = useFileStore();
const layoutStore = useLayoutStore();
const $q = useQuasar();

onMounted(async () => {
  // Initialize theme on app startup
  layoutStore.initializeDarkMode($q);
});
</script>
