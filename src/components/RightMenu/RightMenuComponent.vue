<template>
  <div class="" id="rightPanel" style="height: calc(100vh - 104px); width: 100%">
    <q-expansion-item
      label="File Details"
      icon="mdi-information-outline"
      v-model="layoutStore.fileDetailsOpen"
      id="fileDetails"
    >
      <q-card v-if="file">
        <q-card-section class="q-pb-sm">
          <div class="row q-gutter-x-sm">
            <div class="col">
              <q-select v-model="fileState" label="State" filled dense :options="promptStore.statuses" option-label="label" option-value="label" clearable options-dense>
                <template v-slot:prepend>
                  <q-icon name="mdi-flag-outline" />
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon name="mdi-flag-outline" :color="scope.opt.color ?? 'black'" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:after-options>
                  <q-separator />
                  <div class="flex full-width justify-center">
                    <q-btn flat dense icon="mdi-playlist-edit" color="grey-6" no-caps label="Edit..." @click="layoutStore.openConfiguration('statuses')" />
                  </div>
                </template>
              </q-select>
            </div>
            <div class="col">
              <q-select v-model="fileLabels" label="Labels" filled dense :options="promptStore.labels" option-label="label" option-value="label" multiple clearable use-chips options-dense>
                <template v-slot:prepend>
                  <q-icon name="mdi-tag-outline" />
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-badge :color="scope.opt.color ?? 'black'" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:after-options>
                  <q-separator />
                  <div class="flex full-width justify-center">
                    <q-btn flat dense icon="mdi-playlist-edit" color="grey-6" no-caps label="Edit..." @click="layoutStore.openConfiguration('labels')" />
                  </div>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
        <q-card-section class="q-py-sm">
          <q-img v-if="file.imageUrl" :src="file.imageUrl" class="full-width" ref="fileImg" style="max-height: 400px;" fit="contain">
            <div class="absolute all-pointer-events q-gutter-y-xs no-padding flex column" style="" v-if="imageHovered">
              <q-btn  flat size="12px" icon="mdi-upload"  @click="uploadImage">
                <q-tooltip>
                  Replace image
                </q-tooltip>
              </q-btn>
              <q-btn flat size="12px" icon="mdi-close" @click="deleteFileImage">
                <q-tooltip>
                  Delete image
                </q-tooltip>
              </q-btn>
            </div>

          </q-img>
          <q-btn v-else flat no-caps :loading="uploadingImage" @click="uploadImage" icon="mdi-image-outline" color="grey-7" label="Add Image" class="full-width" />
        </q-card-section>
        <q-card-section class="q-py-sm">
          <InputWithAi v-model="fileSynopsis" label="Synopsis" type="textarea" :prompt-ids="promptStore.getPredefinedPromptId('Summarize Page')" :prompt-input="file.content" :class="writeClasses" autogrow />
        </q-card-section>
        <q-card-section class="q-py-sm">
          <q-input label="Note" v-model="fileNote" type="textarea" filled :class="layoutStore.darkMode ? 'bg-brown-10' : 'bg-yellow-2'" dense autogrow/>
        </q-card-section>
        <q-card-section class="q-pt-sm">
          <div class="">
            <q-select v-model="contextType" :options="contextTypes" option-label="label" option-value="label" label="Include in Context" filled dense clearable use-chips options-dense>
              <template v-slot:selected-item="scope">
                <q-chip
                  @remove="scope.removeAtIndex(scope.index)"
                  :tabindex="scope.tabindex"
                  :color="scope.opt.color + '-3'"
                  dense
                  class="q-ma-none"
                >
                  {{ scope.opt.label }}
                </q-chip>
              </template>
              <template v-slot:after-options>
                <q-separator />
                <div class="flex full-width justify-center">
                  <q-btn flat dense icon="mdi-playlist-edit" color="grey-6" no-caps label="Edit..." @click="layoutStore.openConfiguration('contextTypes')" />
                </div>
              </template>
            </q-select>
          </div>
        </q-card-section>

      </q-card>
    </q-expansion-item>
    <div class="fit q-my-sm q-pl-sm q-pr-md">

      <div class="fit ai-panel scroll">
        <div class="text-center q-mt-md q-mb-md">
          <q-btn-toggle :options="views" v-model="layoutStore.currentRightMenuView" unelevated no-caps class="bordered inscriptor-highlight-btn" toggle-color="primary" padding="xs md" id="aiSwitch" />
        </div>
        <q-card flat v-if="promptStore.analysisEnabled" class="bg-transparent">

          <q-card-section v-if="promptStore.analysisEnabled && promptStore.selectionAnalysisAvailablePrompts.length === 0">
          <span class="text-warning">
            <q-icon name="mdi-exclamation-thick" />
            No analysis prompts created
          </span>
          </q-card-section>

          <q-card-section v-if="promptStore.analysisEnabled && promptStore.selectionAnalysisAvailablePrompts.length > 0">
            <div class="row">
              <div class="col-auto flex items-center q-pr-md">
                <q-btn @click="promptStore.promptSelectionAnalysisPrompts" icon="mdi-chart-timeline-variant-shimmer" color="accent" label="Analyze" no-caps :loading="promptStore.selectionAnalysisRunning"/>
              </div>
              <div class="col justify-end flex">
                <q-btn :label="promptStore.analysisPromptsSettings.prompts.length + ' prompts active'" flat color="accent"  icon-right="mdi-chevron-down">
                  <q-popup-proxy>
                    <q-card style="width: 600px">

                      <q-list v-if="promptStore.analysisPromptsSettings.prompts" dense class="full-width q-mb-sm">
                        <q-item v-for="(prompt, i) in promptStore.analysisPromptsSettings.prompts" :key="i" dense class="full-width">
                          <q-item-section side>
                            <div class="text-grey-8 q-gutter-xs flex items-center">
                              <q-toggle dense :model-value="prompt.enabled" @update:model-value="(val) => promptStore.updateAnalysisPrompt(prompt, {enabled: val})" color="accent" />
                            </div>
                          </q-item-section>
                          <q-item-section top class="col gt-sm" :class="prompt.enabled ? '' : 'text-grey'">
                            <q-item-label class="q-mt-sm">
                              {{ getPromptNameById(prompt.promptId) }}
                            </q-item-label>
                            <q-item-label caption>
                              {{ getPromptModelName(prompt.promptId).name }}
                            </q-item-label>
                          </q-item-section>
                          <q-item-section side class="flex items-center">
                            <div class="text-grey-8 q-gutter-xs flex items-center">
                              <q-checkbox label="Run on Select" flat dense round :model-value="prompt.runOnSelection" @update:model-value="(val) => promptStore.updateAnalysisPrompt(prompt, {runOnSelection: val})"  >
                                <q-tooltip :delay="500">
                                  Triggers automatically when you select a text
                                </q-tooltip>
                              </q-checkbox>
                              <q-btn flat dense icon="mdi-arrow-up" @click="promptStore.moveAnalysisPrompt(prompt, - 1)"  />
                              <q-btn flat dense icon="mdi-arrow-down" @click="promptStore.moveAnalysisPrompt(prompt, 1)" />
                              <q-btn flat dense icon="mdi-delete" @click="promptStore.removeAnalysisPrompt(prompt)" color="negative" />
                            </div>
                          </q-item-section>
                        </q-item>
                      </q-list>

                      <div v-if="addPromptVisible">
                        <q-select clearable options-dense v-model="addPrompt" label="Add prompt" outlined dense filled :options="availableAnalysisPrompts" @update:model-value="(val) => addAnalysisPrompt(val)"/>
                      </div>
                      <div v-else>
                        <q-btn square flat class="full-width" icon="mdi-plus" @click="addPromptVisible = true" />
                      </div>
                    </q-card>
                  </q-popup-proxy>
                </q-btn>

                <q-linear-progress indeterminate v-if="layoutStore.analysisTriggered" />
              </div>
            </div>
          </q-card-section>

          <q-card-section v-if="promptStore.analysisEnabled && selectionPromptResults?.length > 0">
            <div class="q-gutter-y-sm">
              <div v-for="(promptResult, index) in selectionPromptResults" :key="index">

                <div>
                  <transition
                    appear
                    enter-active-class="animated fadeInDown slower"
                    leave-active-class="animated fadeOut delay-1s"
                  >
                    <PromptResult :promptResult="promptResult"/>

                  </transition>
                </div>


              </div>
            </div>
            <q-btn outline @click="promptStore.promptSelectionAnalysisPrompts" icon="mdi-sync" class="q-mt-md" color="green" size="sm"/>
          </q-card-section>

          <q-card-section v-else-if="promptStore.analysisPromptsSettings.prompts.length > 0 && selectionPromptResults?.length === 0" class="text-center">
            <div class="">Analysis is active using {{ promptStore.analysisPromptsSettings.prompts.length }} prompt(s)</div>
            <div>Click 'Analyze' or press CTRL+space to start.</div>
          </q-card-section>

          <q-card-section v-else-if="promptStore.analysisPromptsSettings.prompts.length === 0" class="text-center">
            <div>You have not selected any analysis prompts, so no analysis will be performed.</div>
          </q-card-section>

        </q-card>
        <PromptsTab v-if="layoutStore.currentRightMenuView === 'prompts'"/>
        <AgentChatTab v-if="layoutStore.currentRightMenuView === 'agentChat'"/>
      </div>


    </div>

  </div>
