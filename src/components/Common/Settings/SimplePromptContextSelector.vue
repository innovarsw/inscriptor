<template>
  <div class="bordered rounded-borders" flat>
    <div class="cursor-pointer context-selector q-px-md q-py-md">
      <div class="row">
        <div class="col text-subtitle2 flex items-center">
          <q-icon name="mdi-robot-outline" class="q-mr-xs" />
          Agent Context Configuration
        </div>
        <div class="col-auto"><q-icon name="keyboard_arrow_down" size="sm" /></div>
      </div>

      <template v-if="selectedContexts.length > 0">
        <template v-for="context in selectedContexts" :key="context.id">
          <q-chip 
            :color="context.color + '-3'" 
            removable 
            @remove="removeContext(context)"
            class="q-ma-xs"
          >
            {{ context.label }}
            <q-badge 
              :color="contextWarning(context).color" 
              v-if="contextWarning(context)"
              class="q-ml-xs"
            >
              <q-icon name="warning" size="12px" />
            </q-badge>
            <q-tooltip color="primary" :delay="500">
              {{ context.description }}
              <div v-if="contextWarning(context)" class="text-orange">
                {{ contextWarning(context).warning }}
              </div>
            </q-tooltip>
          </q-chip>
        </template>
      </template>
      <template v-else>
        <div class="text-grey-6 q-mt-sm">
          No context selected for agent execution
          <q-tooltip :delay="500">
            Select contexts that will be automatically included when agents use this prompt.
          </q-tooltip>
        </div>
      </template>

      <q-popup-proxy>
        <q-card style="width: 668px">
          <q-card-section class="no-padding">
            <div class="row">
              <div class="col q-pa-md">
                <div class="text-subtitle2 q-mb-md">Basic Context Types:</div>
                <div class="row q-gutter-sm">
                  <template v-for="context in basicContexts" :key="context.id">
                    <q-chip 
                      :text-color="getContextChipFontColor(context)" 
                      :color="getContextChipColor(context)" 
                      :icon="getContextChipIcon(context)" 
                      :clickable="isContextAllowed(context)" 
                      @click="context.id === previousCharactersPromptContext.id ? null : toggleContext(context)"
                      class="q-ma-xs"
                    >
                      {{ context.label }} &nbsp;
                      
                      <!-- Previous Characters dropdown menu -->
                      <q-btn
                        v-if="context.id === previousCharactersPromptContext.id"
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
                      
                      <q-tooltip color="primary" :delay="500">
                        <div>{{ context.description }}</div>
                        <div v-if="contextWarning(context)" class="text-orange">
                          {{ contextWarning(context).warning }}
                        </div>
                      </q-tooltip>
                    </q-chip>
                  </template>
                </div>

                <div class="text-subtitle2 q-mt-md q-mb-md">Variables:</div>
                <div class="row q-gutter-sm">
                  <template v-for="context in variableContexts" :key="context.id">
                    <q-chip 
                      :text-color="getContextChipFontColor(context)" 
                      :color="getContextChipColor(context)" 
                      :icon="getContextChipIcon(context)" 
                      :clickable="isContextAllowed(context)" 
                      @click="toggleContext(context)"
                      class="q-ma-xs"
                    >
                      {{ context.label }}
                      <q-tooltip color="primary" :delay="500">
                        <div>{{ context.description }}</div>
                      </q-tooltip>
                    </q-chip>
                  </template>
                </div>

                <div class="text-subtitle2 q-mt-md q-mb-md">Context Types:</div>
                <div class="row q-gutter-sm">
                  <template v-for="context in contextTypeContexts" :key="context.id">
                    <q-chip 
                      :text-color="getContextChipFontColor(context)" 
                      :color="getContextChipColor(context)" 
                      :icon="getContextChipIcon(context)" 
                      :clickable="isContextAllowed(context)" 
                      @click="toggleContext(context)"
                      class="q-ma-xs"
                    >
                      {{ context.label }}
                      <q-tooltip color="primary" :delay="500">
                        <div>{{ context.description }}</div>
                        <div v-if="contextWarning(context)" class="text-orange">
                          {{ contextWarning(context).warning }}
                        </div>
                      </q-tooltip>
                    </q-chip>
                  </template>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-popup-proxy>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { usePromptStore } from 'stores/prompt-store';
import { useFileStore } from 'stores/file-store';
import {
  allPromptContexts,
  currentAndChildrenFileSummaryPromptContext,
  currentFilePromptContext,
  currentFileSummaryPromptContext,
  selectedTextPromptContext,
  previousCharactersPromptContext
} from 'src/common/resources/promptContexts';
import { removeHtmlTags } from 'src/common/utils/textUtils';
import { getEditor, getEditorSelection } from 'src/common/utils/editorUtils';

