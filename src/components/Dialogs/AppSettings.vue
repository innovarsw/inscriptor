<template>
  <q-dialog v-model="appSettingsOpened" full-height>
    <q-card style="min-width: 90vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">Project Settings</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <AppSettingsContent />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {computed, ref} from "vue";
  import AppSettingsContent from "components/Common/Settings/PromptsSettings.vue";

  const layoutStore = useLayoutStore();
  const tab = ref('ai');

  const appSettingsOpened = computed({
    get() {
      return layoutStore.settingsOpen;
    },
    set(newValue) {
      layoutStore.setSettingsOpen(newValue);
    }
  });
</script>


<style scoped>

</style>
