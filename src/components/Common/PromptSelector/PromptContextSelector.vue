<template>
  <q-select v-if="promptStore.promptContextNames" v-model="promptStore.promptContextNames" :options="contextTypes" option-label="label" option-value="label" label="Contexts to include in the prompt" filled multiple use-chips clearable>
    <template v-slot:selected-item="scope">
      <q-chip
        removable
        dense
        @remove="scope.removeAtIndex(scope.index)"
        :tabindex="scope.tabindex"
        :color="scope.opt.color + '-3'"
        class="q-my-xs q-mx-xs"
      >
        {{ scope.opt.label }}
      </q-chip>
    </template>
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps" class="">
        <q-item-section avatar>
          <q-badge v-if="scope.opt.description">text</q-badge>
          <q-badge v-else>context</q-badge>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
          <q-item-label caption v-if="scope.opt.description?.length > 0 ?? false">{{ scope.opt.description }}</q-item-label>
          <q-item-label caption v-else>Context stored in files</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>

  <div class="bordered rounded-borders q-mt-sm" flat>
    <div class="cursor-pointer context-selector q-px-md q-py-md">
      <div class="row">
        <div class="col text-subtitle2 flex items-center"><q-icon name="mdi-book-outline" class="q-mr-xs" />Context</div>
        <div class="col-auto"><q-icon name="keyboard_arrow_down" size="sm" /></div>
      </div>

      <template v-if="promptStore.promptContext?.length > 0 ?? false">
        <template v-for="context in promptStore.promptContext" :key="context.id">
          <q-chip :color="context.color + '-3'" removable @remove="removeContext(context)">
            {{ context.label }}
            &nbsp;<q-badge :color="contextWarning(context).color" v-if="contextWarning(context)">
            <q-icon name="error" />&nbsp;
            {{ contextWarning(context).warning }}
          </q-badge>
            <q-tooltip color="primary" :delay="500">
              {{ context.description }}
            </q-tooltip>
          </q-chip>
        </template>
      </template>
      <template v-else>
        <div>
          No additional context selected
          <q-tooltip :delay="500">
            Use context to provide additional information to the prompt.
          </q-tooltip>
        </div>
      </template>

      <q-popup-proxy >
        <q-card style="width: 668px">
          <q-card-section class="no-padding">
            <div class="row">
              <div class="col-3 q-py-md q-px-xs bg-grey-1">
                <div class="row">
                  <div class="col flex justify-center">
                    <q-btn dense flat color="primary" icon="mdi-content-save-outline" label="Save Context" size="13px" @click="saveCurrentContext()" />
                  </div>
                </div>

                <template v-if="promptStore.savedPromptContexts.length > 0">
                  <q-separator class="q-my-md" />
                  <q-list dense class="scroll-y" style="max-height: 450px">
                    <div v-for="savedContext in promptStore.savedPromptContexts" :key="savedContext.name" class="row full-width q-mb-sm bordered q-pl-sm">
                      <div class="col flex justify-start items-center">
                        <div class="cursor-pointer text-weight-regular text-grey-9 full-width" @click="restoreSavedContext(savedContext)">
                          {{truncate(savedContext.name, 25)}}
                          <q-tooltip :delay="500">
                            <div>{{ savedContext.name }}</div>
                          </q-tooltip>
                        </div>
                      </div>
                      <div class="col-auto flex items-center">
                        <q-btn dense flat icon="mdi-delete-outline" color="negative" @click="deleteSavedContext(savedContext)"></q-btn>
                      </div>
                    </div>
                  </q-list>
                </template>

              </div>
              <q-separator vertical />
              <div class="col q-pa-md">
                <div class="row">
                  <div class="col-auto">
                    <q-chip :text-color="getContextChipFontColor(currentFilePromptContext)" :color="getContextChipColor(currentFilePromptContext)" :icon="getContextChipIcon(currentFilePromptContext)" :clickable="isContextAllowedForThisPrompt(currentFilePromptContext)" @click="toggleContext(currentFilePromptContext)" >
                      {{ currentFilePromptContext.label }} &nbsp;
                      <q-tooltip color="primary"  :delay="500">
                        <div>include all text from {{ currentFile?.title }}</div>
                        <div>
                          <q-badge :color="contextWarning(currentFilePromptContext).color" v-if="contextWarning(currentFilePromptContext)">
                            {{ contextWarning(currentFilePromptContext).warning }}
                          </q-badge>
                        </div>
                      </q-tooltip>
                    </q-chip>
                  </div>
                  <div class="col-auto">
                    <q-chip :text-color="getContextChipFontColor(currentFileSummaryPromptContext)" :color="getContextChipColor(currentFileSummaryPromptContext)" :icon="getContextChipIcon(currentFileSummaryPromptContext)" :clickable="isContextAllowedForThisPrompt(currentFileSummaryPromptContext)" @click="toggleContext(currentFileSummaryPromptContext)" >
                      {{ currentFileSummaryPromptContext.label }} &nbsp;
                      <q-tooltip color="primary"  :delay="500">
                        <div>summary of file {{ currentFile?.title }}</div>
                        <div>
                          <q-badge :color="contextWarning(currentFileSummaryPromptContext).color" v-if="contextWarning(currentFileSummaryPromptContext)">
                            {{ contextWarning(currentFileSummaryPromptContext).warning }}
                          </q-badge>
                        </div>
                      </q-tooltip>
                    </q-chip>

                  </div>
                </div>
                <div class="row">
                  <div class="col-auto">
                    <q-chip :text-color="getContextChipFontColor(currentAndChildrenFilePromptContext)" :color="getContextChipColor(currentAndChildrenFilePromptContext)" :icon="getContextChipIcon(currentAndChildrenFilePromptContext)" :clickable="isContextAllowedForThisPrompt(currentAndChildrenFilePromptContext)" @click="toggleContext(currentAndChildrenFilePromptContext)" >
                      {{ currentAndChildrenFilePromptContext.label }} &nbsp;
                      <q-tooltip color="primary" :delay="500">
                        <div>include all text from {{ currentFile?.title }} and its children</div>
                        <div>
                          <q-badge :color="contextWarning(currentAndChildrenFilePromptContext).color" v-if="contextWarning(currentAndChildrenFilePromptContext)">
                            {{ contextWarning(currentAndChildrenFilePromptContext).warning }}
                          </q-badge>
                        </div>
                      </q-tooltip>
                    </q-chip>
                  </div>
                  <div class="col-auto">
                    <q-chip :text-color="getContextChipFontColor(currentAndChildrenFileSummaryPromptContext)" :color="getContextChipColor(currentAndChildrenFileSummaryPromptContext)" :icon="getContextChipIcon(currentAndChildrenFileSummaryPromptContext)" :clickable="isContextAllowedForThisPrompt(currentAndChildrenFileSummaryPromptContext)" @click="toggleContext(currentAndChildrenFileSummaryPromptContext)" >
                      {{ currentAndChildrenFileSummaryPromptContext.label }} &nbsp;
                      <q-tooltip color="primary" :delay="500">
                        <div>include summary of {{ currentFile?.title }} and its children</div>
                        <div>
                          <q-badge :color="contextWarning(currentAndChildrenFileSummaryPromptContext).color" v-if="contextWarning(currentAndChildrenFileSummaryPromptContext)">
                            {{ contextWarning(currentAndChildrenFileSummaryPromptContext).warning }}
                          </q-badge>
                        </div>
                      </q-tooltip>
                    </q-chip>
                  </div>
                </div>
                <div class="row">
                  <div class="col-auto">
                    <q-chip :text-color="getContextChipFontColor(selectedTextPromptContext)" :color="getContextChipColor(selectedTextPromptContext)" :icon="getContextChipIcon(selectedTextPromptContext)" :clickable="isContextAllowedForThisPrompt(selectedTextPromptContext)" @click="toggleContext(selectedTextPromptContext)" >
                      {{ selectedTextPromptContext.label }} &nbsp;
                      <q-tooltip color="primary" :delay="500" >
                        <div>include mouse selected text</div>
                        <div>
                          <q-badge :color="contextWarning(selectedTextPromptContext).color" v-if="contextWarning(selectedTextPromptContext)">
                            {{ contextWarning(selectedTextPromptContext).warning }}
                          </q-badge>
                        </div>
                      </q-tooltip>
                    </q-chip>
                  </div>
                  <div class="col-auto flex items-center q-mx-md"></div>
                  <div class="col-auto">
                    <q-chip :text-color="getContextChipFontColor(previousCharactersPromptContext)" :color="getContextChipColor(previousCharactersPromptContext)" :icon="getContextChipIcon(previousCharactersPromptContext)" :clickable="isContextAllowedForThisPrompt(previousCharactersPromptContext)" @click="toggleContext(previousCharactersPromptContext)" >
                      {{ previousCharactersPromptContext.label }} &nbsp;

                      <q-btn
                        padding="none"
                        flat
                        icon="more_horiz"
                        @click.stop
                      >
                        <q-menu>
                          <q-list style="min-width: 100px" dense>
                            <q-item clickable v-close-popup @click="toggleContext(previousCharactersPromptContext, 3000)">
                              <q-item-section side><q-icon name="mdi-plus" /></q-item-section>
                              <q-item-section>Previous 3000 Characters</q-item-section>
                            </q-item>
                            <q-item clickable v-close-popup @click="toggleContext(previousCharactersPromptContext, 2000)">
                              <q-item-section side><q-icon name="mdi-plus" /></q-item-section>
                              <q-item-section>Previous 2000 Characters</q-item-section>
                            </q-item>
                            <q-item clickable v-close-popup @click="toggleContext(previousCharactersPromptContext, 1000)">
                              <q-item-section side><q-icon name="mdi-plus" /></q-item-section>
                              <q-item-section>Previous 1000 Characters</q-item-section>
                            </q-item>
                            <q-item clickable v-close-popup @click="toggleContext(previousCharactersPromptContext, 500)">
                              <q-item-section side><q-icon name="mdi-plus" /></q-item-section>
                              <q-item-section>Previous 500 Characters</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>

                      <q-tooltip color="primary" :delay="500" >
                        <div>include text preceding selected text</div>
                        <div>
                          <q-badge :color="contextWarning(previousCharactersPromptContext).color" v-if="contextWarning(previousCharactersPromptContext)">
                            {{ contextWarning(previousCharactersPromptContext).warning }}
                          </q-badge>
                        </div>
                      </q-tooltip>
                    </q-chip>
                  </div>
                </div>

                <div class="text-subtitle2 q-mt-md">Files with Context Types:</div>
                <div class="row">
                  <div class="col">
                    <template v-for="context in contextTypePromptContext" :key="context.id">
                      <q-chip :text-color="getContextChipFontColor(context)" :color="getContextChipColor(context)" :icon="getContextChipIcon(context)" :clickable="isContextAllowedForThisPrompt(context)" @click="toggleContext(context)" >
                        {{ context.label }} &nbsp;
                        <q-tooltip color="primary" :delay="500" >
                          <div>{{ context.description }}</div>
                          <div>
                            <q-badge :color="contextWarning(context).color" v-if="contextWarning(context)">
                              {{ contextWarning(context).warning }}
                            </q-badge>
                          </div>
                        </q-tooltip>
                      </q-chip>
                      <div v-if="context.contextType === 'Context Type'" class="flex-break" >
                      </div>
                    </template>
                  </div>
                </div>

                <div class="text-subtitle2 q-mt-md">Variables:</div>
                <div class="row">
                  <div class="col">
                    <template v-for="context in variablesPromptContext" :key="context.id">
                      <q-chip :text-color="getContextChipFontColor(context)" :color="getContextChipColor(context)" :icon="getContextChipIcon(context)" :clickable="isContextAllowedForThisPrompt(context)" @click="toggleContext(context)" >
                        {{ context.label }} &nbsp;
                        <q-tooltip color="primary" :delay="500" >
                          <div>{{ context.description }}</div>
                          <div>
                            <q-badge :color="contextWarning(context).color" v-if="contextWarning(context)">
                              {{ contextWarning(context).warning }}
                            </q-badge>
                          </div>
                        </q-tooltip>
                      </q-chip>
                    </template>
                  </div>
                </div>

                <div class="text-subtitle2 q-mt-md">Individual Files:</div>
                <div class="row q-gutter-x-sm">
                  <div class="col-12">
                    <q-select label="Add single file" input-debounce="0" @filter="filterFnFile" use-input options-dense dense filled dropdown-icon="add" v-model="promptContextFile" :options="promptContextFiles" @update:model-value="(val) => addFileContext(val)" >
                    </q-select>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

      </q-popup-proxy>
    </div>
  </div>

  <q-dialog v-model="addFileContextDialog">
    <q-card style="width: 500px;">
      <q-card-section>
        <div class="text-h6">Include {{ addFileContextDialogData?.file?.title }} as:</div>
      </q-card-section>

      <q-card-section>
        <div>
          <q-btn flat :label="'All text of ' + addFileContextDialogData?.file?.title" no-caps color="primary" @click="confirmAddFileContext('file')" />
        </div>
        <div>
          <q-btn flat :label="'Summary of ' + addFileContextDialogData?.file?.title" no-caps color="primary" @click="confirmAddFileContext('fileSummary')" />
        </div>
        <q-separator class="q-my-sm" />
        <div>
          <q-btn flat :label="'All text of ' + addFileContextDialogData?.file?.title + ' and its text of its children'" no-caps color="primary" @click="confirmAddFileContext('fileChildren')" />
        </div>
        <div>
          <q-btn flat :label="'Summary of ' + addFileContextDialogData?.file?.title + ' and summaries of its children'" no-caps color="primary" @click="confirmAddFileContext('fileChildrenSummary')" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

