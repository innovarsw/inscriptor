<template>
  <div ref="mainFileDivRow" class="flex items-center">

    <q-icon :name="file.icon ?? 'las la-file-alt'" :color="file.state?.color" class="no-padding no-margin" size="17px" />
    <span class="q-ml-xs" >
      {{ truncate(file.title, 30) }}&nbsp;
      <q-tooltip v-if="file.title.length > 30">
        {{ file.title }}
      </q-tooltip>
    </span>
    <template v-for="(label, index) in file.labels ?? []" :key="index">
      <q-badge :color="label.color + '-3'" rounded class="q-ml-xs">
        <q-icon name="las la-tag" />
        <q-tooltip :delay="500">
          {{ label.label }} label
        </q-tooltip>
      </q-badge>
    </template>

    <template v-if="file.settings?.contextType">
      <q-badge :color="file.settings.contextType.color + '-2'" :text-color="file.settings.contextType.color + '-8'" rounded class="q-ml-xs" style="font-size: 0.7rem;">
        {{ truncate(file.settings?.contextType.label, truncateContextChars) }}
        <q-tooltip :delay="500">
          This file is included in the {{ file.settings.contextType.label }} context.
        </q-tooltip>
      </q-badge>
    </template>
    <q-menu context-menu>
      <FileListRowContextMenu :file="file" />
    </q-menu>
  </div>
</template>

<script setup>
  import {useElementHover} from "@vueuse/core";
  import {computed, ref} from "vue";
  import {truncate} from "src/common/utils/textUtils";
  import FileListRowContextMenu from "components/Common/Files/FileListRowContextMenu.vue";

  const props = defineProps({
    file: {
      type: Object,
      required: false,
    },
  });

  const truncateContextChars = computed(() => {
    return isHovered.value ? 15 : 0;
  })

  const mainFileDivRow = ref(null);
  const isHovered = useElementHover(mainFileDivRow);
</script>

<style scoped>

</style>
