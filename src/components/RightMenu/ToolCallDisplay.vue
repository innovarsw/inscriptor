<template>
  <div class="tool-call-display">
    <q-card flat bordered class="">
      <q-card-section class="q-pa-sm">
        <div class="row items-center q-gutter-x-sm">
          <div class="col-auto">
            <q-icon :name="toolIcon" :color="toolColor" size="xs" />
          </div>
          <div class="col-auto">
            <span class="text-caption">{{ toolName }}</span>
          </div>
          <div class="col">
            <q-space />
          </div>
          <div class="col-auto">
            <q-btn
              flat
              dense
              round
              :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              @click="expanded = !expanded"
              size="sm"
            />
          </div>
        </div>

        <q-slide-transition>
          <div v-show="expanded" class="q-mt-sm">
            <div v-if="hasParameters" class="tool-parameters q-pa-sm bg-grey-2 rounded-borders">
              <div class="text-caption text-grey-8 q-mb-xs">Parameters:</div>
              <pre class="tool-params-pre">{{ formattedArguments }}</pre>
            </div>

            <div v-if="hasToolResult" class="tool-result q-mt-sm q-pa-sm rounded-borders" :class="resultStatusClass">
              <div class="text-caption text-grey-8 q-mb-xs flex items-center">
                <q-icon :name="resultStatusIcon" :color="resultStatusColor" size="xs" class="q-mr-xs" />
                Result:
              </div>
              <div class="tool-result-content">
                <pre class="result-pre">{{ truncatedResult }}</pre>
                <div v-if="isResultLong" class="q-mt-xs">
                  <q-btn
                    flat
                    dense
                    size="sm"
                    :label="resultExpanded ? 'Show less' : 'Show more'"
                    @click="resultExpanded = !resultExpanded"
                    color="primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { truncate } from 'src/common/utils/textUtils';

const props = defineProps({
  toolCall: {
    type: Object,
    required: true
  },
  toolResult: {
    type: String,
    default: null
  }
});

const expanded = ref(false);
const resultExpanded = ref(false);
const maxResultLength = 500;

const toolFriendlyNames = {
  'stop': 'Stop Processing',
  'getCurrentDocument': 'Get Current Document',
  'getAvailableAIPrompts': 'Get Available AI Prompts',
  'executeAIPrompt': 'Execute AI Prompt',
  'listProjectFiles': 'List Project Files',
  'readFile': 'Read File',
  'search': 'Search Project Files',
  'setFileSummary': 'Set File Summary',
  'getAllContextTypes': 'Get Available Context Types'
};

const toolName = computed(() => {
  const technicalName = props.toolCall?.function?.name;

  // Special handling for modifyParagraph to show specific action type
  if (technicalName === 'modifyParagraph') {
    try {
      const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
      const action = args.action || 'modify'; // Default to 'modify' if no action specified
      const position = args.position;

      switch (action) {
        case 'add':
          return position ? `Agent wants to: Add Paragraph (${position})` : 'Agent wants to: Add Paragraph';
        case 'remove':
          return 'Agent wants to: Remove Paragraph';
        case 'modify':
        default:
          return 'Agent wants to: Modify Paragraph';
      }
    } catch (e) {
      return 'Agent wants to: Modify Paragraph';
    }
  }

  const baseName = toolFriendlyNames[technicalName] || technicalName || 'Unknown Tool';
  return `Agent wants to: ${baseName}`;
});

const toolIcon = computed(() => {
  const technicalName = props.toolCall?.function?.name;

  // Special handling for modifyParagraph to show specific action icons
  if (technicalName === 'modifyParagraph') {
    try {
      const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
      const action = args.action || 'modify'; // Default to 'modify' if no action specified

      switch (action) {
        case 'add':
          return 'mdi-plus';
        case 'remove':
          return 'mdi-delete';
        case 'modify':
        default:
          return 'mdi-pencil';
      }
    } catch (e) {
      return 'mdi-pencil';
    }
  } else if (technicalName === 'stop') {
    return 'mdi-stop';
  } else if (technicalName === 'getCurrentDocument') {
    return 'mdi-file-document-outline';
  } else if (technicalName === 'getAvailableAIPrompts') {
    return 'mdi-format-list-bulleted';
  } else if (technicalName === 'executeAIPrompt') {
    return 'mdi-play-circle-outline';
  } else if (technicalName === 'listProjectFiles') {
    return 'mdi-folder-open-outline';
  } else if (technicalName === 'readFile') {
    return 'mdi-file-search-outline';
  } else if (technicalName === 'search') {
    return 'mdi-magnify';
  } else if (technicalName === 'setFileSummary') {
    return 'mdi-file-edit-outline';
  } else if (technicalName === 'getAllContextTypes') {
    return 'mdi-tag-multiple-outline';
  }
  return 'mdi-tools';
});