</template>

<script setup>

import {removeHtmlTags, truncate} from 'src/common/utils/textUtils';
import {
  currentAndChildrenFilePromptContext, currentAndChildrenFileSummaryPromptContext,
  currentFilePromptContext,
  currentFileSummaryPromptContext, previousCharactersPromptContext, selectedTextPromptContext
} from 'src/common/resources/promptContexts';
import {usePromptStore} from 'stores/prompt-store';
import {computed, ref} from 'vue';
import {useFileStore} from 'stores/file-store';
import {useLayoutStore} from 'stores/layout-store';
import {getEditor, getEditorSelection} from 'src/common/utils/editorUtils';
import {Dialog} from 'quasar';

const promptStore = usePromptStore();
const fileStore = useFileStore();
const layoutStore = useLayoutStore();

const props = defineProps({
  prompt: {
    type: Object,
    required: false
  }
});

const contextTypes = computed(() => promptStore.contextTypes
  .concat(currentFilePromptContext)
  .concat(selectedTextPromptContext)
  .concat(fileStore.variables.map(v => ({label: 'Variable ' + v.title, color: 'green', description: 'Content from variable ' + v.title})))
);

const currentFile = computed(() => {
  return fileStore.selectedFile;
});

const promptContextFile = ref(null);
const enterConfirms = ref(false);
const addFileContextDialog = ref(false);
const addFileContextDialogData = ref(null);
const promptContextFilesText = ref('');
const promptContextFileSummariesText = ref('');

