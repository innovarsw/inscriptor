//TODO finish localization of other hardcoded strings

export default {
  failed: 'Action failed',
  success: 'Action was successful',

  tooltips: {
    parameters: {
      temperature: 'Controls the randomness of the hints. 1 is the most random and creative, 0 is the most deterministic. Change either this or top P, but not both.',
      topP: 'Controls the diversity of the hints. 1 is the most diverse and creative, 0 is the most deterministic. Change either this or temperature, but not both.',
      minP: 'Controls the minimum probability of the hints. 0 is the most permissive, 1 is the most strict.',
      frequencyPenalty: 'Controls the penalty for repeating the same token. 0 is the most permissive, 1 is the most strict.',
      presencePenalty: 'Controls the penalty for missing a token. 0 is the most permissive, 1 is the most strict.',
      repeatPenalty: 'Sets how strongly to penalize repetitions. A higher value (e.g., 1.5) will penalize repetitions more strongly, while a lower value (e.g., 0.9) will be more lenient. (Default: 1.1).',
      maxTokens: 'Controls the maximum number of tokens that can be generated at once.',
      stopStrings: 'Strings that stop the model from generating more text.',

      systemPrompt: 'System prompt is the instruction that defines the general behavior of the AI.',
      userPrompt: 'User prompt is usually the part where you provide your own input to the AI. For example: if the AI prompt is for summarizing the text (as is defined in System prompt instructions), here you provide the text to summarize.',
      promptFormat: 'Defines the format of instructions for the AI model.',

      promptTypes: 'How the prompt will be used, eg. if it is executed on selected text, on the whole file, etc. See descriptions of individual types.',

      defaultContextTypes: 'Which types of context are included by default.',
      excludedContextTypes: 'Which types of context cannot be included in this prompt (used for example it does not make sense for a context type to be added or it is already hardcoded into the prompt instructions)',

      selectionPrompt: 'The prompt will be displayed only when you select some text.',
      contentPrompt: 'The prompt will be displayed when you have no text selected.',
      extraParameters: 'The prompt will have extra parameters to be filled by the user when they click on this prompt. Use this for on demand customization.',

      topK: 'Reduces the probability of generating nonsense. A higher value (e.g. 100) will give more diverse answers, while a lower value (e.g. 10) will be more conservative. (Default: 40).',

      promptTimes: "The number of times the prompt will be repeated. Use this to generate more results at once, to get more variety.",
    },
  },
}
