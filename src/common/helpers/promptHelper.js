import {convertHtmlToText, replaceParameterEditorText, trimWhitespace} from "src/common/utils/textUtils";
import {usePromptStore} from "stores/prompt-store";
import {useFileStore} from "stores/file-store";
import {
  allPromptContexts,
  currentFilePromptContext, currentFilePromptInput,
  selectedTextPromptContext,
  selectedTextPromptInput
} from "src/common/resources/promptContexts";
import {useLayoutStore} from "stores/layout-store";
import {getEditor, isEmptySelection} from "src/common/utils/editorUtils";
import {useAiAgentStore} from 'stores/aiagent-store';

export function applyPromptFormatPrefixSuffix(systemPrefix, systemSuffix, systemMessage, userPrefix, userSuffix, userPrompt, assistantPrefix, assistantSuffix) {
  let output = '';

  output = systemPrefix + replaceParameterEditorText(systemMessage) + systemSuffix + userPrefix + replaceParameterEditorText(userPrompt) + userSuffix + assistantPrefix;

  return output;
}

export function applyPromptChatFormat(systemPrefix, systemSuffix, userPrefix, userSuffix, assistantPrefix, assistantSuffix, messages) {
  let output = '';

  for (const message of messages) {
    if(message.type === 'system') {
      output += systemPrefix + replaceParameterEditorText(message.text) + systemSuffix;
    } else if(message.type === 'user') {
      output += userPrefix + replaceParameterEditorText(message.text) + userSuffix;
    } else if(message.type === 'assistant') {
      output += assistantPrefix + replaceParameterEditorText(message.text) + assistantSuffix;
    }
  }

  const retValue = trimLineBreaks(output + assistantPrefix).trim();

  return retValue;
}

export function exportPromptToJson(prompts) {
  let retPrompts = [];
  for (const prompt of prompts) {
    const promptCopy = JSON.parse(JSON.stringify(prompt));
    promptCopy.id = '[model]_' + promptCopy.title;
    promptCopy.modelId = '[model]';
    retPrompts.push(promptCopy);
  }

  const retJson = JSON.stringify(retPrompts, null, 2);
  return retJson;
}

export function trimLineBreaks(text) {
  return text.replace(/\n{3,}/g, '\n\n');
}

export async function executePromptClick2(request) {
  const promptStore = usePromptStore();
  const layoutStore = useLayoutStore();

  if(request.prompt.tabId) {
    promptStore.setCurrentTabId(request.prompt.tabId);
  }

  // if ctrl is holding down
  const ctrlDown = layoutStore.ctrlDown;

  promptStore.promptUserInputs = [];
  //promptStore.promptInput = request.text;

  const model = promptStore.getModelFromRequest(request);

  const showMoreParametersWindow = !ctrlDown
    && (
      request.forceShowContextSelection === true
      || (!request.forceBypassMoreParameters && request.prompt.promptType !== 'selectionAnalysis' && (request.prompt.promptType !== 'chat' || (model.args?.targetLanguages && !request.prompt.targetLanguage)))
    );

  if(!showMoreParametersWindow && request.prompt.info?.tags?.includes("context")) {
    const previousPromptContext = promptStore.getSavedPromptRunData(request.prompt, 'lastContext');

    if(previousPromptContext) {
      promptStore.promptContext = [...previousPromptContext];
    }
  } if(showMoreParametersWindow) {

    const fileStore = useFileStore();

    let fileContext = null;
    const currentFile = fileStore.selectedFile;
    const previousPromptContext = promptStore.getSavedPromptRunData(request.prompt, 'lastContext');

    if(previousPromptContext) {
      fileContext = [...previousPromptContext];
    } else {
      if (currentFile) {
        const contexts = fileStore.getTemporaryFileMetaProperty(currentFile, 'context-' + prompt.id);

        if (contexts) {
          fileContext = [...contexts];
        }
      }
    }

    const editor = getEditor();
    if(editor) {
      if(isEmptySelection()) {
        if(currentFile.content && trimWhitespace(convertHtmlToText(currentFile.content)).length > 0) {
          promptStore.promptUserInputs = [ currentFilePromptInput ];
        } else {
          promptStore.promptUserInputs = [];
        }
      } else {
        promptStore.promptUserInputs = [ selectedTextPromptInput ];
      }
    }

    if(fileContext) {
      promptStore.promptContext = [...fileContext];
    } else {

      if(request.prompt.overrideContexts === true) {
        promptStore.promptContext = [];

        for (const contextTypeId of request.prompt.defaultContextTypes ?? []) {
          const foundPromptContextType = allPromptContexts.find(c => c.id === contextTypeId);

          if(foundPromptContextType) {
            promptStore.promptContext.push(foundPromptContextType);
          }
        }

      } else if(editor) {
        if(isEmptySelection()) {
          if(currentFile.content && trimWhitespace(convertHtmlToText(currentFile.content)).length > 0) {
            promptStore.promptContext = [ currentFilePromptContext ];
          } else {
            promptStore.promptContext = [];
          }
        } else {
          promptStore.promptContext = [ selectedTextPromptContext ];
        }

      } else {
        promptStore.promptContext = [];
      }
    }

    if(request.prompt.overrideContexts === true) {
      if(request.prompt.excludedContextTypes) {
        promptStore.promptContext = promptStore.promptContext.filter(c => !request.prompt.excludedContextTypes.includes(c.id));
      }
    }

    promptStore.promptParametersShown = true;
    promptStore.currentPromptConfirmationRequest = request;

    const previousParameters = [...promptStore.promptParametersValue];
    promptStore.promptParametersValue = [];

    for (const param of request.prompt.parameters) {
      const prevPrompt = previousParameters.find(p => p.prompt.id === request.prompt.id && p.name === param.name);

      promptStore.promptParametersValue.push({
        name: param.name,
        type: param.type,
        value: prevPrompt?.value ?? param.default,
        hint: param.hint,
        required: param.required,
        prefixWith: param.prefixWith,
        suffixWith: param.suffixWith,
        examples: param.examples,
        values: [...param.values],
        prompt: request.prompt,
      });
    }
  } else {
    request.previewOnly = false;
    request.forceInput = null;

    if(request.prompt.promptType === "general" || request.prompt.promptType === "insert" || request.prompt.promptType === "selection" || request.prompt.promptType === "selectionAnalysis") {
      return await executePrompt2(request);
    }  else if (request.prompt.promptType === "chat") {
      return await executeChatPrompt2(request);
    }
  }
}