const toolColor = computed(() => {
  const technicalName = props.toolCall?.function?.name;

  // Special handling for modifyParagraph to show specific action colors
  if (technicalName === 'modifyParagraph') {
    try {
      const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
      const action = args.action || 'modify'; // Default to 'modify' if no action specified

      switch (action) {
        case 'add':
          return 'green';
        case 'remove':
          return 'red';
        case 'modify':
        default:
          return 'primary';
      }
    } catch (e) {
      return 'primary';
    }
  } else if (technicalName === 'stop') {
    return 'red';
  } else if (technicalName === 'getCurrentDocument') {
    return 'blue';
  } else if (technicalName === 'getAvailableAIPrompts') {
    return 'purple';
  } else if (technicalName === 'executeAIPrompt') {
    return 'green';
  } else if (technicalName === 'listProjectFiles') {
    return 'orange';
  } else if (technicalName === 'readFile') {
    return 'teal';
  } else if (technicalName === 'search') {
    return 'indigo';
  } else if (technicalName === 'setFileSummary') {
    return 'amber';
  } else if (technicalName === 'getAllContextTypes') {
    return 'pink';
  }
  return 'grey';
});

const formattedArguments = computed(() => {
  try {
    const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
    return JSON.stringify(args, null, 2);
  } catch (e) {
    return props.toolCall?.function?.arguments || '';
  }
});

const hasParameters = computed(() => {
  try {
    const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
    return Object.keys(args).length > 0;
  } catch (e) {
    return false;
  }
});

const hasToolResult = computed(() => {
  return props.toolResult && props.toolResult.length > 0;
});

const isResultLong = computed(() => {
  return props.toolResult && props.toolResult.length > maxResultLength;
});

const truncatedResult = computed(() => {
  if (!props.toolResult) return '';
  if (resultExpanded.value || !isResultLong.value) {
    return props.toolResult;
  }
  return truncate(props.toolResult, maxResultLength);
});

const resultStatus = computed(() => {
  if (!hasToolResult.value) return 'none';

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(props.toolResult);
    if (parsed.success === false || parsed.error) return 'error';
  } catch (e) {
    // Check if result starts with error indicators (case insensitive)
    const result = props.toolResult.trim().toLowerCase();
    if (result.startsWith('error') || result.startsWith('failed')) {
      return 'error';
    }
  }

  // Default to success
  return 'success';
});

const resultStatusClass = computed(() => {
  switch (resultStatus.value) {
    case 'error':
      return 'bg-red-1';
    case 'success':
      return 'bg-green-1';
    default:
      return 'bg-blue-1';
  }
});

const resultStatusIcon = computed(() => {
  switch (resultStatus.value) {
    case 'error':
      return 'mdi-alert-circle';
    case 'success':
      return 'mdi-check-circle';
    default:
      return 'mdi-information';
  }
});

const resultStatusColor = computed(() => {
  switch (resultStatus.value) {
    case 'error':
      return 'red';
    case 'success':
      return 'green';
    default:
      return 'blue';
  }
});
</script>

<style scoped>
.tool-call-display {
  width: 100%;
}

.tool-parameters {
  font-family: monospace;
  font-size: 0.85em;
}

.tool-params-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.tool-result-content {
  font-size: 0.9em;
}

.result-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
  font-size: 0.85em;
}

body.body--dark .tool-parameters {
  background-color: #1a1a1a;
}

body.body--dark .tool-result {
  background-color: #1a2332;
}

body.body--dark .bg-red-1 {
  background-color: #2d1b1b;
}

body.body--dark .bg-green-1 {
  background-color: #1b2d1b;
}

body.body--dark .bg-blue-1 {
  background-color: #1a2332;
}
</style>