const promptContextFiles = computed(() => {
  return fileStore.queryFiles((f) => true, fileStore.files, true).map(f => ({
    id: 'File ' + f.title,
    label: '' + f.title,
    file: f,
  })).filter(f => {
    if(promptContextFilesText.value.trim() === '') {
      return true;
    }

    return f.label.toLowerCase().includes(promptContextFilesText.value.toLowerCase());
  });
});

const contextTypePromptContext = computed(() => {
  const retValue = [];

  for (const contextType of promptStore.contextTypes) {

    retValue.push({
      id: 'Context Type Summary ' + contextType.label,
      label: '' + contextType.label + ' summaries',
      contextType: 'Context Type Summary',
      parameters: contextType.label,
      color: contextType.color ?? 'deep-purple',
      description: 'Summaries from all pages with Context Type ' + contextType.label
    });

    retValue.push({
      id: 'Context Type ' + contextType.label,
      label: '' + contextType.label + ' (texts)',
      contextType: 'Context Type',
      parameters: contextType.label,
      color: contextType.color ?? 'purple',
      description: 'Content from all pages with Context Type ' + contextType.label
    });
  }

  return retValue;
})

const variablesPromptContext = computed(() => {
  return fileStore.variables.map(c => ({
    id: 'Variable ' + c.title,
    label: '' + c.title,
    contextType: 'Variable',
    parameters: c.title,
    color: 'brown',
    description: 'Content from variable ' + c.title
  }));
})