export async function executeConfirmPrompt2(request) {
  const promptStore = usePromptStore();

  if(request.prompt.tabId) {
    promptStore.setCurrentTabId(request.prompt.tabId);
  }

  let clear = true;
  if((request.forceInput && request.forceInput.isRegenerating) || request.prompt.promptType === "chat") {
    clear = false;
  }

  request.clear = clear;

  if(request.agent) {
    const aiAgentStore = useAiAgentStore();
    await aiAgentStore.confirmProjectAgent(request)
  } else if(request.prompt.promptType === "general"
    || request.prompt.promptType === "insert"
    || request.prompt.promptType === "selection"
    || request.prompt.promptType === "selectionAnalysis") {
    return await executePrompt2(request);
  } else if (request.prompt.promptType === "chat") {
    return await executeChatPrompt2(request);
  }

  return null;
}

async function executePrompt2(request) {
  const promptStore = usePromptStore();

  const model = promptStore.getModelFromRequest(request);

  const promptTimes = request.prompt.overridePromptTimes?.length > 0 ? parseInt(request.prompt.overridePromptTimes) : model.promptTimes;

  if(request.prompt.info?.tags?.includes("context") && promptStore.promptContext) {
    const fileStore = useFileStore();

    const currentFile = fileStore.selectedFile;

    if(currentFile) {
      fileStore.setTemporaryFileMetaProperty(currentFile, 'context-' + request.prompt.id, promptStore.promptContext);
    }

    promptStore.setSavedPromptRunData(request.prompt, 'lastContext', promptStore.promptContext);
  }

  const context = [...promptStore.promptContext];
  const userInputs = [...promptStore.promptUserInputs];

  if(request.appendContext) {
    for (const appendContextElement of request.appendContext) {
      if(!context.find(c => c.id === appendContextElement.id)) {
        context.push(appendContextElement);
      }
    }
  }

  if (request.contextTypes && request.contextTypes.length > 0) {
    for (const existingContext of request.contextTypes) {
      if (!context.find(c => c.id === existingContext.id)) {
        context.push(existingContext);
      }
    }
  }

  if (request.userInputs && request.userInputs.length > 0) {
    for (const existingUserInput of request.userInputs) {
      if (!userInputs.find(u => u.id === existingUserInput.id)) {
        userInputs.push(existingUserInput);
      }
    }
  }

  request.contextTypes = context;
  request.userInputs = userInputs;
  request.forceTemperature = null;
  request.promptTimes = promptTimes;

  if(!request.parametersValue) {
    request.parametersValue = promptStore.promptParametersValue;
  } else {
    for (const param of promptStore.promptParametersValue) {
      const foundParam = request.parametersValue.find(p => p.name === param.name);
      if(!foundParam) {
        request.parametersValue.push(param);
      }
    }
  }

  return await promptStore.promptMultiple2(request);
}

