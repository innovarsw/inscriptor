import { defineStore } from 'pinia';
import {
  cloneRequest,
} from "src/common/helpers/promptHelper";
import {usePromptStore} from 'stores/prompt-store';

export const usePromptAgentStore = defineStore('prompt-agent', {
  state: () => ({
  }),
  getters: {
  },
  actions: {
    // --- Simple agents
    async runAgentsOnPromptResult(request, result) {
      const promptStore = usePromptStore();

      if (request.prompt.agents?.length > 0) {
        for(let agent of request.prompt.agents) {

          const agentDefinition = promptStore.promptAgents.find(a => a.id === agent.agentId);
          if(!agentDefinition) {
            continue;
          }

          if ((request.abortController ?? promptStore.singletonPromptAbortController)?.signal?.aborted) {
            return;
          }

          result.analysingByAgent = agentDefinition;
          result.analysingByAgentMessage = `${agentDefinition.title} is analysing...`;

          try {
            if (agentDefinition.type === 'Refiner') {
              await this.runRefinerAgent(request, result, agentDefinition);
            } else if (agentDefinition.type === 'Critic') {
              await this.runCriticAgent(request, result, agentDefinition);
            }
          } finally {
            result.analysingByAgent = undefined;
            result.analysingByAgentMessage = undefined;
          }
        }
      }
    },
    async runCriticAgent(request, result, agent) {
      const promptStore = usePromptStore();
      const agentMessages = [];
      const maxIterations = agent.maxRuns ?? 5;

      for (let iteration = 1; iteration <= maxIterations; iteration++) {
        if (this.checkAgentIsAborted(result)) return;

        // CREATE INSTRUCTIONS
        this.updateAgentProgress(result, agent, `${agent.title}: Evaluating...`);

        const instructionMessages = [...agentMessages,
          { type: 'assistant', text: result.originalText },
          { type: 'user', text: agent.prompt }
        ];

        const instructionRequest = this.createPromptAgentRequest(request, instructionMessages, agent, agent);
        instructionRequest.isInstructionGeneratorRequest = true;
        const criticResult = await this.executeAgentPrompt(instructionRequest);

        if (this.checkAgentIsAborted(result)) return;

        // Check if critic approves content
        if (this.shouldIgnoreAgentResult(criticResult.originalText, agent)) {
          console.log('runCriticAgent content approved, stopping');
          this.updateAgentProgress(result, agent, `${agent.title}: Content approved, no changes needed.`);
          return;
        }

        // GENERATE NEW TEXT
        this.updateAgentProgress(result, agent, `${agent.title}: Iter ${iteration}/${maxIterations} - Working...`);

        agentMessages.push(
          { type: 'assistant', text: result.originalText },
          { type: 'user', text: criticResult.originalText }
        );

        const refinementRequest = this.createPromptAgentRequest(request, agentMessages, agent, agent);
        const refinementResult = await this.executeAgentPrompt(refinementRequest);

        if (this.checkAgentIsAborted(result)) return;

        this.addPreviousAgentResult(result, agent);
        result.text = refinementResult.text;
        result.originalText = refinementResult.originalText;
        promptStore.calculateDiffs(request, result);
      }
    },
    async runRefinerAgent(request, result, agent) {
      const promptStore = usePromptStore();
      const agentMessages = [];
      const maxRuns = agent.allowMultipleRuns ? (agent.maxRuns ?? 1) : 1;

      for (let run = 1; run <= maxRuns; run++) {
        if (this.checkAgentIsAborted(result)) return;

        this.updateAgentProgress(result, agent, `${agent.title}: Run ${run}/${maxRuns} - Working...`);

        agentMessages.push(
          { type: 'assistant', text: result.originalText },
          { type: 'user', text: agent.prompt }
        );

        const agentRequest = this.createPromptAgentRequest(request, agentMessages, agent, agent);
        const newResult = await this.executeAgentPrompt(agentRequest);

        if (this.checkAgentIsAborted(result)) return;

        if (this.shouldIgnoreAgentResult(newResult.originalText, agent)) {
          this.updateAgentProgress(result, agent, `${agent.title}: Content refined successfully (${run} runs).`);
          break;
        }

        this.addPreviousAgentResult(result, agent);
        result.text = newResult.text;
        result.originalText = newResult.originalText;
        promptStore.calculateDiffs(request, result);
      }
    },
    createPromptAgentRequest(baseRequest, agentMessages = [], options = {}, agentDefinition) {
      const newRequest = cloneRequest(baseRequest, true);
      newRequest.silent = options.silent ?? true;
      newRequest.isPromptAgent = true;
      newRequest.promptAgent = agentDefinition;
      newRequest.agentMessages = [...agentMessages];

      if (options.appendMessages) {
        newRequest.appendMessages = [...options.appendMessages];
      }

      if (options.text !== undefined) {
        newRequest.text = options.text;
      }

      if (options.contextTypes) {
        newRequest.contextTypes = options.contextTypes;
      }

      if (options.onOutput) {
        newRequest.onOutput = options.onOutput;
      }

      return newRequest;
    },
    async executeAgentPrompt(request, options = {}) {
      const promptStore = usePromptStore();

      try {
        const result = await promptStore.promptInternalStreaming(request);
        return result;
      } catch (error) {
        if (options.onError) {
          options.onError(error);
        }
        throw error;
      }
    },
    checkAgentIsAborted(result) {
      return result.analysisByAgentAborted;
    },
    updateAgentProgress(result, agent, message) {
      result.analysingByAgent = agent;
      result.analysingByAgentMessage = message;
    },

    addPreviousAgentResult(result, agent) {
      if (!result.prevResults) {
        result.prevResults = [];
      }

      result.prevResults.push({
        title: 'Result before ' + agent.title,
        request: result.request,
        prompt: result.prompt,
        text: result.text,
        originalText: result.originalText,
        diff: result.diff ? [...result.diff] : undefined,
        meta: result.meta,
        type: result.type,
        waitingForResponse: result.waitingForResponse,
        contextTypes: result.contextTypes,
        parametersValue: result.parametersValue,
        userInputs: result.userInputs,
        collapsed: false,
      });
    },
    shouldIgnoreAgentResult(resultText, agent) {
      const cleanResultText = (resultText ?? '').trim().toLowerCase().replace(/^["']|["']$/g, '');
      const cleanIgnoreText = (agent.ignoreResultText ?? 'OK').trim().toLowerCase();
      return cleanResultText === cleanIgnoreText;
    },
  }
});