const promptStore = usePromptStore();
const fileStore = useFileStore();

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

// Internal context state that mirrors the selected context IDs
const selectedContexts = ref([]);

// Convert context IDs to context objects for display
const updateSelectedContexts = () => {
  selectedContexts.value = (props.modelValue || []).map(contextId => {
    // Handle Variable contexts
    if (contextId.startsWith('Variable ')) {
      const variableName = contextId.replace('Variable ', '');
      const variable = fileStore.variables.find(v => v.title === variableName);
      return {
        id: contextId,
        label: `Variable: ${variableName}`,
        contextType: 'Variable',
        parameters: variableName,
        color: 'brown',
        description: `Content from variable ${variableName}`
      };
    }
    
    // Handle Context Type Summary contexts
    if (contextId.startsWith('Context Type Summary ')) {
      const contextTypeName = contextId.replace('Context Type Summary ', '');
      const contextType = promptStore.contextTypes.find(ct => ct.label === contextTypeName);
      return {
        id: contextId,
        label: `${contextTypeName} (summaries)`,
        contextType: 'Context Type Summary',
        parameters: contextTypeName,
        color: contextType?.color || 'deep-purple',
        description: `Summaries from all pages with context type ${contextTypeName}`
      };
    }
    
    // Handle Context Type full content contexts
    if (contextId.startsWith('Context Type ')) {
      const contextTypeName = contextId.replace('Context Type ', '');
      const contextType = promptStore.contextTypes.find(ct => ct.label === contextTypeName);
      return {
        id: contextId,
        label: `${contextTypeName} (full text)`,
        contextType: 'Context Type',
        parameters: contextTypeName,
        color: contextType?.color || 'purple',
        description: `Full content from all pages with context type ${contextTypeName}`
      };
    }
    
    // Handle Previous Characters contexts with parameters
    if (contextId.startsWith('Previous Text ')) {
      const characterCount = contextId.replace('Previous Text ', '');
      return {
        id: contextId,
        label: `Previous ${characterCount} characters`,
        contextType: 'Previous Characters',
        parameters: parseInt(characterCount),
        color: previousCharactersPromptContext.color,
        description: `${characterCount} characters preceding your selected text`
      };
    }
    
    // Handle standard contexts
    const standardContext = allPromptContexts.find(c => c.id === contextId);
    if (standardContext) {
      return standardContext;
    }
    
    // Handle currentAndChildrenFileSummaryPromptContext
    if (contextId === currentAndChildrenFileSummaryPromptContext.id) {
      return currentAndChildrenFileSummaryPromptContext;
    }
    
    // Unknown context
    return {
      id: contextId,
      label: contextId,
      contextType: 'Unknown',
      color: 'grey',
      description: 'Unknown context type'
    };
  }).filter(Boolean);
};

// Watch for changes in modelValue
watch(() => props.modelValue, updateSelectedContexts, { immediate: true });

// Basic contexts from allPromptContexts
const basicContexts = computed(() => {
  const contexts = [...allPromptContexts];
  contexts.push(currentAndChildrenFileSummaryPromptContext);
  return contexts;
});

// Variable contexts
const variableContexts = computed(() => {
  return fileStore.variables.map(variable => ({
    id: `Variable ${variable.title}`,
    label: `Variable: ${variable.title}`,
    contextType: 'Variable',
    parameters: variable.title,
    color: 'brown',
    description: `Content from variable ${variable.title}`
  }));
});

// Context type contexts
const contextTypeContexts = computed(() => {
  const contexts = [];
  
  promptStore.contextTypes.forEach(contextType => {
    contexts.push({
      id: `Context Type Summary ${contextType.label}`,
      label: `${contextType.label} (summaries)`,
      contextType: 'Context Type Summary',
      parameters: contextType.label,
      color: contextType.color || 'deep-purple',
      description: `Summaries from all pages with context type ${contextType.label}`
    });
    
    contexts.push({
      id: `Context Type ${contextType.label}`,
      label: `${contextType.label} (full text)`,
      contextType: 'Context Type',
      parameters: contextType.label,
      color: contextType.color || 'purple',
      description: `Full content from all pages with context type ${contextType.label}`
    });
  });
  
  return contexts;
});

// Check if context is selected
const containsContext = (context) => {
  // For Previous Characters context, check if any parameterized version exists
  if (context.id === previousCharactersPromptContext.id) {
    return selectedContexts.value.some(c => c.id.startsWith('Previous Text '));
  }
  return selectedContexts.value.some(c => c.id === context.id);
};

// Toggle context selection
const toggleContext = (context, parametersValue = undefined) => {
  if (containsContext(context)) {
    removeContext(context);
  } else {
    addContext(context, parametersValue);
  }
};