async function executeChatPrompt2(request) {
  const promptStore = usePromptStore();

  const model = promptStore.getModelFromRequest(request);

  const promptTimes = request.prompt.overridePromptTimes?.length > 0 ? parseInt(request.prompt.overridePromptTimes) : model.promptTimes;

  if(request.prompt.info?.tags?.includes("context") && promptStore.promptContext) {
    const fileStore = useFileStore();

    const currentFile = fileStore.selectedFile;

    if(currentFile) {
      fileStore.setTemporaryFileMetaProperty(currentFile, 'context-' + request.prompt.id, promptStore.promptContext);
    }

    promptStore.setSavedPromptRunData(request.prompt, 'lastContext', promptStore.promptContext);
  }

  const context = [...promptStore.promptContext];
  const userInputs = [...promptStore.promptUserInputs];

  if(request.appendContext) {
    for (const appendContextElement of request.appendContext) {
      if(!context.find(c => c.id === appendContextElement.id)) {
        context.push(appendContextElement);
      }
    }
  }

  request.contextTypes = context;
  request.userInputs = userInputs;
  request.forceTemperature = null;
  request.promptTimes = promptTimes;

  if(!request.parametersValue) {
    request.parametersValue = promptStore.promptParametersValue;
  } else {
    for (const param of promptStore.promptParametersValue) {
      const foundParam = request.parametersValue.find(p => p.name === param.name);
      if(!foundParam) {
        request.parametersValue.push(param);
      }
    }
  }

  return await promptStore.promptMultiple2(request);
}

export function cloneRequest(request, copyAbortController = false) {
  return {
    prompt: request.prompt,
    text: request.text, // automatic input
    userInputs: request.userInputs ? [...request.userInputs] : null, // user specified inputs
    forceInput: request.forceInput, // TODO what is this?

    systemPrompt: request.systemPrompt,
    userPrompt: request.userPrompt,

    clear: request.clear,
    forceBypassMoreParameters: request.forceBypassMoreParameters,
    forceShowContextSelection: request.forceShowContextSelection,
    silent: request.silent,
    abortController: copyAbortController ? request.abortController : (request.abortController ? new AbortController() : null),
    onOutput: request.onOutput,

    isPromptAgent: request.isPromptAgent,
    isInstructionGeneratorRequest: request.isInstructionGeneratorRequest,
    isProjectAgent: request.isProjectAgent,
    promptAgent: request.promptAgent,
    isIndependentAgent: request.isIndependentAgent,

    allowParallel: request.allowParallel,

    noTrim: request.noTrim,
    tools: request.tools,

    promptSource: request.promptSource,
    forceTemperature: request.forceTemperature,
    promptTimes: request.promptTimes,
    previewOnly: request.previewOnly,

    forceModelId: request.forceModelId,

    executedTextMessages: request.executedTextMessages ? [...request.executedTextMessages] : null,
    appendMessages: request.appendMessages ? [...request.appendMessages] : null,
    contextTypes: request.contextTypes ? [...request.contextTypes] : null,
    parametersValue: request.parametersValue ? [...request.parametersValue] : null,
  }
}

export async function replyToPrompt2(promptResult, message) {
  if(message.trim() === '') return;

  const promptStore = usePromptStore();
  const request = cloneRequest(promptResult.request); // the original prompt request

  const appendMessages = [];
  if(promptResult.appendMessages) {
    appendMessages.push(...promptResult.appendMessages);
  }
  appendMessages.push({type: 'assistant', text: convertHtmlToText(replaceParameterEditorText(promptResult.originalText))});
  appendMessages.push({type: 'user', text: message});

  request.appendMessages = appendMessages;
  request.prompt = promptResult.prompt;
  request.text = promptResult.input;
  request.clear = false;
  request.forceBypassMoreParameters = true;

  await executePromptClick2(request);
}