function confirmAddFileContext(option) {
  const data = addFileContextDialogData.value;
  if(!data) return;

  let context;

  if(option === 'file') {
    context = {
      id: 'File ' + data.file.title,
      label: '' + data.file.title,
      contextType: 'File',
      parameters: data.file.id,
      color: 'blue',
      description: 'All text from file ' + data.file.title
    }
  } else if(option === 'fileSummary') {
    context = {
      id: 'File Summary ' + data.file.title,
      label: '' + data.file.title + '',
      contextType: 'File Summary',
      parameters: data.file.id,
      color: 'blue',
      description: 'Summary of file ' + data.file.title
    }
  } else if(option === 'fileChildren') {
    context = {
      id: 'File and Children ' + data.file.title,
      label: '' + data.file.title + '',
      contextType: 'File and Children',
      parameters: data.file.id,
      color: 'blue',
      description: 'File ' + data.file.title + ' and its children '
    }
  } else if(option === 'fileChildrenSummary') {
    context = {
      id: 'File and Children Summary ' + data.file.title,
      label: '' + data.file.title + '',
      contextType: 'File and Children Summary',
      parameters: data.file.id,
      color: 'blue',
      description: 'Summaries of the file '+ data.file.title + ' and its children '
    }
  }

  if(context) {
    toggleContext(context);
  }

  addFileContextDialog.value = false;
  addFileContextDialogData.value = null;
}

