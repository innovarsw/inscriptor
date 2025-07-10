<template>
  <div class="q-mx-md">

    <div class="column full-height">

      <div class="col-auto">
        <div v-if="promptStore.isPrompting && !promptStore.isSilentPrompting" class="menu-subtitle q-mb-lg">
          <q-spinner-ios></q-spinner-ios> generating prompts...
          <q-btn dense outline @click="promptStore.stopPrompt" label="Abort" size="sm" class="no-margin q-py-none" color="red"/>
        </div>
      </div>

      <div class="col-auto">
        <div class="flex justify-center q-mb-md"  v-if="maxResultsPage > 0">
          <div class="col-auto flex items-center"  v-if="maxResultsPage > 0">
            <q-pagination :max="maxResultsPage" v-model="page" direction-links :boundary-links="false" />
          </div>

          <div class="col">

          </div>

          <div class="col-auto flex items-center q-mr-sm">
            <q-btn color="accent" @click="newConversation" size="md" icon="mdi-pencil-box-outline" class="" label="New chat">
              <q-tooltip>
                Start a new conversation with AI model
              </q-tooltip>
            </q-btn>
          </div>

          <div class="col-auto flex items-center">
            <q-btn flat color="negative" icon="mdi-delete-outline" size="md">
              <q-menu>
                <q-list dense>
                  <q-item clickable @click="removeConversation" v-close-popup>
                    <q-item-section side>
                      <q-icon name="mdi-close" />
                    </q-item-section>
                    <q-item-section>
                      Remove current conversation
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="removeAllConversations">
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
          <q-btn color="accent" @click="newConversation" size="md" icon="mdi-chat-plus" class="" label="New chat with AI">
            <q-tooltip>
              Start a new conversation with AI model of your choice
            </q-tooltip>
          </q-btn>
        </div>
      </div>

      <div class="col">
        <div class="q-gutter-y-sm q-ml-xs chat-history-container" style="margin-bottom: 100px;">
          <div class="chat-messages-container-unhinged">
            <template v-for="(promptResult, index) in results" :key="index">
              <PromptResult :promptResult="promptResult" :show-as-chat="true" :allow-regenerate="index === results.length - 1"/>
            </template>
          </div>
        </div>
      </div>

      <div class="col">
        <div class="full-width" style="position: absolute; bottom: 0; right: 0; z-index: 1000" >
          <div class="q-mr-lg bg-theme-primary">
            <div class="" >

              <div class="text-caption q-pa-md q-pb-sm q-pt-sm text-grey-7 left-border" v-if="results.length === 0">

                <div class="bordered q-pa-sm bg-grey-1">
                  <q-icon name="mdi-lightbulb-outline" class="text-accent q-mb-xs" />
                    Tip:
                  <div>
                    'Ctrl + Enter' to chat without providing additional context.
                  </div>
                  <div>
                    'Shift + Enter' to add new line.
                  </div>
                </div>

              </div>

              <div class="row left-border">
                <div class="col q-ml-sm rounded-borders q-px-sm">
                  <q-input v-model="promptText" :label="'Write message to AI...'" borderless class="full-width" rows="4" type="textarea" lines dense ref="searchRef" @keydown="onInputKey">
                  </q-input>
                </div>
                <div class="col-auto q-ml-sm">
                  <div class="column">
                    <div class="col">
                      <q-btn icon="mdi-reply-outline" color="accent" @click="sendChat()" :disable="promptForChatId === null" />
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
                      <q-select v-model="modelForChatId" filled dense options-dense label="Model used for chat" :options="models" />
                    </div>
                    <div class="col q-ml-xs">
                      <q-select v-model="promptForChatId" filled dense options-dense label="Prompt used for chat" :options="prompts" />
                    </div>
                  </div>
                  <div class="row q-gutter-x-xs">
                    <q-checkbox v-model="chatWithContext" label="Enable appending Context to chat" />
                    <!--<q-checkbox v-model="overrideSystemPrompt" label="Override System Prompt instructions" />-->
                  </div>
                  <div class="row" v-if="overrideSystemPrompt">
                    <q-input filled v-model="layoutStore.chatSystemPromptText" :label="'Override System prompt...'" class="full-width" />
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

import {usePromptStore} from "stores/prompt-store";
import {computed, ref} from "vue";
import {Dialog} from "quasar";
import {executePromptClick2} from "src/common/helpers/promptHelper";
import PromptResult from "components/RightMenu/PromptResult.vue";
import {useLayoutStore} from "stores/layout-store";
import {chatTabId} from 'src/common/resources/tabs';

