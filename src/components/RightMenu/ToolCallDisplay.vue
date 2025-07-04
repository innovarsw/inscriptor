<template>
  <div class="tool-call-display">
    <q-card flat bordered class="q-mb-sm">
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

            <div v-if="toolResult" class="tool-result q-mt-sm q-pa-sm bg-blue-1 rounded-borders">
              <div class="text-caption text-grey-8 q-mb-xs">Result:</div>
              <div class="tool-result-content">{{ toolResult }}</div>
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  toolCall: {
    type: Object,
    required: true
  }
});

const expanded = ref(false);

const toolFriendlyNames = {
  'modifyParagraph': 'Modify Paragraph',
  'stop': 'Stop Processing', 
  'getCurrentDocument': 'Get Current Document'
};

const toolName = computed(() => {
  const technicalName = props.toolCall?.function?.name;
  return toolFriendlyNames[technicalName] || technicalName || 'Unknown Tool';
});

const toolIcon = computed(() => {
  const technicalName = props.toolCall?.function?.name;
  if (technicalName === 'modifyParagraph') {
    return 'mdi-pencil';
  } else if (technicalName === 'stop') {
    return 'mdi-stop';
  } else if (technicalName === 'getCurrentDocument') {
    return 'mdi-file-document-outline';
  }
  return 'mdi-tools';
});

const toolColor = computed(() => {
  const technicalName = props.toolCall?.function?.name;
  if (technicalName === 'modifyParagraph') {
    return 'primary';
  } else if (technicalName === 'stop') {
    return 'red';
  } else if (technicalName === 'getCurrentDocument') {
    return 'blue';
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

const toolResult = computed(() => {
  // This will be populated once we handle tool results properly
  return null;
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

body.body--dark .tool-parameters {
  background-color: #1a1a1a;
}

body.body--dark .tool-result {
  background-color: #1a2332;
}
</style>
