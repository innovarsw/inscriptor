<template>
  <div class="row">
    <div v-for="child in file.children ?? []" :key="child.id" class="q-mb-lg" :class="mainCols">

      <div :class="mainCols === 'col-12' ? '' : ''">
        <div class="text-h6 row cursor-pointer full-width" @click="fileStore.selectFile(child, false)" style="">
          <div class="col">
            <FileDetailItem :file="child" :hide-context-type="true" />
          </div>
          <div class="col-auto">
            <span class="q-mr-md text-grey-6 text-caption">
              {{ fileStore.getTextWords(child, true, true)}}
            </span>
          </div>
          <div class="col-auto">
            <q-btn icon="mdi-dots-horizontal" color="grey" flat dense padding="xs" size="0.7rem" @click.stop class="">
              <q-menu>
                <FileListRowContextMenu :file="child"/>
              </q-menu>
            </q-btn>
          </div>
        </div>

        <div class="row q-mt-xs">
          <div class="col-auto full-width">
            <InputWithAi v-model="child.synopsis" label="Synopsis" type="textarea" :prompt-ids="promptStore.getPredefinedPromptId('Summarize Page')" :prompt-input="child.content" :class="writeClasses" @update:model-value="() => fileStore.setDirty(child)" :automatic-text-correction="automaticTextCorrection" autogrow/>
          </div>
        </div>

        <div class="row q-gutter-x-md q-gutter-y-md q-mt-xs q-pb-xs" v-if="viwSecondLevel">
          <template v-for="nestedChild in child.children ?? []" :key="nestedChild.id">
            <q-card class="col-grow gradient-variation-2 inscriptor-shadow-1" style="min-width: 380px; max-width: 600px;">
              <q-card-section class="cursor-pointer q-pa-sm" @click="fileStore.selectFile(nestedChild, false)">
                <q-item-label class="row items-center">
                  <div class="col text-subtitle1">
                    <FileDetailItem :file="nestedChild" :hide-context-type="true" />
                  </div>
                  <div class="col-auto">
                  <span class="q-mr-md text-grey-6 text-caption">
                    {{ fileStore.getTextWords(nestedChild, true, true)}}
                  </span>
                  </div>
                  <div class="col-auto">
                    <q-btn icon="mdi-dots-horizontal" color="grey" flat dense padding="xs" size="0.7rem" @click.stop class="">
                      <q-menu>
                        <FileListRowContextMenu :file="nestedChild"/>
                      </q-menu>
                    </q-btn>
                  </div>
                </q-item-label>
              </q-card-section>
              <q-card-section class="q-pa-sm">

                <InputWithAi v-model="nestedChild.synopsis" borderless :filled="false" :label="nestedChild.synopsis ? undefined : ('Enter ' + nestedChild.title + ' synopsis')" type="textarea" :prompt-ids="promptStore.getPredefinedPromptId('Summarize Page')" class="q-px-sm" :prompt-input="nestedChild.content" :class="writeClasses" @update:model-value="() => fileStore.setDirty(nestedChild)" :automatic-text-correction="automaticTextCorrection"  autogrow/>

                <template v-if="viewThirdLevel">
                  <template v-for="nestedNestedChild in nestedChild.children ?? []" :key="nestedNestedChild.id">
                    <q-card flat class="file-grid-nested">
                      <q-card-section class="text-subtitle2 q-mt-md q-pa-sm" >

                        <div class="row items-center cursor-pointer">
                          <div class="col" @click="fileStore.selectFile(nestedNestedChild, false)">
                            <FileDetailItem :file="nestedNestedChild" :hide-context-type="true" />
                          </div>
                          <div class="col-auto">
                          <span class="q-mr-md text-grey-6 text-caption">
                            {{ fileStore.getTextWords(nestedNestedChild, true, true)}}
                          </span>
                          </div>
                          <div class="col-auto">
                            <q-btn icon="mdi-dots-horizontal" color="grey" flat dense padding="xs" size="0.7rem" @click.stop class="float-right">
                              <q-menu>
                                <FileListRowContextMenu :file="nestedNestedChild"/>
                              </q-menu>
                            </q-btn>
                          </div>
                        </div>

                        <div class="row full-width">
                          <div class="col">
                            <InputWithAi v-model="nestedNestedChild.synopsis" borderless :filled="false" :label="nestedNestedChild.synopsis ? undefined : ('Enter ' + nestedNestedChild.title + ' synopsis')" type="textarea" :prompt-ids="promptStore.getPredefinedPromptId('Summarize Page')" class="q-px-sm" :prompt-input="nestedNestedChild.content" :class="writeClasses" @update:model-value="() => fileStore.setDirty(nestedNestedChild)" :automatic-text-correction="automaticTextCorrection"  autogrow/>
                          </div>
                        </div>

                      </q-card-section>
                    </q-card>

                  </template>
                </template>

              </q-card-section>
              <q-card-actions v-if="viewThirdLevel">
                <q-btn dense unelevated icon="add" color="primary" flat class="full-width text-grey-6 text-weight-regular" @click="fileStore.addFile('New', nestedChild, null)" :label="'Create in ' + nestedChild.title" no-caps />
              </q-card-actions>
            </q-card>
          </template>
        </div>

        <div class="row">
          <div class="col-auto full-width">
            <q-btn dense unelevated icon="add" color="primary" flat class="full-width q-mt-sm text-grey-6 text-weight-regular" @click="fileStore.addFile('New', child, null)" :label="'Create in ' + child.title" no-caps />
          </div>
        </div>
      </div>



    </div>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
  import {useFileStore} from "stores/file-store";
  import FileListRowContextMenu from "components/Common/Files/FileListRowContextMenu.vue";
  import FileDetailItem from "components/Common/Files/FileDetailItem.vue";
  import InputWithAi from "components/Common/InputWithAi.vue";
  import {usePromptStore} from "stores/prompt-store";

  const fileStore = useFileStore();
  const promptStore = usePromptStore();

  const props = defineProps({
    file: {
      type: Object,
      required: false,
    },
    level: {
      type: Number,
      default: 0,
    },
    viewThirdLevel: {
      type: Boolean,
      default: false,
    },
    viwSecondLevel: {
      type: Boolean,
      default: false,
    },
    mainCols: {
      type: String,
      default: 'col-12',
    },
    automaticTextCorrection: {
      type: Boolean,
      default: true,
    },
  });

  const expanded = ref([]);

  const writeClasses = computed(() => {
    return {
      'write-serif': (fileStore.selectedFile?.settings?.fontType ?? 'serif') === 'serif',
      'write-sans-serif': fileStore.selectedFile?.settings?.fontType === 'sans-serif',
      'write-monospace': fileStore.selectedFile?.settings?.fontType === 'monospace',
    }
  });

</script>

<style scoped>

</style>
