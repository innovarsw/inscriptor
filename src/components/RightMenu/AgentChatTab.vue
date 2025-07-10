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

          <!-- Current file indicator -->
          <div class="col flex items-center justify-center">
            <div v-if="currentFile" class="file-indicator q-mb-sm">
              <q-icon :name="currentFile.icon" class="text-primary q-mr-xs" size="xs" />
              <span class="text-caption text-grey-7">{{ currentFile.title }} chat</span>
            </div>
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
            <div v-for="message in currentChatMessages" :key="message.id" class="full-width">
              <!-- Display message content -->
              <AgentPromptResult
                :message="message"
                :tool-call-results="toolCallResults"
              />

              <!-- Display tool calls separately with assistant styling -->
              <div v-if="message.toolCalls && message.toolCalls.length > 0" class="q-mt-sm">
                <div v-for="(toolCall, index) in message.toolCalls" :key="index" class="tool-call-container q-mb-sm">
                  <ToolCallDisplay
                    :toolCall="toolCall"
                    :toolResult="getToolResult(toolCall)"
                  />
                </div>
              </div>
            </div>

            <!-- Loading indicator when agent is processing -->
            <AgentPromptResult
              v-if="aiAgentStore.agentChats.isAgentRunning"
              :is-loading="true"
              :loading-text="aiAgentStore.agentState === 'waiting_for_user' ? 'Waiting for approval' : 'Thinking'"
              :tool-call-results="toolCallResults"
            />
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
import AgentPromptResult from './AgentPromptResult.vue';
import AnimatedDots from 'src/components/Common/AnimatedDots.vue';

const aiAgentStore = useAiAgentStore();
const promptStore = usePromptStore();
const fileStore = useFileStore();

const inputText = ref('');
const inputRef = ref(null);
const settingsOpen = ref(false);

// Computed properties
const currentChat = computed(() => aiAgentStore.getActiveAgentChat());

const currentFile = computed(() => fileStore.selectedFile);

const currentChatMessages = computed(() => {
  const messages = currentChat.value?.messages || [];
  // Filter out hidden messages (initial system and user prompts)
  return messages.filter(msg => !msg.hidden);
});

// Create a map of tool call IDs to their results
const toolCallResults = computed(() => {
  const messages = currentChat.value?.messages || [];
  const results = new Map();

  messages.forEach(msg => {
    if (msg.role === 'function' && msg.toolCallId) {
      results.set(msg.toolCallId, msg.content);
    }
  });

  return results;
});

// Enhanced function to get tool result for a specific tool call
function getToolResult(toolCall) {
  if (!toolCall?.id) return null;
  return toolCallResults.value.get(toolCall.id) || null;
}

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
.chat-history-container {
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}

.left-border {
  border-left: 2px solid var(--q-primary);
}

.help-text-area {
  background-color: rgba(0, 0, 0, 0.02);
  color: rgba(0, 0, 0, 0.87);
}

body.body--dark .help-text-area {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}

.file-indicator {
}

body.body--dark .file-indicator {
}

.tool-call-container {
  max-width: 80%;
  margin-right: auto;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 4px;
  border-radius: 8px;
}

.tool-call-container :deep(.q-card) {
  background-color: transparent;
  border: none;
  box-shadow: none;
}

body.body--dark .tool-call-container {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}
</style>
