<template>
  <q-card class="q-mb-lg" :class="{ 'bg-red-1': !enabled }" flat bordered>
    <q-card-section class="">
      <div class="row q-gutter-x-sm">
        <div class="col-auto q-gutter-x-xs" />
        <div class="col q-ml-sm">
          <div>
            <span class="text-subtitle1 text-weight-medium">{{ name }}</span>
          </div>
          <div>
            <span class="text-caption">{{ description }}</span>
          </div>
        </div>
        <div class="col-auto row q-ml-sm" v-if="model.canBeDeleted"><q-btn dense icon="mdi-delete-outline" color="red" flat @click="promptStore.askRemoveModel(model)" label="" class="float-right"/></div>
        <div class="col-auto row q-ml-sm">
          <q-btn dense icon="mdi-arrow-up-thin" color="primary" flat @click="promptStore.pushModelOrder(model, -1)" label="" class="float-right"/>
          <q-btn dense icon="mdi-arrow-down-thin" color="primary" flat @click="promptStore.pushModelOrder(model, 1)" label="" class="float-right"/>
        </div>

        <div class="col-auto row q-ml-sm"><q-btn icon="mdi-cog" color="primary" flat @click="settingsExpanded = !settingsExpanded" label="" class="float-right" dense/></div>
      </div>

      <q-slide-transition v-show="settingsExpanded">
        <q-card flat class="q-mt-sm">
          <q-card-section class="q-gutter-y-sm q-py-sm q-px-sm">
            <div class="row q-gutter-x-sm">
              <div class="col"><q-input dense borderless :filled="canEditModelMeta" placeholder="Name" v-model="name" label="Visible Name" :readonly="!canEditModelMeta"/></div>

              <div class="col"><q-input dense borderless label="LLM Model Name" v-model="modelName" readonly  /></div>

              <div class="col">
                <q-input dense borderless label="Inference Engine" :model-value="model.args?.inferenceEngine" readonly />
              </div>

              <div class="col-auto"><q-select v-if="model.type === 'local'" dense borderless filled label="Quants" v-model="modelQuants" :options="availableModelQuants"/></div>
            </div>

            <div class="row">
              <div class="col">
                <q-input dense borderless label="Description" v-model="description" :readonly="!canEditModelMeta" :filled="canEditModelMeta" autogrow />
              </div>
            </div>

            <div class="row bordered q-pa-sm" v-if="(user.isAnonymous ||userData.subscriptionLevel > 0) && getCloudModelApiKey(model.id, model.args.inferenceEngine)">
              <div class="col">
                <div class="row">
                  <div class="col-12">
                    <q-icon name="mdi-check" class="q-mr-xs" />
                    <span>Using custom API key: {{ getCloudModelApiKey(model.id, model.args.inferenceEngine).key }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="row bordered q-pa-sm" v-else-if="hasPrice">
              <div class="col">
                <div class="row">
                  <div class="col-2">
                    <span v-if="model.type === 'client-dall-e'">Generate 1 image</span>
                    <span v-else>Input Cost / 1M tokens</span>
                  </div>
                  <div class="col">
                    <span>{{ inputPrice }} credits</span> <HelpIcon v-if="model.type !== 'client-dall-e'" tooltip="How many credits does it cost to send 1 million tokens to the AI model."></HelpIcon>
                  </div>
                </div>

                <div class="row" v-if="model.type !== 'client-dall-e'">
                  <div class="col-2">
                    <span>Output Cost / 1M tokens </span>
                  </div>
                  <div class="col">
                    <span>{{ outputPrice }} credits</span> <HelpIcon tooltip="How many credits does it cost to receive 1 million tokens from the AI model."></HelpIcon>
                  </div>
                </div>

              </div>
            </div>

            <div class="row bordered q-pa-sm" v-if="model.type !== 'client-dall-e'">
              <div class="col">
                <div class="row">
                  <div class="col-2">
                    <span>Context Size</span>
                  </div>
                  <div class="col">
                    <span>{{ contextSize }} tokens</span> <HelpIcon tooltip="How many tokens can be sent to the AI model"></HelpIcon>
                  </div>
                </div>
              </div>
            </div>

          </q-card-section>

          <q-card-section class="q-gutter-y-sm q-px-sm">
            <template v-if="model.type === 'local' || model.type === 'client-ollama' || model.type === 'lmstudio'">

              <div class="row" v-if="false">
                <div class="col">
                  <q-select dense borderless filled label="Call type" v-model="apiCallType" :options="apiCallTypes" />
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon tooltip="Type of API to use. Recommended is Chat."></HelpIcon>
                </div>
              </div>

              <div class="row">
                <div class="col">
                  <q-input dense filled autogrow label="API URL" v-model="url" />
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon tooltip="URL to the OpenAI-compatible API."></HelpIcon>
                </div>

              </div>
            </template>

            <div class="row">
              <div class="col">
                <q-input dense filled label="Default Prompt Result Number" v-model="promptTimes" type="number" />
              </div>
              <div class="col-auto items-center flex">
                <HelpIcon :tooltip="$t('tooltips.parameters.promptTimes')"></HelpIcon>
              </div>
            </div>

            <div class="row" v-if="showPromptFormatSettings">
              <div class="col q-gutter-y-xs">
                <div class="text-subtitle2 q-mt-sm ">Default Prompt Format</div>
                <q-input dense filled label="System Prompt Prefix" v-model="defaultSystemPromptPrefix" autogrow />
                <q-input dense filled label="System Prompt Suffix" v-model="defaultSystemPromptSuffix" autogrow />
                <q-input dense filled label="User Prompt Prefix" v-model="defaultUserPromptPrefix" autogrow />
                <q-input dense filled label="User Prompt Suffix" v-model="defaultUserPromptSuffix" autogrow />
                <q-input dense filled label="Assistant Prompt Prefix" v-model="defaultAssistantPromptPrefix" autogrow />
                <q-input dense filled label="Assistant Prompt Suffix" v-model="defaultAssistantPromptSuffix" autogrow />
              </div>
              <div class="col-auto items-center flex">
                <HelpIcon :tooltip="$t('tooltips.parameters.promptFormat')"></HelpIcon>
              </div>
            </div>

            <div class="row" v-if="model.type !== 'client-dall-e'">
              <div class="col">
                <CodeEditor v-model="defaultSystemPrompt" :parameters="[]" label="Default System Prompt" />
              </div>
              <div class="col-auto items-center flex">
                <HelpIcon :tooltip="$t('tooltips.parameters.systemPrompt')"></HelpIcon>
              </div>
            </div>

            <div class="row" v-if="showPromptFormatSettings">
              <div class="col">
                <q-input dense label="Prompt Format Preview" v-model="defaultPromptFormat" readonly autogrow />
              </div>
              <div class="col-auto items-center flex">
                <HelpIcon tooltip="Preview of prompt with default system message"></HelpIcon>
              </div>
            </div>

            <template v-if="model.type === 'client-openai' || model.type === 'client-dall-e'">
              <div v-if="model.auth" >
                <q-input dense borderless filled label="API Key" v-model="apiKey" />
              </div>
            </template>

            <template v-if="model.type === 'local' || model.type === 'client-ollama' || model.type === 'lmstudio'">
              <div class="row" v-if="showStopWords">
                <div class="col">
                  <q-input dense filled label="Default Stop Strings" v-model="defaultStopStrings" autogrow />
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon :tooltip="$t('tooltips.parameters.stopStrings')"></HelpIcon>
                </div>
              </div>

              <div class="row q-gutter-x-md">
                <div class="col">
                  <q-input dense filled v-model="contextSize" label="Set Context Size"/>
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon tooltip="You can restrict context size here."></HelpIcon>
                </div>

                <div class="col">
                  <q-input dense filled autogrow label="Default Max Tokens" v-model="defaultMaxTokens" />
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon :tooltip="$t('tooltips.parameters.maxTokens')"></HelpIcon>
                </div>

                <div class="col" v-if="model.type === 'local'">
                  <q-badge>GPU Layers: {{ gpuLayers }}</q-badge>
                  <HelpIcon :tooltip="$t('tooltips.parameters.topP')"></HelpIcon>
                  <q-slider v-model="gpuLayers" :min="0" :max="maxGpuLayers" :step="1" />
                </div>
              </div>

              <div class="row q-gutter-x-md q-mt-lg">
                <div class="col">
                  <q-badge>Default Temperature: {{ defaultTemperature }}</q-badge>
                  <HelpIcon :tooltip="$t('tooltips.parameters.temperature')"></HelpIcon>
                  <q-slider v-model="defaultTemperature" :min="0" :max="1" :step="0.01" />
                </div>

                <div class="col">
                  <q-badge>Default Top P: {{ defaultTopP }}</q-badge>
                  <HelpIcon :tooltip="$t('tooltips.parameters.topP')"></HelpIcon>
                  <q-slider v-model="defaultTopP" :min="0" :max="1" :step="0.01" />
                </div>

                <div class="col" v-if="model.type === 'local'">
                  <q-badge>Default Min P: {{ defaultMinP }}</q-badge>
                  <HelpIcon :tooltip="$t('tooltips.parameters.minP')"></HelpIcon>
                  <q-slider v-model="defaultMinP" :min="0" :max="1" :step="0.01" />
                </div>

                <div class="col">
                  <q-badge>Default Top K: {{ defaultTopK }}</q-badge>
                  <HelpIcon :tooltip="$t('tooltips.parameters.topK')"></HelpIcon>
                  <q-slider v-model="defaultTopK" :min="0" :max="200" :step="1" />
                </div>
              </div>

              <div class="row q-gutter-x-md">
              </div>

              <div class="row q-gutter-x-md">

              </div>

              <div class="row q-gutter-x-md">
                <div class="col">
                  <q-badge>Default Repeat Penalty: {{ defaultRepeatPenalty }}</q-badge>
                  <HelpIcon :tooltip="$t('tooltips.parameters.repeatPenalty')"></HelpIcon>
                  <q-slider v-model="defaultRepeatPenalty" :min="0" :max="2" :step="0.05" />
                </div>


                <div class="col">
                  <q-badge>Default Frequency Penalty: {{ defaultFrequencyPenalty }}</q-badge>
                  <HelpIcon :tooltip="$t('tooltips.parameters.frequencyPenalty')"></HelpIcon>
                  <q-slider v-model="defaultFrequencyPenalty" :min="0" :max="1" :step="0.01" />
                </div>

                <div class="col">
                  <q-badge>Default Presence Penalty: {{ defaultPresencePenalty }}</q-badge>
                  <HelpIcon :tooltip="$t('tooltips.parameters.presencePenalty')"></HelpIcon>
                  <q-slider v-model="defaultPresencePenalty" :min="0" :max="1" :step="0.01" />
                </div>
              </div>
            </template>

            <template v-if="model.type === 'automatic1111-sd'">
              <div class="row">
                <div class="col">
                  <q-input dense filled autogrow label="API URL" v-model="url" />
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon tooltip="URL to the AUTOMATIC1111 API."></HelpIcon>
                </div>
              </div>
            </template>


          </q-card-section>
        </q-card>
      </q-slide-transition>
    </q-card-section>
  </q-card>
</template>

<script setup>
import {usePromptStore} from "stores/prompt-store";
import {computed, ref} from "vue";
import HelpIcon from "components/Common/HelpIcon.vue";
import {applyPromptFormatPrefixSuffix} from "src/common/helpers/promptHelper";
import {useLayoutStore} from "stores/layout-store";
import {formatNumber} from "src/common/utils/textUtils";
import CodeEditor from "components/Common/Editors/CodeEditor.vue";
import {getCloudModelApiKey} from "src/common/utils/modelUtils";
import {useCurrentUser} from "vuefire";

const promptStore = usePromptStore();
const layoutStore = useLayoutStore();

const props = defineProps({
  model: {
    type: Object,
    required: true,
  },
});

const settingsExpanded = ref(false);

const showPromptFormatSettings = computed(() => {
  return (props.model.type === 'local' || props.model.type === 'client-ollama') && props.model.args?.apiCallType === 'raw';
});

const showStopWords = computed(() => {
  return (props.model.type === 'local' || props.model.type === 'client-ollama' || props.model.type === 'lmstudio') && props.model.args?.apiCallType === 'raw';
});

const user = useCurrentUser();

const userData = computed(() => layoutStore.userData);

//const localModelTypes = [ 'local', 'client-ollama'];
//const localInferenceEngines = [ 'default', 'ollama' ];

const name = computed({
  get: () => props.model.name,
  set: (value) => {
    promptStore.updateModel(props.model, {name: value});
  }
});

const modelName = computed({
  get: () => props.model.modelName,
  set: (value) => {
    promptStore.updateModel(props.model, {modelName: value});
  }
});

const canEditModelMeta = computed(() => {
  return props.model.type === 'local' || props.model.type === 'client-ollama' || props.model.type === 'lmstudio';
});

const hasPrice = computed(() => {
  const localModel = props.model.type === 'local' || props.model.type === 'client-ollama' || props.model.type === 'lmstudio';
  return localModel === false;
});

const inputPrice = computed(() => {
  const modelData = layoutStore.getModelData(props.model.modelName);
  if(!modelData || modelData.inputPrice < 0) {
    return "N/A";
  }

  return formatNumber(modelData.inputPrice);
});

const outputPrice = computed(() => {
  const modelData = layoutStore.getModelData(props.model.modelName);
  if(!modelData || modelData.outputPrice < 0) {
    return "N/A";
  }

  return formatNumber(modelData.outputPrice);
});

const description = computed({
  get: () => props.model.description,
  set: (value) => {
    promptStore.updateModel(props.model, {description: value});
  }
});

const modelQuants = computed({
  get: () => props.model.modelQuants,
  set: (value) => {
    promptStore.updateModel(props.model, {modelQuants: value});
  }
});

const type = computed({
  get: () => props.model.type,
  set: (value) => {
    promptStore.updateModel(props.model, {type: value});
  }
});

const inferenceEngine = computed({
  get: () => props.model.args?.inferenceEngine ?? "default",
  set: (value) => {
    promptStore.updateModel(props.model, {inferenceEngine: value});
  }
});

const availableModelQuants = computed(() => {
  return props.model.availableModelQuants ?? [];
});

const apiKey = computed({
  get: () => props.model.auth.apiKey,
  set: (value) => {
    promptStore.updateModel(props.model, {apiKey: value});
  }
});

const enabled = computed({
  get: () => props.model.enabled,
  set: (value) => {
    promptStore.updateModel(props.model, {enabled: value});
  }
});

const defaultSystemPrompt = computed({
  get: () => props.model.defaultSystemPrompt,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultSystemPrompt: value});
  }
});

