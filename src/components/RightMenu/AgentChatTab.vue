<template>
  <div class="q-mx-md">
    <div class="column full-height">

      <!-- Loading indicator -->
      <div class="col-auto">
        <div v-if="aiAgentStore.agentChats.isAgentRunning" class="menu-subtitle q-mb-lg">
          <q-spinner-ios></q-spinner-ios> {{ aiAgentStore.agentState === 'waiting_for_user' ? 'agent is waiting for approval...' : 'agent is working...' }}
          <q-btn dense outline @click="aiAgentStore.stopAgentChatExecution()" label="Stop" size="sm" class="no-margin q-py-none" color="red"/>
        </div>
      </div>

      <!-- Chat controls and pagination -->
      <div class="col-auto">
        <div class="flex justify-center q-mb-md" v-if="maxChatsPage > 0">
          <div class="col-auto flex items-center" v-if="maxChatsPage > 0">
            <q-pagination :max="maxChatsPage" v-model="page" direction-links :boundary-links="false" />
          </div>

          <div class="col">
          </div>

          <div class="col-auto flex items-center q-mr-sm">
            <q-btn color="accent" @click="newChat" size="md" icon="mdi-pencil-box-outline" class="" label="New chat">
              <q-tooltip>
                Start a new agent conversation
              </q-tooltip>
            </q-btn>
          </div>

          <div class="col-auto flex items-center">
            <q-btn flat color="negative" icon="mdi-delete-outline" size="md">
              <q-menu>
                <q-list dense>
                  <q-item clickable @click="removeCurrentChat" v-close-popup>
                    <q-item-section side>
                      <q-icon name="mdi-close" />
                    </q-item-section>
                    <q-item-section>
                      Remove current conversation
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="removeAllChats">
                    <q-item-section side>
                      <q-icon name="mdi-delete-outline" color="negative" />
                    </q-item-section>
                    <q-item-section>
                      Remove all conversations
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
        <div v-else class="flex justify-center q-mb-md q-mt-lg">
          <q-btn color="accent" @click="newChat" size="md" icon="mdi-robot" class="" label="New agent chat">
            <q-tooltip>
              Start a new conversation with AI agent
            </q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Chat messages -->
      <div class="col">
        <div class="q-gutter-y-sm q-ml-xs chat-history-container" style="margin-bottom: 100px;">
          <div class="chat-messages-container-unhinged">
            <template v-for="message in currentChatMessages" :key="message.id">

              <!-- User messages -->
              <div v-if="message.role === 'user'" class="row">
                <div class="chat-message chat-user-message q-mt-md">
                  <div class="chat-message-header">
                    <span class="chat-message-role">You:</span>
                  </div>
                  <div class="chat-message-content" :class="writeClasses" v-html="markdownToHtml(message.content)">
                  </div>
                </div>
              </div>

              <!-- Assistant messages -->
              <div v-else-if="message.role === 'assistant'" class="row">
                <div class="chat-message chat-assistant-message q-mt-md">
                  <div class="chat-message-header">
                    <span class="chat-message-role">Agent:</span>
                  </div>
                  <div class="chat-message-content">
                    <div v-if="message.content" :class="writeClasses" v-html="markdownToHtml(message.content)"></div>

                    <!-- Tool calls display -->
                    <div v-if="message.toolCalls && message.toolCalls.length > 0" class="q-mt-md">
                      <ToolCallDisplay
                        v-for="(toolCall, index) in message.toolCalls"
                        :key="index"
                        :toolCall="toolCall"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- System messages -->
              <div v-else-if="message.role === 'system'" class="row">
                <div class="chat-message chat-system-message q-mt-md">
                  <div class="chat-message-header">
                    <span class="chat-message-role">System:</span>
                  </div>
                  <div class="chat-message-content text-red">
                    {{ message.content }}
                  </div>
                </div>
              </div>

              <!-- Function/Tool result messages -->
              <div v-else-if="message.role === 'function'" class="row">
                <div class="chat-message chat-function-message q-mt-md">
                  <div class="chat-message-header">
                    <span class="chat-message-role">{{ message.toolName || 'Tool' }}:</span>
                  </div>
                  <div class="chat-message-content" :class="writeClasses" v-html="markdownToHtml(message.content)">
                  </div>
                </div>
              </div>

            </template>

            <!-- Loading indicator when agent is processing -->
            <div v-if="aiAgentStore.agentChats.isAgentRunning" class="row">
              <div class="chat-message chat-assistant-message q-mt-md">
                <div class="chat-message-header">
                  <span class="chat-message-role">Agent:</span>
                </div>
                <div class="chat-message-content">
                  <span class="text-grey-7">{{ aiAgentStore.agentState === 'waiting_for_user' ? 'Agent is waiting for approval' : 'Agent is thinking' }}</span>
                  <AnimatedDots :fixedWidth="'30px'" :speed="500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="col">
        <div class="full-width" style="position: absolute; bottom: 0; right: 0; z-index: 1000">
          <div class="q-mr-lg bg-theme-primary">
            <div class="">

              <div class="text-caption q-pa-md q-pb-sm q-pt-sm text-grey-7 left-border" v-if="currentChatMessages.length === 0">
                <div class="bordered q-pa-sm help-text-area">
                  <q-icon name="mdi-robot" class="text-accent q-mb-xs" />
                  AI Agent:
                  <div>
                    The agent can analyze and modify your document using tools.
                  </div>
                  <div>
                    Start by describing what you want the agent to do.
                  </div>
                </div>
              </div>

              <div class="row left-border">
                <div class="col q-ml-sm rounded-borders q-px-sm">
                  <q-input
                    v-model="inputText"
                    :label="'Message to agent...'"
                    borderless
                    class="full-width"
                    rows="4"
                    type="textarea"
                    lines
                    dense
                    ref="inputRef"
                    @keydown="onInputKey"
                    :disable="aiAgentStore.agentChats.isAgentRunning"
                  />
                </div>
                <div class="col-auto q-ml-sm">
                  <div class="column">
                    <div class="col">
                      <q-btn
                        icon="mdi-send"
                        color="accent"
                        @click="sendMessage()"
                        :disable="!inputText.trim() || aiAgentStore.agentChats.isAgentRunning || promptForAgentChatId === null"
                      />
                    </div>
                    <div class="col q-mt-md">
                      <q-btn flat icon="mdi-cog" @click="settingsOpen = !settingsOpen" />
                    </div>
                  </div>
                </div>
              </div>

              <q-slide-transition>
                <q-card-section v-if="settingsOpen" class="q-gutter-y-xs left-border">
                  <div class="row">
                    <div class="col q-mr-xs">
                      <q-select v-model="modelForAgentChatId" filled dense options-dense label="Model used for agent" :options="models" />
                    </div>
                    <div class="col q-ml-xs">
                      <q-select v-model="promptForAgentChatId" filled dense options-dense label="Prompt used for agent" :options="prompts" />
                    </div>
                  </div>
                </q-card-section>
              </q-slide-transition>

            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAiAgentStore } from 'stores/aiagent-store';
