<template>
  <div class="q-py-sm column">
    <div class="text-primary text-subtitle2 q-px-sm q-pb-sm">
      <q-btn flat dense class="q-ml-xs full-width" no-caps @click="layoutStore.projectSelectionDialogOpen = true" v-if="fileStore.projectId">
        <div class="row full-width">
          <div class="col-auto q-ml-xs">
            <template v-if="fileStore.projectSettings?.syncToCloud">
              <q-spinner v-if="layoutStore.projectSyncIndicator" class="absolute" />
              <q-icon v-else name="mdi-folder-outline" class="absolute" />
            </template>
            <template v-else>
              <q-icon name="mdi-folder-outline" class="absolute" />
            </template>

          </div>
          <div class="col">
            {{ currentProjectName ?? "(unknown project)" }}
          </div>
          <div class="col-auto">
            <q-btn flat dense @click.prevent="editProjectMetadata" icon="mdi-dots-vertical" padding="none none" size="12px"/>
          </div>
        </div>
      </q-btn>
    </div>

    <q-separator />

    <div class="col-auto q-mt-sm scroll-y" id="files" style="max-height: calc(100vh - 225px);">
      <FileList />
    </div>
    <div class="col-auto flex justify-center q-mt-md ">
      <q-btn dense unelevated icon="add" color="primary" flat @click="add" v-if="fileTemplates.length === 0" class="full-width">
      </q-btn>
      <q-btn-dropdown v-else dense unelevated icon="mdi-plus" @click="add" split>
        <q-list>
          <q-item clickable v-close-popup @click="addTemplate(file)" v-for="file in fileTemplates" :key="file.id">
            <q-item-section>
              <q-item-label>{{ file.title }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon :name="file.icon" />
            </q-item-section>
          </q-item>
        </q-list>

      </q-btn-dropdown>
    </div>
    <q-separator class="q-mb-xl"/>
    <div class="q-mb-lg" />
  </div>
</template>

<script setup>

import FileList from "components/Common/Files/FileList.vue";
import {useFileStore} from "stores/file-store";
import {useLayoutStore} from "stores/layout-store";
import {usePromptStore} from "stores/prompt-store";
import {computed} from "vue";

const fileStore = useFileStore();
const layoutStore = useLayoutStore();
const promptStore = usePromptStore();

const currentProjectName = computed(() => fileStore.projectName);

async function add() {
  const file = await fileStore.addFile('New');
  if(file) {
    fileStore.selectFile(file, true);
  }
}

async function addTemplate(template) {
  const file = await fileStore.addFile(template.title, null, template);
  if(file) {
    fileStore.selectFile(file, true);
  }
}

function editProjectMetadata() {
  layoutStore.editProjectMetadataOpen = true;
}

const fileTemplates = computed(() => promptStore.fileTemplates);

</script>

<style scoped>

</style>