/*const defaultPromptFormat = computed({
  get: () => props.model.defaultPromptFormat,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultPromptFormat: value});
  }
});*/

const defaultPromptFormat = computed(() => {
  return applyPromptFormatPrefixSuffix(defaultSystemPromptPrefix.value, defaultSystemPromptSuffix.value, defaultSystemPrompt.value ?? "$systemMessage", defaultUserPromptPrefix.value, defaultUserPromptSuffix.value, "$userPrompt", defaultAssistantPromptPrefix.value, defaultAssistantPromptSuffix.value);
});

const defaultSystemPromptPrefix = computed({
  get: () => props.model.defaultSystemPromptPrefix,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultSystemPromptPrefix: value});
  }
});

const defaultSystemPromptSuffix = computed({
  get: () => props.model.defaultSystemPromptSuffix,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultSystemPromptSuffix: value});
  }
});

const defaultUserPromptPrefix = computed({
  get: () => props.model.defaultUserPromptPrefix,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultUserPromptPrefix: value});
  }
});

const defaultUserPromptSuffix = computed({
  get: () => props.model.defaultUserPromptSuffix,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultUserPromptSuffix: value});
  }
});

const defaultAssistantPromptPrefix = computed({
  get: () => props.model.defaultAssistantPromptPrefix,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultAssistantPromptPrefix: value});
  }
});