import { usePromptStore } from 'stores/prompt-store';
import { useFileStore } from 'stores/file-store';
import { Dialog } from 'quasar';
import ToolCallDisplay from './ToolCallDisplay.vue';
import { markdownToHtml } from 'src/common/utils/textUtils';
import AnimatedDots from 'src/components/Common/AnimatedDots.vue';

const aiAgentStore = useAiAgentStore();
const promptStore = usePromptStore();
const fileStore = useFileStore();

const inputText = ref('');
const inputRef = ref(null);
const settingsOpen = ref(false);

// Computed properties
const currentChat = computed(() => aiAgentStore.getActiveAgentChat());

const currentChatMessages = computed(() => {
  const messages = currentChat.value?.messages || [];
  // Filter out hidden messages (initial system and user prompts)
  return messages.filter(msg => !msg.hidden);
});

const allChats = computed(() => aiAgentStore.agentChats.chats);

const maxChatsPage = computed(() => allChats.value.length);

const page = computed({
  get: () => {
    const index = allChats.value.findIndex(c => c.id === aiAgentStore.agentChats.activeChat);
    return index >= 0 ? index + 1 : 1;
  },
  set: (value) => {
    const chatIndex = value - 1;
    if (chatIndex >= 0 && chatIndex < allChats.value.length) {
      aiAgentStore.setActiveAgentChat(allChats.value[chatIndex].id);
    }
  }
});

// Model and prompt selection
const models = computed(() => promptStore.models.map(tab => ({label: tab.name, value: tab.id})));

const modelForAgentChatId = computed({
  get: () => {
    const t = promptStore.getModel(promptStore.currentModelForAgentChatId);
    if(!t) return null;
    return {
      label: t.name,
      value: t.id,
    };
  },
  set: (value) => {
    promptStore.currentModelForAgentChatId = value.value;

    promptStore.currentPromptForAgentChatId = null;
    if(promptStore.currentPromptForAgentChatId === null) {
      // find first prompt of promptType === 'chat'
      promptStore.currentPromptForAgentChatId = promptStore.prompts.find(p => p.modelId === promptStore.currentModelForAgentChatId && p.promptType === 'chat')?.id;
    }
  }
});

const prompts = computed(() => promptStore.prompts.filter(p => p.modelId === promptStore.currentModelForAgentChatId && p.promptType === 'chat')
  .map(prompt => ({label: prompt.title, value: prompt.id})));

const promptForAgentChatId = computed({
  get: () => {
    const t = promptStore.prompts.find(p => p.id === promptStore.currentPromptForAgentChatId);
    if(!t) return null;
    return {
      label: t.title,
      value: t.id,
    };
  },
  set: (value) => {
    promptStore.currentPromptForAgentChatId = value.value;
  }
});