function toggleContext(context, parametersValue = undefined) {
  if (containsContext(context)) {
    removeContext(context);
  } else {
    addContext(context, parametersValue);
  }

  promptContextFile.value = null;
  promptContextFileSummariesText.value = '';
  promptContextFilesText.value = '';
}

function containsContext(context) {
  return promptStore.promptContext.some(c => c.id === context.id);
}

function isContextAllowedForThisPrompt(context) {
  if(props.prompt && props.prompt.overrideContexts === true) {
    if(props.prompt.excludedContextTypes && props.prompt.excludedContextTypes.includes(context.id)) {
      return false;
    }
  }

  if(context === selectedTextPromptContext ) {
    const selection = getEditorSelection();

    if(!selection || selection.empty === true) {
      return false;
    }
  }

  if(context === currentFilePromptContext) {
    if (!currentFile.value || !currentFile.value.content || removeHtmlTags(currentFile.value.content).trim() === '') {
      return false;
    }
  }

  if(context === currentFileSummaryPromptContext) {
    if (!currentFile.value || !currentFile.value.synopsis || currentFile.value.synopsis.trim() === '') {
      return false;
    }
  }

  if(context === previousCharactersPromptContext) {

    const editor = getEditor();
    if(!editor) {
      return false;
    }

    if(!currentFile.value || !currentFile.value.content || removeHtmlTags(currentFile.value.content).trim() === '') {
      return false;
    }

    const selection = getEditorSelection();
    if(!selection) {
      return false;
    }

    const {from, to, empty, $anchor, $head} = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(0, from, '\n\n');

    if(textBefore.length === 0) {
      return false;
    }
  }

  return true;
}