// Add context
const addContext = (context, parametersValue = undefined) => {
  let contextId = context.id;
  
  // For Previous Characters context, include the parameter in the ID
  if (context === previousCharactersPromptContext && parametersValue) {
    contextId = `${context.id} ${parametersValue}`;
    context.parameters = parametersValue;
    context.description = '' + parametersValue + ' characters preceding your selected text';
    context.label = 'Previous ' + parametersValue + ' characters';
  }

  const newContextIds = [...(props.modelValue || [])];
  if (!newContextIds.includes(contextId)) {
    newContextIds.push(contextId);
    emit('update:modelValue', newContextIds);
  }
};

// Remove context
const removeContext = (context) => {
  const newContextIds = (props.modelValue || []).filter(id => {
    // For Previous Characters with parameters, match by base ID or full ID
    if (context.contextType === 'Previous Characters') {
      return id !== context.id;
    }
    return id !== context.id;
  });
  emit('update:modelValue', newContextIds);
};

// Context allowed check
const isContextAllowed = (context) => {
  // Basic availability checks
  if (context === selectedTextPromptContext) {
    const selection = getEditorSelection();
    return selection && !selection.empty;
  }
  
  if (context === currentFilePromptContext) {
    const currentFile = fileStore.selectedFile;
    return currentFile && currentFile.content && removeHtmlTags(currentFile.content).trim() !== '';
  }
  
  if (context === currentFileSummaryPromptContext) {
    const currentFile = fileStore.selectedFile;
    return currentFile && currentFile.synopsis && currentFile.synopsis.trim() !== '';
  }
  
  if (context === previousCharactersPromptContext) {
    const editor = getEditor();
    if (!editor) {
      return false;
    }

    const currentFile = fileStore.selectedFile;
    if (!currentFile || !currentFile.content || removeHtmlTags(currentFile.content).trim() === '') {
      return false;
    }

    const selection = getEditorSelection();
    if (!selection) {
      return false;
    }

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(0, from, '\n\n');

    if (textBefore.length === 0) {
      return false;
    }
  }
  
  return true;
};

// Context warning system
const contextWarning = (context) => {
  if (context.id === selectedTextPromptContext.id) {
    const selection = getEditorSelection();
    if (!selection || selection.empty) {
      return { color: 'red-3', warning: 'No text selected.' };
    }
  }
  
  if (context.id === currentFilePromptContext.id) {
    const currentFile = fileStore.selectedFile;
    if (!currentFile || !currentFile.content || removeHtmlTags(currentFile.content).trim() === '') {
      return { color: 'red-3', warning: 'Current file has no text.' };
    }
  }
  
  if (context.id === currentFileSummaryPromptContext.id) {
    const currentFile = fileStore.selectedFile;
    if (!currentFile || !currentFile.synopsis || currentFile.synopsis.trim() === '') {
      return { color: 'red-3', warning: 'Current file has no synopsis.' };
    }
  }
  
  if (context.id === previousCharactersPromptContext.id) {
    const editor = getEditor();
    if (!editor) {
      return { color: 'red-3', warning: 'No file selected.' };
    }

    const currentFile = fileStore.selectedFile;
    if (!currentFile || !currentFile.content || removeHtmlTags(currentFile.content).trim() === '') {
      return { color: 'red-3', warning: 'Current file has no text.' };
    }

    const selection = getEditorSelection();
    if (!selection) {
      return { color: 'red-3', warning: 'No text was selected.' };
    }

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(0, from, '\n\n');

    if (textBefore.length === 0) {
      return { color: 'red-3', warning: 'No text before selection.' };
    }
  }
  
  // Warning for potentially large contexts
  if (context.contextType === 'Context Type') {
    return { color: 'orange-3', warning: 'May be very large - includes full documents.' };
  }
  
  if (context.contextType === 'Context Type Summary') {
    return { color: 'orange-3', warning: 'May include many file summaries.' };
  }
  
  return null;
};

// Chip color management
const getContextChipColor = (context) => {
  if (!isContextAllowed(context)) {
    return 'grey-3';
  }
  
  return containsContext(context) ? (context.color + '-4') : (context.color + '-1');
};

const getContextChipIcon = (context) => {
  if (!isContextAllowed(context)) {
    return 'block';
  }
  
  return containsContext(context) ? 'check' : 'add';
};

const getContextChipFontColor = (context) => {
  if (!isContextAllowed(context)) {
    return 'grey-4';
  }
  
  return 'black';
};
</script>

<style scoped>
.context-selector {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  min-height: 56px;
}

.context-selector:hover {
  background: #f5f5f5;
}
</style>