// Computed property for markdown styling classes
const writeClasses = computed(() => {
  return {
    'write-serif': (fileStore.selectedFile?.settings?.fontType ?? 'serif') === 'serif',
    'write-sans-serif': fileStore.selectedFile?.settings?.fontType === 'sans-serif',
    'write-monospace': fileStore.selectedFile?.settings?.fontType === 'monospace',
    'write-small': fileStore.selectedFile?.settings?.fontSize === 'small',
    'write-medium': (fileStore.selectedFile?.settings?.fontSize ?? 'medium') === 'medium',
    'write-large': fileStore.selectedFile?.settings?.fontSize === 'large',

    'text-editor': (fileStore.selectedFile?.settings?.editorType ?? 'regular') === 'regular',
    'text-editor-condensed': fileStore.selectedFile?.settings?.editorType === 'condensed',
    'text-editor-non-indented': fileStore.selectedFile?.settings?.editorType === 'non-indented',

    'prompt-text-editor': true,
    'prompt-results': true,
  }
});

// Methods
async function onInputKey(e) {
  if (!e) return;

  if ((e.key === 'Enter' && !e.shiftKey)) {
    if (inputText.value.trim().length > 0) {
      e.stopPropagation();
      e.preventDefault();
      await sendMessage();
    }
  }
}

async function sendMessage() {
  if (!inputText.value.trim() || aiAgentStore.agentChats.isAgentRunning || !promptForAgentChatId.value) {
    return;
  }

  const prompt = promptStore.prompts.find(p => p.id === promptForAgentChatId.value.value);
  if (!prompt) {
    return;
  }

  const message = inputText.value.trim();
  inputText.value = '';

  await aiAgentStore.executeAgentPrompt(message, prompt);
}

function newChat() {
  aiAgentStore.createAgentChat();
}

function removeCurrentChat() {
  if (aiAgentStore.agentChats.activeChat) {
    aiAgentStore.deleteAgentChat(aiAgentStore.agentChats.activeChat);
  }
}

function removeAllChats() {
  Dialog.create({
    title: 'Confirm',
    message: 'Are you sure you want to delete all agent conversations?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    aiAgentStore.deleteAllAgentChats();
  });
}

// Initialize on mount
onMounted(() => {
  // Create initial chat if none exists
  if (allChats.value.length === 0) {
    aiAgentStore.createAgentChat();
  }
});

// Auto-scroll to bottom when new messages arrive
watch(currentChatMessages, () => {
  setTimeout(() => {
    const container = document.querySelector('.chat-history-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, 100);
}, { deep: true });
</script>

<style scoped>
.chat-message {
  max-width: 80%;
  margin-bottom: 8px;
}

.chat-user-message {
  margin-left: auto;
  background-color: rgba(79, 94, 214, 0.1);
  color: rgba(0, 0, 0, 0.87);
  padding: 8px 12px;
  border-radius: 8px;
}

.chat-assistant-message {
  margin-right: auto;
  background-color: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.87);
  padding: 8px 12px;
  border-radius: 8px;
}

.chat-system-message {
  margin: 0 auto;
  background-color: rgba(244, 67, 54, 0.1);
  color: rgba(0, 0, 0, 0.87);
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
  max-width: 90%;
}

.chat-function-message {
  margin-right: auto;
  background-color: rgba(255, 152, 0, 0.1);
  color: rgba(0, 0, 0, 0.87);
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid rgba(255, 152, 0, 0.5);
  max-width: 85%;
}

.chat-message-header {
  font-size: 0.85em;
  font-weight: bold;
  margin-bottom: 4px;
}

.chat-message-content {
  white-space: pre-wrap;
  word-break: break-word;
}

/* Markdown content styles */
.chat-message-content :deep(p) {
  margin: 0 0 0.5em 0;
}

.chat-message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-message-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: monospace;
}

.chat-message-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.chat-message-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

/* Dark mode markdown styles */
body.body--dark .chat-message-content :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .chat-message-content :deep(pre) {
  background-color: rgba(255, 255, 255, 0.1);
}

.chat-history-container {
  overflow-y: auto;
  max-height: calc(100vh - 400px);
}

.left-border {
  border-left: 2px solid var(--q-primary);
}

/* Dark mode overrides */
body.body--dark .chat-user-message {
  background-color: rgba(107, 126, 214, 0.2);
  color: rgba(255, 255, 255, 0.87);
}

body.body--dark .chat-assistant-message {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}

body.body--dark .chat-system-message {
  background-color: rgba(244, 67, 54, 0.15);
  color: rgba(255, 255, 255, 0.87);
}

body.body--dark .chat-function-message {
  background-color: rgba(255, 152, 0, 0.15);
  color: rgba(255, 255, 255, 0.87);
  border-left: 3px solid rgba(255, 152, 0, 0.7);
}

body.body--dark .chat-message-header {
  color: rgba(255, 255, 255, 0.87);
}

body.body--dark .text-grey-7 {
  color: rgba(255, 255, 255, 0.6);
}

.help-text-area {
  background-color: rgba(0, 0, 0, 0.02);
  color: rgba(0, 0, 0, 0.87);
}

body.body--dark .help-text-area {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}
</style>