function getContextChipColor(context) {
  if(!isContextAllowedForThisPrompt(context)) {
    //return 'white';
  }

  return containsContext(context) ? (context.color + '-4') : (context.color + '-1');
}

function getContextChipIcon(context) {
  if(!isContextAllowedForThisPrompt(context)) {
    return undefined;
  }

  return containsContext(context) ? 'mdi-check' : 'mdi-plus';
}

function getContextChipFontColor(context) {
  if(!isContextAllowedForThisPrompt(context)) {
    return 'grey-4';
  }

  return 'black'
}

function addContext(context, parametersValue = undefined) {
  if(context === selectedTextPromptContext) {
    removeContext(currentFilePromptContext);
    removeContext(currentAndChildrenFileSummaryPromptContext);
  }

  if(context === currentFilePromptContext || context === currentAndChildrenFileSummaryPromptContext) {
    removeContext(selectedTextPromptContext);
  }

  if(parametersValue) {
    context.parameters = parametersValue;
  }

  if(context === previousCharactersPromptContext) {
    context.description = '' + context.parameters + ' characters preceding your selected text';
    context.label = 'Previous ' + context.parameters + ' characters';
  }

  promptStore.promptContext.push(context);
}

function removeContext(context) {
  promptStore.promptContext = promptStore.promptContext.filter(c => c.id !== context.id);
}

function filterFnFile(val, update) {
  update(() => {
    promptContextFilesText.value = val;
  });
}

function addFileContext(context) {
  if (!containsContext(context)) {

    addFileContextDialogData.value = context;
    addFileContextDialog.value = true;
  }
}

function contextWarning(context) {
  if(context.id === selectedTextPromptContext.id) {
    const selection = getEditorSelection();

    if(!selection || selection.empty === true) {
      return {color: 'red-3', warning: 'No text was selected.'};
    }
  } else if(context.id === currentFilePromptContext.id) {
    if(!currentFile.value || !currentFile.value.content || removeHtmlTags(currentFile.value.content).trim() === '') {
      return {color: 'red-3', warning: 'Current file has no text.'};
    }
  } else if(context.id === currentFileSummaryPromptContext.id) {
    if (!currentFile.value || !currentFile.value.synopsis || currentFile.value.synopsis.trim() === '') {
      return {color: 'red-3', warning: 'Current file has no synopsis. Write it first.'};
    }
  } else if(context.id === previousCharactersPromptContext.id) {

    const editor = getEditor();
    if(!editor) {
      return {color: 'red-3', warning: 'No file selected.'};
    }

    if(!currentFile.value || !currentFile.value.content || removeHtmlTags(currentFile.value.content).trim() === '') {
      return {color: 'red-3', warning: 'Current file has no text.'};
    }

    const selection = getEditorSelection();
    if(!selection) {
      return {color: 'red-3', warning: 'No text was selected.'};
    }

    const {from, to, empty, $anchor, $head} = selection;
    const textBefore = editor.state.doc.textBetween(0, from, '\n\n');

    if(textBefore.length === 0) {
      return {color: 'red-3', warning: 'There is no text before your selection.'};
    }
  }

  return null;
}

function saveCurrentContext() {
  Dialog.create({
    title: 'Prompt',
    message: 'Enter a name for the context',
    prompt: {
      model: 'My context',
      type: 'text' // optional
    },
    cancel: true,
    persistent: true
  }).onOk(data => {
    promptStore.savedPromptContexts.push({
      name: data,
      value: [...promptStore.promptContext]
    });
  }).onCancel(() => {
  }).onDismiss(() => {
  })
}

function restoreSavedContext(savedContext) {
  promptStore.promptContext = [];

  for(const context of savedContext.value) {
    addContext(context);
  }
}

function deleteSavedContext(savedContext) {
  promptStore.savedPromptContexts = promptStore.savedPromptContexts.filter(sc => sc.name !== savedContext.name);
}

</script>

<style scoped>

</style>