const defaultAssistantPromptSuffix = computed({
  get: () => props.model.defaultAssistantPromptSuffix,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultAssistantPromptSuffix: value});
  }
});

const url = computed({
  get: () => props.model.args?.url ?? '',
  set: (value) => {
    promptStore.updateModel(props.model, {url: value});
  }
});

const apiCallTypes = [ 'chat', 'raw' ];

const apiCallType = computed({
  get: () => props.model.args?.apiCallType ?? '',
  set: (value) => {
    promptStore.updateModel(props.model, {apiCallType: value});
  }
});

const promptTimes = computed({
  get: () => props.model.promptTimes,
  set: (value) => {
    promptStore.updateModel(props.model, {promptTimes: value});
  }
});

const defaultStopStrings = computed({
  get: () => props.model.defaultStopStrings,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultStopStrings: value});
  }
});

const defaultTemperature = computed({
  get: () => props.model.defaultTemperature,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultTemperature: value});
  }
});

const defaultMaxTokens = computed({
  get: () => props.model.defaultMaxTokens,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultMaxTokens: value});
  }
});

const defaultTopP = computed({
  get: () => props.model.defaultTopP,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultTopP: value});
  }
});

const defaultMinP = computed({
  get: () => props.model.defaultMinP,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultMinP: value});
  }
});

const defaultTopK = computed({
  get: () => props.model.defaultTopK,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultTopK: value});
  }
});

const defaultRepeatPenalty = computed({
  get: () => props.model.defaultRepeatPenalty,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultRepeatPenalty: value});
  }
});

const defaultFrequencyPenalty = computed({
  get: () => props.model.defaultFrequencyPenalty,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultFrequencyPenalty: value});
  }
});

const defaultPresencePenalty = computed({
  get: () => props.model.defaultPresencePenalty,
  set: (value) => {
    promptStore.updateModel(props.model, {defaultPresencePenalty: value});
  }
});

const contextSize = computed({
  get: () => props.model.contextSize,
  set: (value) => {
    promptStore.updateModel(props.model, {contextSize: value});
  }
});

const gpuLayers = computed({
  get: () => props.model.gpuLayers,
  set: (value) => {
    promptStore.updateModel(props.model, {gpuLayers: value});
  }
});

const maxGpuLayers = computed(() => {
  return props.model.maxGpuLayers;
});


</script>

<style scoped>

</style>