</template>

<script setup>
  import {usePromptStore} from "stores/prompt-store";
  import {computed, ref, watch} from "vue";
  import PromptResult from "components/RightMenu/PromptResult.vue";
  import {useFileStore} from "stores/file-store";
  import PromptsTab from "components/RightMenu/PromptsTab.vue";
  import {useLayoutStore} from "stores/layout-store";
  import InputWithAi from "components/Common/InputWithAi.vue";
  import { open } from '@tauri-apps/plugin-dialog';
  import {readFile} from "@tauri-apps/plugin-fs";
  import {uploadImageRaw} from "src/common/apiServices/imageGenService";
  import {useCurrentUser} from "vuefire";
  import {uint8ArrayToBase64} from "src/common/utils/textUtils";
  import {useElementHover} from "@vueuse/core";
  import {chatTabId, promptTabId, agentChatTabId} from 'src/common/resources/tabs';
  import AgentChatTab from 'components/RightMenu/AgentChatTab.vue';

  const promptStore = usePromptStore();
  const fileStore = useFileStore();
  const layoutStore = useLayoutStore();
  const tabs = computed(() => promptStore.tabs);

  const uploadingImage = ref(false);
  const fileImg = ref(null);

  const addPromptVisible = ref(false);
  const addPrompt = ref(null);

  const imageHovered = useElementHover(fileImg);

  const currentTab = computed({
    get: () => promptStore.currentTab?.id ?? tabs.value[0].id,
    set: (value) => {
      promptStore.setCurrentTabId(value);
    }
  })

  const views = [
    {label: 'Prompts', value: 'prompts', icon: 'mdi-creation-outline'},
    {label: 'Chat', value: 'agentChat', icon: 'mdi-robot'},
    {label: 'Analysis', value: 'analysis', icon: 'mdi-chart-timeline-variant-shimmer'},
  ];

  watch(() => layoutStore.currentRightMenuView, (newValue) => {
    if(newValue === 'prompts') {
      promptStore.analysisEnabled = false;
      currentTab.value = promptTabId;
    } else if(newValue === 'analysis') {
      promptStore.analysisEnabled = true;
    } else if(newValue === 'chat') {
      promptStore.analysisEnabled = false;
      currentTab.value = chatTabId;
    } else if(newValue === 'agentChat') {
      promptStore.analysisEnabled = false;
      currentTab.value = agentChatTabId;
    }
  });

  //watch(currentTab, (newValue) => {
  //  promptStore.setCurrentTabId(newValue);
  //});

  const file = computed(() => fileStore.selectedFile);

  const contextTypes = computed(() => promptStore.contextTypes);
  const contextType = computed({
    get: () => file.value?.settings?.contextType ?? null,
    set: (value) => fileStore.updateFileSettings(file.value, {contextType: value}),
  });

  const availableAnalysisPrompts = computed(() => [...promptStore.selectionAnalysisPrompts, ...promptStore.selectionPrompts]
    .map(p => {
      const promptModel = promptStore.getModel(p.modelId);

      return {
        label: p.title + ' (' + promptModel?.name + ')',
        value: p.id,
      };
    }).sort((a, b) => a.label.localeCompare(b.label))
  );

  function addAnalysisPrompt(prompt) {
    addPrompt.value = null;

    promptStore.addAnalysisPrompt(prompt);
  }

  function updateAnalysisPrompt(prompt, args) {
    if(!prompt || !args) return;

    if(args.enabled !== undefined) {

    }
  }

  const fileSynopsis = computed({
    get: () => file.value?.synopsis ?? '',
    set: (value) => {
      if(file.value) {
        file.value.synopsis = value;
        fileStore.setDirty(file.value);
      }
    }
  });

  const fileNote = computed({
    get: () => file.value?.note ?? '',
    set: (value) => {
      if(file.value) {
        file.value.note = value;
        fileStore.setDirty(file.value);
      }
    }
  });

  const fileState = computed({
    get: () => file.value?.state ?? '',
    set: (value) => {
      if(file.value) {
        file.value.state = value;
        fileStore.setDirty(file.value);
      }
    }
  });

  const fileLabels = computed({
    get: () => file.value?.labels ?? [],
    set: (value) => {
      if(file.value) {
        file.value.labels = value;
        fileStore.setDirty(file.value);
      }
    }
  });

  const selectionPromptResults = computed(() => {
    return promptStore.selectionPromptResults ?? [];
  });

  const writeClasses = computed(() => {
    return {
      'write-serif': (fileStore.selectedFile?.settings?.fontType ?? 'serif') === 'serif',
      'write-sans-serif': fileStore.selectedFile?.settings?.fontType === 'sans-serif',
      'write-monospace': fileStore.selectedFile?.settings?.fontType === 'monospace',
    }
  });

  function deleteFileImage() {
    fileStore.setFileImage(file.value, null);
  }

  async function uploadImage() {
    const user = useCurrentUser();
    const idToken = await user.value.getIdToken();

    if(layoutStore.runsInDesktopApp()) {
      const filePath = await open({ multiple: false, directory: false });
      if (!filePath) {
        return;
      }
      try {
        uploadingImage.value = true;

        const binaryData = await readFile(filePath);
        const base64 = uint8ArrayToBase64(binaryData);

        const imageUrl = await uploadImageRaw(idToken, base64, useCurrentUser().value.uid);

        if(imageUrl) {
          fileStore.setFileImage(file.value, imageUrl);
        }

      } finally {
        uploadingImage.value = false;
      }


    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const f = e.target.files[0];
        if (!f) {
          return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            uploadingImage.value = true;

            // The result is a data URL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
            const dataUrl = ev.target.result;

            // Extract only the Base64 part (after the comma)
            const base64 = dataUrl.split(',')[1];

            const imageUrl = await uploadImageRaw(idToken, base64, useCurrentUser().value.uid);

            if(imageUrl) {
              fileStore.setFileImage(file.value, imageUrl);
            }
          } catch (error) {
            console.error("Failed to upload file:", error);
          } finally {
            uploadingImage.value = false;
          }
        };
        reader.readAsDataURL(f);
      };
      input.click();
    }
  }

  function getPromptNameById(promptId) {
    return promptStore.getPromptById(promptId)?.title;
  }

  function getPromptModelName(promptId) {
    const prompt = promptStore.getPromptById(promptId);
    if(prompt) {
      return promptStore.getModel(prompt.modelId);
    }

    return "";
  }

</script>

<style scoped>

.hover-image {
  transition: all 0.2s;
}

.hover-image:hover {
  filter: brightness(0.6);
}

</style>