const promptStore = usePromptStore();
const layoutStore = useLayoutStore();

const promptText = ref('');

const settingsOpen = ref(false);

const results = computed(() => {
  const index = promptStore.getTabData(chatTabId)?.promptResultsIndex ?? 0;
  return promptStore.getTabData(chatTabId)?.promptResultsHistory[index] ?? [];
});

const maxResultsPage = computed(() => {
  return promptStore.getTabData(chatTabId)?.promptResultsHistory.length ?? 0;
});

const page = computed({
  get: () => (promptStore.getTabData(chatTabId)?.promptResultsIndex ?? 0) + 1,
  set: (value) => {
    promptStore.setCurrentTabResultsIndex(chatTabId, value - 1);
  }
});

async function onInputKey(e) {
  if(!e) return;

  if(e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
    if (promptText.value.length > 0) {
      e.stopPropagation();
      e.preventDefault();

      await sendChat();
    }
  }
}

async function sendChat() {
  if(promptForChatId.value === null) {
    return;
  }

  const prompt = promptStore.prompts.find(p => p.id === promptForChatId.value.value);

  if(!prompt) {
    return;
  }

  const textCopy = promptText.value;
  promptText.value = '';

  let messages = [];

  const appendContext = [];

  for (const chatResultText of results.value) {
    messages.push({type: 'user', text: chatResultText.input});
    messages.push({type: 'assistant', text: chatResultText.text});

    if(chatResultText.contextTypes) {
      for (const ct of chatResultText.contextTypes) {
        if(!appendContext.find(c => c.id === ct.id)) {
          appendContext.push(ct);
        }
      }
    }
  }

  const showMoreContextWindow = results.value.length === 0 && chatWithContext.value;

  messages.push({type: 'user', text: textCopy});

  const request = {
    prompt: prompt,
    text: messages,
    clear: false,
    forceBypassMoreParameters: false,
    silent: false,
    forceShowContextSelection: showMoreContextWindow
  };

  await executePromptClick2(request);
}

const models = computed(() => promptStore.models.map(tab => ({label: tab.name, value: tab.id})));

const modelForChatId = computed({
  get: () => {
    const t = promptStore.getModel(promptStore.currentModelForChatId);
    if(!t) return null;
    return {
      label: t.name,
      value: t.id,
    };
  },
  set: (value) => {
    console.log(value);
    promptStore.currentModelForChatId = value.value;

    promptStore.currentPromptForChatId = null;
    if(promptStore.currentPromptForChatId === null) {
      // find first prompt of promptType === 'chat'
      promptStore.currentPromptForChatId = promptStore.prompts.find(p => p.modelId === promptStore.currentModelForChatId && p.promptType === 'chat')?.id;
    }

    updateSystemPromptText();
  }
});

const prompts = computed(() => promptStore.prompts.filter(p => p.modelId === promptStore.currentModelForChatId && p.promptType === 'chat')
  .map(prompt => ({label: prompt.title, value: prompt.id})));

const chatWithContext = ref(true);
const overrideSystemPrompt = ref(false);

const promptForChatId = computed({
  get: () => {
    const t = promptStore.prompts.find(p => p.id === promptStore.currentPromptForChatId);
    if(!t) return null;
    return {
      label: t.title,
      value: t.id,
      systemPrompt: t.systemPrompt,
    };
  },
  set: (value) => {
    promptStore.currentPromptForChatId = value.value;

    updateSystemPromptText();

    console.log(promptStore.currentPromptForChatId);
  }
});

if(!layoutStore.chatSystemPromptText) {
  updateSystemPromptText();
}

function updateSystemPromptText() {
  layoutStore.chatSystemPromptText = promptForChatId?.value?.systemPrompt ?? null;
}

function newConversation() {
  promptStore.newPromptResultsHistory(chatTabId);

  updateSystemPromptText();
}

function removeConversation() {
  promptStore.removePromptResultsHistoryItem(chatTabId, promptStore.getTabData(chatTabId)?.promptResultsIndex ?? null);
}

function removeAllConversations() {

  Dialog.create(
    {
      title: 'Confirm',
      message: 'Are you sure you want to delete whole prompt history?',
      cancel: true,
      persistent: true
    }).onOk(() => {
    promptStore.clearPromptHistory(chatTabId);
  }).onCancel(() => {
  }).onDismiss(() => {
    }
  )
}

</script>

<style scoped>

</style>
