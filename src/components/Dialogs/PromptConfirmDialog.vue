<template>
  <q-dialog v-model="promptPreviewShown">
    <q-card style="min-width: 800px;">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ prompt.title }} prompt preview</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <template v-for="(textMessage, index) in [...promptPreview.textMessages]" :key="index">
        <q-card-section>
          <div class="text-subtitle2 row">
            <div class="col">
              {{ textMessage.type }} message:
            </div>
            <div class="col-auto">
              <q-btn class="q-ml-sm" flat dense icon="mdi-dots-horizontal" size="10px" >
                <q-menu anchor="center middle">
                  <q-list dense>
                    <q-item
                      @click="textMessage.type = 'system'"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Set as 'system' message</q-item-section>
                    </q-item>
                    <q-item
                      @click="textMessage.type = 'user'"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Set as 'user' message</q-item-section>
                    </q-item>
                    <q-item
                      @click="textMessage.type = 'assistant'"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Set as 'assistant' (AI) message</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item
                      @click="moveTextMessage(textMessage, -1)"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Move Up</q-item-section>
                    </q-item>
                    <q-item
                      @click="moveTextMessage(textMessage, 1)"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Move Down</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item
                      @click="promptPreview.textMessages.splice(index, 1)"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Delete message</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
                <q-tooltip>
                  Edit this message
                </q-tooltip>
              </q-btn>
            </div>
          </div>
          <div class="text bordered write-serif" style="max-height: 400px; overflow-y: auto">
            <q-input v-model="textMessage.text" dense filled autogrow />
          </div>
        </q-card-section>
      </template>
      <div class="text-center">
        <q-btn class="q-ml-md text-grey-7" unelevated dense icon="mdi-plus" size="10px" style="width: 100px" >
          <q-menu>
            <q-list dense>
              <q-item
                @click="addMessage('system')"
                dense
                clickable
                v-close-popup
              >
                <q-item-section>Add 'system' message</q-item-section>
              </q-item>
              <q-item
                @click="addMessage('user')"
                dense
                clickable
                v-close-popup
              >
                <q-item-section>Add 'user' message</q-item-section>
              </q-item>
              <q-item
                @click="addMessage('assistant')"
                dense
                clickable
                v-close-popup
              >
                <q-item-section>Add 'assistant' (AI) message</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <q-tooltip>
            Add custom message
          </q-tooltip>
        </q-btn>
      </div>
      <q-card-section>
        <div class="text-subtitle2">AI response:</div>
        <div class="text bordered q-pa-sm bg-yellow-1 write-serif">
          <div class="">
            <div class="row q-gutter-x-md q-mb-md">
              <div class="col">
                <q-select filled dense label="AI model" :options="models" v-model="model" option-label="name" option-value="id" options-dense />
              </div>
              <div class="col">
                <q-select filled dense label="Creativity" :options="creativityOptions" v-model="creativity" options-dense >
                  <template v-slot:prepend>
                    <q-icon :name="creativity.icon" v-if="creativity.icon" />
                  </template>
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-icon v-if="scope.opt.icon" :name="scope.opt.icon" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>

            <div class="q-mb-md"><q-icon name="mdi-creation-outline q-mb-xs" />  Cost estimation (using {{ model.name }})</div>

            <div class="text-bold">≈ {{ promptPreviewEstimateCost.inputCost }} for {{ promptPreviewEstimateCost.inputTokens }} input tokens</div>

            <div class="text-subtitle2 text-bold q-mt-md"></div>
            <div class="text-caption">final cost depends on what AI generates: {{ promptPreviewEstimateCost.outputCost }}</div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions class="text-primary">
        <div class="col-auto">
        </div>
        <div class="col">

        </div>
        <div class="col-auto">
          <q-btn color="accent" icon="mdi-creation-outline" label="Run Prompt" v-close-popup @click="confirmPrompt(true)" class="float-right" :disable="!canConfirmPrompt"/>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="promptStore.promptParametersShown">
    <q-card style="min-width: 700px">
      <q-card-section class="row items-center q-px-md q-pt-md q-pb-sm">
        <div class="text-h6 bg-accent text-white text-aleo q-px-md q-py-xs rounded-borders full-width row items-center">
          <q-icon name="mdi-creation-outline" class="q-mr-sm" />
          {{ prompt.title }}&nbsp;
          <span v-if="!request.agent">prompt</span>
          <span v-else>agent</span>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </div>
        <q-tooltip class="q-px-md text-italic" v-if="prompt.description">
          Prompt Description: {{ prompt.description }}
        </q-tooltip>
      </q-card-section>

      <q-card-section class="q-py-sm q-px-md" v-if="prompt.guide && prompt.guide.length > 0">
        <div class="q-px-md text-italic" >
          Tip: {{ prompt.guide }}
        </div>
      </q-card-section>

      <q-card-section class="q-px-md q-pb-none" v-if="promptVariablesIncluded.length > 0">
        <div class="row q-px-md text-grey-7 text-weight-regular">
          <div class=" flex items-center"><q-icon name="mdi-check" class="q-mr-xs" />Prompt Includes:</div>
          <template v-if="request.agent">
            <q-chip color="transparent" text-color="grey-7">
              All paragraphs starting with "{{ request.agent.searchPrefix }}" in the current file, processed one by one.
            </q-chip>
          </template>
          <template v-else>
            <template v-for="variable in promptVariablesIncluded" :key="variable">
              <q-chip color="transparent" text-color="grey-7">
                {{ variable }}
              </q-chip>
            </template>
          </template>
        </div>
      </q-card-section>


      <template v-if="prompt.info?.tags?.includes('input')">
        <q-separator class="q-mt-sm" />
        <q-card-section class="q-px-md q-pt-sm">

          <div class="bordered rounded-borders q-mt-sm" flat :class="{'bg-grey-1': request.agent}">
            <div class="cursor-pointer context-selector q-px-md q-py-md">
              <div class="row">
                <div class="col text-subtitle2 flex items-center"><q-icon name="mdi-import" class="q-mr-xs" />Input</div>
                <div class="col-auto" v-if="!request.agent"><q-icon name="keyboard_arrow_down" size="sm" /></div>
              </div>

              <template v-if="request.agent">
                <div class="text-italic">
                  All paragraphs starting with "{{ request.agent.searchPrefix }}" in the current file, processed one by one.
                </div>
              </template>
              <template v-else-if="promptStore.promptUserInputs?.length > 0 ?? false">
                <template v-for="input in promptStore.promptUserInputs" :key="input.id">
                  <q-chip :color="input.color + '-3'" removable @remove="removeInput(input)">
                    {{ input.label }}
                    &nbsp;<q-badge :color="inputWarning(input).color" v-if="inputWarning(input)">
                      <q-icon name="error" />&nbsp;
                      {{ inputWarning(input).warning }}
                    </q-badge>
                    <q-tooltip color="primary" >
                      {{ input.description }}
                    </q-tooltip>
                  </q-chip>
                </template>
              </template>
              <template v-else>
                <div>
                  No input provided to the prompt
                </div>
              </template>

              <q-popup-proxy >
                <q-card style="width: 668px">
                  <q-card-section class="no-padding">
                    <div class="row">
                      <div class="col q-pa-md">
                        <div class="row">
                          <div class="col-auto">
                            <q-chip :text-color="getInputChipFontColor(selectedTextPromptInput)" :color="getInputChipColor(selectedTextPromptInput)" :icon="getInputChipIcon(selectedTextPromptInput)" :clickable="isInputAllowedForThisPrompt(selectedTextPromptInput)" @click="toggleInput(selectedTextPromptInput)" >
                              {{ selectedTextPromptInput.label }} &nbsp;
                              <q-tooltip color="primary">
                                <div>include selected text</div>
                                <div>
                                  <q-badge :color="inputWarning(selectedTextPromptInput).color" v-if="inputWarning(selectedTextPromptInput)">
                                    {{ inputWarning(selectedTextPromptInput).warning }}
                                  </q-badge>
                                </div>
                              </q-tooltip>
                            </q-chip>
                          </div>
                          <div class="col-auto">
                            <q-chip :text-color="getInputChipFontColor(currentFilePromptInput)" :color="getInputChipColor(currentFilePromptInput)" :icon="getInputChipIcon(currentFilePromptInput)" :clickable="isInputAllowedForThisPrompt(currentFilePromptInput)" @click="toggleInput(currentFilePromptInput)" >
                              {{ currentFilePromptInput.label }} &nbsp;
                              <q-tooltip color="primary">
                                <div>include all text from {{ currentFile?.title }}</div>
                                <div>
                                  <q-badge :color="inputWarning(currentFilePromptContext).color" v-if="inputWarning(currentFilePromptContext)">
                                    {{ inputWarning(currentFilePromptContext).warning }}
                                  </q-badge>
                                </div>
                              </q-tooltip>
                            </q-chip>

                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

              </q-popup-proxy>

            </div>
          </div>
        </q-card-section>
      </template>



      <template v-if="prompt.info?.tags?.includes('context')">
        <q-card-section class="q-px-md q-pt-sm">
          <PromptContextSelector :prompt="prompt" />
        </q-card-section>
      </template>

      <template v-if="promptStore.promptParametersValue && promptStore.promptParametersValue.length > 0">
        <q-card-section class="q-pt-none q-gutter-y-md q-mt-sm" >
          <div v-for="parameter in promptStore.promptParametersValue" :key="parameter.name">
            <template v-if="parameter.type === 'Select'">
              <q-select dense filled v-model="parameter.value" :options="parameter.values" :label="parameter.name"></q-select>
            </template>
            <template v-if="parameter.type === 'Select (advanced)'">
              <q-select dense filled v-model="parameter.value" :options="parameter.values" :label="parameter.name"></q-select>
            </template>
            <template v-if="parameter.type === 'Text'">
              <p class="text-subtitle2 q-mb-none" v-if="parameter.hint?.length > 0 ?? false">
                {{ parameter.hint }}
                <span v-if="parameter.required" class="text-red-4">*</span>
              </p>
              <p class="text-bold text-grey-7 q-mb-none" v-else>
                ${{ parameter.name }}:
                <span v-if="parameter.required" class="text-red-4">*</span>
              </p>

              <div class="row">
                <div class="col">
                  <CodeEditor v-model="parameter.value" :parameters="[]"/>
                </div>
                <div  v-if="parameter.examples && parameter.examples.length > 0" class="col-auto q-ml-sm flex items-center">
                  <q-btn
                    class="text-secondary"
                    no-caps
                    dense
                    icon-right="expand_more"
                    flat
                    label="Examples">
                    <q-popup-proxy>
                      <q-card style="width: 400px;">
                        <q-card-section>
                          <template v-for="(text, index) in separateTextByComma(parameter.examples)" :key="index">
                            <q-chip class="text-caption" :label="text" dense clickable @click="parameter.value = text" color="blue-grey-1">
                            </q-chip>
                          </template>
                        </q-card-section>
                      </q-card>
                    </q-popup-proxy>

                  </q-btn>
                </div>
              </div>
            </template>
          </div>
        </q-card-section>
      </template>

      <template v-if="model.args?.inferenceEngine === 'translation'">
        <q-card-section >
          <div class="row q-gutter-x-sm">
            <div class="col">
              <q-select v-model="promptStore.promptSourceLanguage" :options="sourceLanguages" label="Source Language" filled dense clearable :hint="sourceLanguageHint" @focus="enterConfirms.value = false" @blur="enterConfirms.value = true">
                <template v-slot:prepend>
                  <q-icon name="mdi-translate" />
                </template>
              </q-select>
            </div>
            <div class="col">
              <q-select v-model="promptStore.promptTargetLanguage" :options="targetLanguages" label="Target Language" filled dense  @focus="enterConfirms.value = false" @blur="enterConfirms.value = true">
                <template v-slot:prepend>
                  <q-icon name="mdi-translate" />
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
      </template>

      <q-separator />

      <q-card-actions class="text-primary">

        <div class="col-auto">
          <q-select filled dense label="AI model" :options="models" v-model="model" option-label="name" option-value="id" options-dense />
        </div>
        <div class="col">
        </div>
        <div class="col-auto q-mr-md" v-if="!request.agent">
          <q-btn flat label="Preview & Cost" color="secondary" @click="previewPrompt" class="float-left" :disable="!canConfirmPrompt"/>
        </div>
        <div class="col-auto">
          <q-btn color="accent" :icon="request.agent ? 'mdi-robot-outline' : 'mdi-creation-outline'" :label="request.agent ? 'Run Agent' : 'Run Prompt'" v-close-popup @click="confirmPrompt(false)" class="float-right" :disable="!canConfirmPrompt" autofocus/>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {usePromptStore} from "stores/prompt-store";
  import {executeConfirmPrompt2} from "src/common/helpers/promptHelper";
  import {computed, ref} from "vue";
  import {convertHtmlToText, removeHtmlTags, tokenise, truncate} from "src/common/utils/textUtils";
  import {useFileStore} from "stores/file-store";
  import CodeEditor from "components/Common/Editors/CodeEditor.vue";
  import {
    currentAndChildrenFilePromptContext,
    currentAndChildrenFileSummaryPromptContext,
    currentFilePromptContext, currentFilePromptInput, currentFileSummaryPromptContext, previousCharactersPromptContext,
    selectedTextPromptContext, selectedTextPromptInput
  } from "src/common/resources/promptContexts";
  import {useLayoutStore} from "stores/layout-store";
  import {Dialog} from "quasar";
  import {variables as fileVariables} from "src/common/resources/variables";
  import {getCloudModelApiKey} from "src/common/utils/modelUtils";
  import {onKeyStroke} from "@vueuse/core";
  import {getEditor, getEditorSelection} from "src/common/utils/editorUtils";
  import PromptContextSelector from 'components/Common/PromptSelector/PromptContextSelector.vue';

  const promptStore = usePromptStore();
  const fileStore = useFileStore();
  const layoutStore = useLayoutStore();

  const enterConfirms = ref(false);

  const request = computed(() => promptStore.currentPromptConfirmationRequest);
  const prompt = computed(() => promptStore.currentPromptConfirmationRequest.prompt);
  const model = computed({
    get () {
      return promptStore.getModel(request.value.forceModelId ?? prompt.value.modelId);
    },
    set (value) {
      request.value.forceModelId = value.id;
    }
  });

  const creativity = computed({
    get () {
      const temperature = request.value.forceTemperature;

      if(temperature !== undefined && temperature !== null) {
        return creativityOptions.find(c => c.value === temperature);
      } else {
        return creativityOptions[0];
      }
    },
    set (value) {
      request.value.forceTemperature = value.id;
    }
  });

  const models = computed(() => promptStore.models);
  const creativityOptions = [
    {label: 'Default', value: null, icon: null},
    {label: 'Very Creative (temperature 1)', value: 1, icon: 'mdi-palette'},
    {label: 'Creative (temperature 0.8)', value: 0.8, icon: 'mdi-palette-outline'},
    {label: 'Deterministic (temperature 0.5)', value: 0.5, icon: 'mdi-keyboard-outline'},
    {label: 'Very Deterministic (temperature 0)', value: 0, icon: 'mdi-keyboard'},
  ]

  const userData = computed(() => {
    return layoutStore.userData;
  });

  const sourceLanguageHint = computed(() => {
    if(promptStore.promptSourceLanguage) {
      return '';
    }
    return 'Source language will be detected automatically.';
  })

  const currentFile = computed(() => {
    return fileStore.selectedFile;
  });

  const sourceLanguages = computed(() => {
    return model.value.args?.sourceLanguages ?? [];
  });

  const targetLanguages = computed(() => {
    return model.value.args?.targetLanguages ?? [];
  });

  const promptVariablesIncluded = computed(() => {
    const variables = [];

    // find all $[variables] with regex
    const regex = /\$[a-zA-Z0-9]+/g;
    const text = prompt.value.userPrompt + ' ' + prompt.value.systemPrompt;

    let match;
    while ((match = regex.exec(text)) !== null) {
      // except $context
      if(match[0] === '$context' || match[0] === '$input' || match[0] === '$chat') {
        continue;
      }

      /*if(prompt.value.parameters.find(p => p.name === match[0].substring(1))) {
        continue;
      }*/

      // distinct
      if(!variables.includes(match[0].substring(1))) {
        const v = fileVariables.find(v => v.label === match[0]);
        if(v) {
          variables.push(v.info);
        }
      }
    }

    return variables;
  });

  function separateTextByComma(text) {
    return text.split(',')?.map(t => t.trim()) ?? [];
  }

  const canConfirmPrompt = computed(() => {
    for (const parameter of promptStore.promptParametersValue) {
      if (parameter.required) {
        if(parameter.value?.value !== undefined) {
          if(convertHtmlToText(parameter.value.value).trim() === '') {
            return false;
          }
        } else if(!parameter.value || convertHtmlToText(parameter.value).trim() === '') {
          return false;
        }
      }
    }

    return true;
  });

  async function confirmPrompt(forceInput) {
    if (!canConfirmPrompt.value) {
      return;
    }

    promptStore.promptParametersShown = false;
    const request = promptStore.currentPromptConfirmationRequest;

    if(forceInput) {
      request.previewOnly = false;
      request.forceInput = promptPreview.value;

      await executeConfirmPrompt2(request);
    } else {
      await executeConfirmPrompt2(request);
    }
  }

  async function previewPrompt() {
    if (!canConfirmPrompt.value) {
      return;
    }

    const request = promptStore.currentPromptConfirmationRequest;
    request.previewOnly = true;

    const input = await executeConfirmPrompt2(request);

    promptPreview.value = input;
    promptPreviewShown.value = true;
  }

  const promptPreview = computed({
    get () {
      return layoutStore.promptPreview;
    },
    set (value) {
      layoutStore.promptPreview = value;
    }
  });

  const promptPreviewShown = computed({
    get () {
      return layoutStore.promptPreviewShown;
    },
    set (value) {
      layoutStore.promptPreviewShown = value;
    }
  });

  function toggleInput(input, parametersValue = undefined) {
    if (containsInput(input)) {
      removeInput(input);
    } else {
      addInput(input, parametersValue);
    }
  }

  function containsInput(input) {
    return promptStore.promptUserInputs.some(c => c.id === input.id);
  }

  function isInputAllowedForThisPrompt(input) {
    if(input === selectedTextPromptInput) {
      const selection = getEditorSelection();

      if(!selection || selection.empty === true) {
        return false;
      }
    }

    if(input === currentFilePromptInput) {
      if (!currentFile.value || !currentFile.value.content || removeHtmlTags(currentFile.value.content).trim() === '') {
        return false;
      }
    }

    return true;
  }

  function getInputChipColor(input) {
    if(!isInputAllowedForThisPrompt(input)) {
      //return 'white';
    }

    return containsInput(input) ? (input.color + '-4') : (input.color + '-1');
  }

  function getInputChipIcon(input) {
    if(!isInputAllowedForThisPrompt(input)) {
      return undefined;
    }

    return containsInput(input) ? 'mdi-check' : 'mdi-plus';
  }

  function getInputChipFontColor(context) {
    if(!isInputAllowedForThisPrompt(context)) {
      return 'grey-4';
    }

    return 'black'
  }

  function addInput(input, parametersValue = undefined) {
    if(input === selectedTextPromptInput) {
      removeInput(currentFilePromptInput);
    }

    if(input === currentFilePromptInput) {
      removeInput(selectedTextPromptInput);
    }

    if(parametersValue) {
      input.parameters = parametersValue;
    }

    promptStore.promptUserInputs.push(input);
  }

  function removeInput(input) {
    promptStore.promptUserInputs = promptStore.promptUserInputs.filter(c => c.id !== input.id);
  }

  function inputWarning(input) {
    return null;
  }

  const promptPreviewEstimateCost = computed(() => {
    if(!promptPreview.value) {
      return;
    }

    let textMessagesContentLength = 0;
    let inputTokens = 0;

    const modelData = layoutStore.getModelData(model.value.modelName);


    promptPreview.value.textMessages.forEach(tm => {
      textMessagesContentLength += tm.text.length;
      inputTokens += tokenise(tm.text)?.length ?? 0;
    });


    let inputCost = modelData ? ((modelData.inputPrice * inputTokens / 1000000) + '+ credits for input') : 'N/A';
    let outputCost = modelData ? ((modelData.outputPrice / 1000) + ' output credits per 1000 tokens') : 'N/A';

    if(model.value.type === 'client-dall-e') {
      inputCost = modelData ? ((modelData.inputPrice) + '+ per image') : 'N/A';
      outputCost = '';
    }

    if(userData.value?.subscriptionLevel > 0) {
      const key = getCloudModelApiKey(model.value.id, model.value.args?.inferenceEngine);

      if(key && key.key && key.key.length > 0) {
        inputCost = 'Credits not consumed - using own cloud API';
        outputCost = '';
      }
    }

    return {
      textMessagesContentLength,
      inputTokens,
      inputCost: inputCost,
      outputCost: outputCost
    }
  });

  onKeyStroke('Enter', (e) => {
    if(!promptPreviewShown.value && promptStore.promptParametersShown && enterConfirms.value) {
      confirmPrompt(promptPreviewShown.value ? true : false);
    }
  })

  function moveTextMessage(message, byIndex) {
    const index = promptPreview.value.textMessages.indexOf(message);
    if (index === -1) return;

    const newIndex = index + byIndex;
    if (newIndex < 0 || newIndex >= promptPreview.value.textMessages.length) return;

    const [movedMessage] = promptPreview.value.textMessages.splice(index, 1);
    promptPreview.value.textMessages.splice(newIndex, 0, movedMessage);
  }

  function addMessage(type) {
    promptPreview.value.textMessages.push({
      type: type,
      text: ''
    });
  }
</script>

<style scoped>



</style>
