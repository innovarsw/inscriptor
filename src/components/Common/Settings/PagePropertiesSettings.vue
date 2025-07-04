<template>
  <q-card flat>
    <q-card-section class="q-gutter-y-sm no-padding">
      <div class="bordered">
        <q-expansion-item label="Prompts" caption="Predefine prompts for quick summarization, description generation, etc" v-model="layoutStore.settingsPredefinedPromptsOpened">
          <div class="q-py-sm q-gutter-y-md q-px-md">
            <div v-for="predefinedPrompt in promptStore.predefinedPrompts" :key="predefinedPrompt.promptType">
              <div class="q-mt-lg text-subtitle2">{{ predefinedPrompt.promptType }}</div>
              <PromptSelectMultiple :prompt-type="predefinedPrompt.promptType" :hint="predefinedPrompt.promptHint" />
            </div>

            <div class="q-py-sm">
              <div class="q-mt-lg text-subtitle2">Default Custom Prompt Instructions</div>
              <q-input v-model="promptStore.defaultCustomPromptInstructions" filled dense label="Instructions" type="textarea" :rows="3" :autogrow="true" hint="The default prefixed instructions for quick custom prompts." />
            </div>
          </div>
        </q-expansion-item>
      </div>


      <div class="bordered">
        <q-expansion-item label="Labels" caption="Define labels that can be given to files." v-model="layoutStore.settingsLabelsOpened">
          <div class="q-pa-sm">
            <ValuesEdit :list="promptStore.labels" new-item-name="New Label" />
          </div>
        </q-expansion-item>
      </div>
      <div class="bordered">
        <q-expansion-item label="Statuses" caption="Define statuses that can be given to files." v-model="layoutStore.settingsStatusesOpened">
          <div class="q-pa-sm">
            <ValuesEdit :list="promptStore.statuses" new-item-name="New Label" />
          </div>
        </q-expansion-item>
      </div>

      <div class="bordered">
        <q-expansion-item label="Context Types" caption="Define types of contexts for AI prompts." v-model="layoutStore.settingsContextTypesOpened">
          <div class="q-pa-sm">
            <ValuesEdit :list="promptStore.contextTypes" new-item-name="Context" />
          </div>
        </q-expansion-item>
      </div>

      <div class="bordered">
        <q-expansion-item label="Prompt Categories" caption="You can group AI prompts into tabs." v-model="layoutStore.settingsPromptCategoriesOpened">
          <div class="q-pa-sm">
            <ValuesEdit :list="promptStore.promptCategories" new-item-name="New Category" include-description />
          </div>
        </q-expansion-item>
      </div>

      <div class="bordered">
        <q-expansion-item label="Prompt Folders" caption="You can group AI prompts into folders, inside tabs." v-model="layoutStore.settingsPromptFoldersOpened">
          <div class="q-pa-sm">
            <ValuesEdit :list="promptStore.promptFolders" new-item-name="New Folder" />
          </div>
        </q-expansion-item>
      </div>

      <div class="bordered">
        <q-expansion-item label="File Templates" caption="Defined templates for new files." v-model="layoutStore.settingsFileTemplatesOpened">
          <div class="q-py-sm q-px-md">
            <q-list dense bordered v-if="promptStore.fileTemplates.length > 0">
              <q-item v-for="(template) in promptStore.fileTemplates" :key="template.id">
                <q-item-section side>
                  <q-icon :name="template.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    {{ template.title }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn icon="mdi-delete-outline" flat color="negative" @click="promptStore.removeFileTemplate(template)" />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="text-caption" v-else>
              <div>You have no file templates set.</div>
              <div>You can create them by opening a file and choosing "Create template from this file".</div>
            </div>

          </div>
        </q-expansion-item>
      </div>

      <div class="bordered">
        <q-expansion-item label="Default File Settings" caption="Default settings applied to all new files." v-model="layoutStore.settingsDefaultFileSettingsOpened">
          <div class="q-pa-md">
            <FileSettings :file="promptStore.defaultFileTemplate" />
          </div>
        </q-expansion-item>
      </div>
    </q-card-section>
  </q-card>

</template>

<script setup>

import FileSettings from "components/Common/Settings/FileSettings.vue";
import {usePromptStore} from "stores/prompt-store";
import ValuesEdit from "components/Common/ValuesEdit.vue";
import PromptSelectMultiple from "components/Common/PredefinedPromptSelect.vue";
import {useLayoutStore} from "stores/layout-store";

const promptStore = usePromptStore();
const layoutStore = useLayoutStore();


</script>

<style scoped>

</style>


