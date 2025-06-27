import { defineStore } from 'pinia';
import {
  cloneRequest,
} from "src/common/helpers/promptHelper";
import {usePromptStore} from 'stores/prompt-store';
import {useEditorStore} from 'stores/editor-store';
import { editorTextBetween} from 'src/common/utils/editorUtils';
import {currentFilePromptContext} from 'src/common/resources/promptContexts';

export const useAiAgentStore = defineStore('ai-agent', {
  state: () => ({
    confirmationWidgetData: null,
    currentConfirmationPromise: null,

    projectAgent: null,
    projectAgentCurrentProcessingParagraphItem: null,
    projectAgentSkippedParagraphs: new Set(), // Track skipped paragraph text content
    projectAgentProcessing: false,
    projectAgentContext: [],
    projectAgentCurrentPromptRequest: null,

    projectAgentUserAborted: false, // Global flag to abort all streaming
    independentAgentChatHistory: [], // Persistent conversation messages for independent agents
    agentActionHistory: [],
    agentStatus: null,
  }),
  getters: {
    agentState: (state) => {
      if (!state.projectAgentProcessing) {
        return 'idle';
      }
      if (state.currentConfirmationPromise) {
        return 'waiting_for_user';
      }
      return 'processing';
    },
    isAgentActive: (state) => state.projectAgentProcessing,
  },
  actions: {
    // Helper methods for action history and status
    addActionToHistory(action, details = {}) {
      const timestamp = new Date().toLocaleTimeString();
      this.agentActionHistory.push({
        timestamp,
        action,
        details,
        ...details
      });
    },
    updateAgentStatus(status) {
      this.agentStatus = status;
    },
    async openProjectAgent(agent) {
      const promptStore = usePromptStore();

      promptStore.promptContext = this.projectAgentContext ?? [ currentFilePromptContext ];
      promptStore.promptParametersValue = [];
      promptStore.promptParametersShown = true;
      const request = {
        prompt: promptStore.prompts.find(p => p.id === agent.promptId),
        text: '',
        clear: false,
        agent: agent,
        promptTimes: 1,
        isProjectAgent: true,
      };

      promptStore.currentPromptConfirmationRequest = request;
    },
    async confirmProjectAgent(request) {
      const editorStore = useEditorStore();
      const promptStore = usePromptStore();

      const editor = editorStore.editor;
      if (!editor) {
        this.clearProjectAgent();
        return;
      }

      const agent = request.agent;

      this.projectAgentContext = [...promptStore.promptContext];
      this.projectAgentProcessing = true;
      this.projectAgentCurrentPromptRequest = cloneRequest(request, true);
      this.projectAgentUserAborted = false;
      this.projectAgent = agent;

      this.agentActionHistory = [];
      this.agentStatus = null;

      editorStore.clearAllAgentDecorations();
      this.projectAgentSkippedParagraphs.clear();

      if (agent.isIndependent) {
        await this.processIndependentAgent(agent);
      } else {
        // Log project agent start
        this.addActionToHistory('🚀 Agent started', {
          type: 'start',
          agentName: agent.title,
          searchPrefix: agent.searchPrefix,
          mode: 'paragraph_based'
        });
        this.updateAgentStatus('Looking for paragraphs to process...');

        await this.processNextParagraph(agent);
      }
    },
    clearProjectAgent() {
      const editorStore = useEditorStore();
      if (this.projectAgentCurrentProcessingParagraphItem) {
        editorStore.removeAgentDecoration(this.projectAgentCurrentProcessingParagraphItem.from, this.projectAgentCurrentProcessingParagraphItem.to);
      }

      this.projectAgent = null;
      this.projectAgentProcessing = false;
      this.projectAgentUserAborted = false;
      this.projectAgentCurrentPromptRequest = null;
      this.projectAgentSkippedParagraphs.clear();
      this.projectAgentCurrentProcessingParagraphItem = null;
      this.independentAgentChatHistory = [];

      if (this.currentConfirmationPromise) {
        this.currentConfirmationPromise.resolve('stopped');
        this.currentConfirmationPromise = null;
      }

      editorStore.clearAllAgentDecorations();
      this.confirmationWidgetData = null;
    },
    async processNextParagraph(agent) {
      const nextItem = this.findNextParagraph(agent);
      if (!nextItem) {
        // Log completion
        this.addActionToHistory('✅ All paragraphs processed', {
          type: 'completed',
          reason: 'No more paragraphs found to process'
        });
        this.updateAgentStatus('Completed');

        this.clearProjectAgent();
        return;
      }

      // Log found paragraph
      this.addActionToHistory('📝 Found paragraph to process', {
        type: 'found_paragraph',
        paragraphId: nextItem.nodeId,
        instruction: nextItem.instruction.substring(0, 100) + (nextItem.instruction.length > 100 ? '...' : '')
      });
      this.updateAgentStatus(`Processing paragraph: ${nextItem.instruction.substring(0, 50)}...`);

      const result = await this.runAgentOnParagraph(agent, nextItem);

      if (result === 'stopped' || result === 'error' || !this.projectAgentProcessing) {
        return;
      }

      // Log continuation
      this.addActionToHistory('🔄 Looking for next paragraph', {
        type: 'continue'
      });
      this.updateAgentStatus('Looking for next paragraph...');

      await this.processNextParagraph(agent);
    },
    findNextParagraph(agent) {
      const editorStore = useEditorStore();
      const editor = editorStore.editor;

      if (!editor) return null;

      const doc = editor.state.doc;
      let nextItem = null;

      doc.nodesBetween(0, doc.content.size, (node, pos) => {
        if (nextItem) return false; // Stop if we found one

        if (node.type.name === 'paragraph') {
          const from = pos;
          const to = pos + node.nodeSize;
          const text = editorTextBetween(doc, { from, to }, '\\n', '\\n');

          if (text.trim().startsWith(agent.searchPrefix) && text.trim().length > agent.searchPrefix.length) {
            const instruction = text.trim().substring(agent.searchPrefix.length).trim();

            if (!this.projectAgentSkippedParagraphs.has(node.attrs.id) && instruction.length > 0) {
              nextItem = {
                node,
                pos,
                from,
                to,
                text: text.trim(),
                instruction,
                originalContent: text,
                nodeId: node.attrs.id
              };
            }
          }
        }
      });

      return nextItem;
    },
    manageParagraphDecoration(item, state) {
      const editorStore = useEditorStore();

      switch (state) {
        case 'pending':
          editorStore.addAgentDecoration(item.from, item.to, 'pending');
          break;
        case 'processing':
          editorStore.updateAgentDecoration(item.from, item.to, 'processing');
          break;
        case 'streaming':
          editorStore.updateAgentDecoration(item.from, item.to, 'streaming');
          break;
        case 'awaiting_confirmation':
          editorStore.updateAgentDecoration(item.from, item.to, 'awaiting_confirmation');
          break;
        case 'remove':
          editorStore.removeAgentDecoration(item.from, item.to);
          break;
      }
    },
    shouldAbortStreaming() {
      return this.projectAgentUserAborted;
    },
    shouldIgnoreAgentResult(resultText, agent) {
      const cleanResultText = (resultText ?? '').trim().toLowerCase().replace(/^["']|["']$/g, '');
      const cleanIgnoreText = (agent.ignoreResultText ?? 'OK').trim().toLowerCase();
      return cleanResultText === cleanIgnoreText;
    },
    onWidgetAccept(data) {
      console.log('User accepted changes:', data);
      const editorStore = useEditorStore();

      this.projectAgentCurrentPromptRequest?.abortController?.abort();

      const { from, to } = data.paragraphRange;

      if(editorStore.editor) {
        editorStore.editor.commands.blur();
      }

      this.manageParagraphDecoration({from, to}, 'remove');

      editorStore.editor
        .chain()
        .focus()
        .command(({ tr, state }) => {
          // Replace the content at the specified range
          tr.replaceWith(from, to, state.schema.text(data.aiSuggestion));
          return true;
        })
        .run();

      if(this.projectAgentCurrentProcessingParagraphItem) {
        this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'remove');

        // Log user acceptance for project agent
        if (!this.confirmationWidgetData?.isIndependentAgent) {
          this.addActionToHistory('✅ User accepted change', {
            type: 'user_accept',
            paragraphId: this.projectAgentCurrentProcessingParagraphItem.nodeId
          });
        }
      }

      if (this.currentConfirmationPromise) {
        this.currentConfirmationPromise.resolve('accepted');
        this.currentConfirmationPromise = null;
      }
    },
    onWidgetReject(data) {
      if(!this.confirmationWidgetData) {
        return;
      }

      const editorStore = useEditorStore();
      console.log('User skipped paragraph:', data);
      this.projectAgentSkippedParagraphs.add(data.nodeId);

      // Log user rejection for project agent
      if (!this.confirmationWidgetData?.isIndependentAgent) {
        this.addActionToHistory('❌ User skipped paragraph', {
          type: 'user_skip',
          paragraphId: data.nodeId
        });
      }

      if(editorStore.editor) {
        editorStore.editor.commands.blur();
      }

      this.projectAgentCurrentPromptRequest?.abortController?.abort();

      if(this.projectAgentCurrentProcessingParagraphItem) {
        this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'remove');
      }

      if (this.currentConfirmationPromise) {
        this.currentConfirmationPromise.resolve('skipped');
        this.currentConfirmationPromise = null;
      }
    },
    onWidgetReplaceText(text) {
      if(!this.confirmationWidgetData) {
        return;
      }

      this.confirmationWidgetData.aiSuggestion = text.originalText;
    },
    async onWidgetChat(userFeedback) {
      if(!this.confirmationWidgetData) {
        return;
      }

      if(this.confirmationWidgetData.isIndependentAgent) {
        this.independentAgentChatHistory.push({
          type: 'user',
          text: userFeedback
        });

        // Log user feedback
        this.addActionToHistory('💬 User provided feedback', {
          type: 'user_chat',
          feedback: userFeedback,
          paragraphId: this.confirmationWidgetData.nodeId
        });
        this.updateAgentStatus('Processing feedback...');

        // Clear current suggestion and set streaming state
        this.confirmationWidgetData.aiMessage = '';
        this.confirmationWidgetData.isLoading = true;

        // Abort any current request
        this.projectAgentCurrentPromptRequest?.abortController?.abort();

        try {
          const promptStore = usePromptStore();

          const request = cloneRequest(this.projectAgentCurrentPromptRequest);
          this.projectAgentCurrentPromptRequest = request;

          request.abortController = new AbortController();
          if (this.independentAgentChatHistory.length > 0) {
            request.appendMessages = [...this.independentAgentChatHistory];
          }

          const result = await promptStore.promptInternalSimple(request);

          this.confirmationWidgetData.isLoading = false;

          await this.processIndependentAgentResult(result, false);

          // Update status after processing feedback
          this.updateAgentStatus('Waiting for user confirmation...');
        } catch (error) {
          this.clearProjectAgent();
        } finally {
          if(this.confirmationWidgetData) {
            this.confirmationWidgetData.isLoading = false;
          }
        }

        await this.continueIndependentAgent(this.projectAgent);
      } else {
        // Log user feedback for project agent
        this.addActionToHistory('💬 User provided feedback', {
          type: 'user_chat',
          feedback: userFeedback,
          paragraphId: this.confirmationWidgetData.nodeId
        });
        this.updateAgentStatus('Processing feedback...');

        this.confirmationWidgetData.conversationMessages.push({ type: 'assistant', text: this.confirmationWidgetData.aiSuggestion });
        this.confirmationWidgetData.conversationMessages.push({ type: 'user', text: userFeedback });

        this.confirmationWidgetData.aiSuggestion = '';

        this.projectAgentCurrentPromptRequest?.abortController?.abort();

        if(this.projectAgentCurrentProcessingParagraphItem) {
          this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'streaming');
        }

        try {
          const onOutput = (fullText, newText, isFinished, isError, request, result) => {
            if (this.shouldAbortStreaming() || !this.confirmationWidgetData || request.isInstructionGeneratorRequest) {
              return;
            }

            this.confirmationWidgetData.isStreaming = true;

            this.confirmationWidgetData.executingPromptRequest = request;
            this.confirmationWidgetData.promptResult = result;

            if(!request.isPromptAgent) { // do not stream when analysing by agent
              this.confirmationWidgetData.aiSuggestion = fullText;
            }

            if (isFinished) {
              this.confirmationWidgetData.isStreaming = false;

              if (!isError && !this.shouldAbortStreaming()) {

                if (request.isPromptAgent) {
                  if(this.shouldIgnoreAgentResult(fullText, request.promptAgent)) {
                    return;
                  }
                }

                this.confirmationWidgetData.aiSuggestion = fullText;

                if(this.projectAgentCurrentProcessingParagraphItem) {
                  this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'awaiting_confirmation');
                }
              }
            }
          };

          this.confirmationWidgetData.promptResult = await this.executeProjectAgentPrompt(onOutput);

        } catch (error) {
          this.confirmationWidgetData.isStreaming = false;
        }
      }
    },
    onWidgetUndo() {
      if(!this.confirmationWidgetData) {
        return;
      }

      this.projectAgentCurrentPromptRequest?.abortController?.abort();

      this.confirmationWidgetData.aiSuggestion = this.confirmationWidgetData.originalAiSuggestion;

      if(!this.confirmationWidgetData.isIndependentAgent) {
        this.confirmationWidgetData.conversationMessages = [];

        if(this.projectAgentCurrentProcessingParagraphItem) {
          this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'awaiting_confirmation');
        }
      }
    },
    async executeProjectAgentPrompt(onOutput) {
      const promptStore = usePromptStore();

      try {
        this.confirmationWidgetData.isStreaming = true;

        const newRequest = cloneRequest(this.projectAgentCurrentPromptRequest);
        this.projectAgentCurrentPromptRequest = newRequest;

        newRequest.isProjectAgent = true;
        newRequest.abortController = new AbortController();
        newRequest.silent = true;
        newRequest.text = this.projectAgentCurrentProcessingParagraphItem.instruction;

        newRequest.contextTypes = this.projectAgentContext;

        if (this.confirmationWidgetData.conversationMessages.length > 0) {
          newRequest.appendMessages = [...this.confirmationWidgetData.conversationMessages];
        }

        if (onOutput) {
          newRequest.onOutput = onOutput;
        }

        const result = await promptStore.promptMultiple2(newRequest);
        return result;
      } catch (error) {
        // Log error
        this.addActionToHistory('⚠️ Error in prompt execution', {
          type: 'prompt_error',
          error: error.message || 'Unknown error'
        });
        this.updateAgentStatus('Error occurred');

        this.clearProjectAgent();

        throw error;
      }
    },
    async runAgentOnParagraph(agent, item) {
      const editorStore = useEditorStore();

      this.projectAgentCurrentProcessingParagraphItem = item;

      let conversationMessages = [];

      console.log('RUN AGENT ON PARAGRAPH', item.text);

      // Log processing start
      this.addActionToHistory('⚙️ Processing paragraph', {
        type: 'processing',
        paragraphId: item.nodeId,
        instruction: item.instruction.substring(0, 100) + (item.instruction.length > 100 ? '...' : '')
      });
      this.updateAgentStatus(`Processing: ${item.instruction.substring(0, 50)}...`);

      editorStore.updateAgentDecoration(item.from, item.to, 'processing');

      this.confirmationWidgetData = {
        agentTitle: agent.title,
        paragraphRange: { from: item.from, to: item.to },

        originalText: item.text,
        nodeId: item.nodeId,
        conversationMessages: conversationMessages,

        isStreaming: true,
        originalAiSuggestion: '',
        aiSuggestion: '',

        promptResult: null,
      };

      let promiseResolve;
      const confirmationPromise = new Promise((resolve) => {
        promiseResolve = resolve;
      });
      this.currentConfirmationPromise = { resolve: promiseResolve };

      try {
        let ignored = false;

        const onInitialOutput = (fullText, newText, isFinished, isError, request, result) => {
          if (this.shouldAbortStreaming() || ignored || !this.confirmationWidgetData || request.isInstructionGeneratorRequest) {
            return;
          }

          this.confirmationWidgetData.isStreaming = true;

          this.confirmationWidgetData.executingPromptRequest = request;
          this.confirmationWidgetData.promptResult = result;

          if(!request.isPromptAgent) { // do not stream when analysing by agent
            this.confirmationWidgetData.aiSuggestion = fullText;
          }

          if (isFinished) {
            this.confirmationWidgetData.isStreaming = false;
            if (!isError && !this.shouldAbortStreaming()) {

              if (request.isPromptAgent) {
                if(this.shouldIgnoreAgentResult(fullText, request.promptAgent)) {
                  return;
                }
              }

              this.confirmationWidgetData.aiSuggestion = fullText;

              if (!this.confirmationWidgetData.originalAiSuggestion) {
                this.confirmationWidgetData.originalAiSuggestion = fullText;
              }

              if (this.shouldIgnoreAgentResult(this.confirmationWidgetData.aiSuggestion, agent)) {
                // Log ignored result
                this.addActionToHistory('🚫 Suggestion ignored', {
                  type: 'ignored',
                  paragraphId: item.nodeId,
                  reason: 'Agent returned ignore text'
                });

                this.projectAgentCurrentPromptRequest?.abortController?.abort();

                this.projectAgentSkippedParagraphs.add(item.nodeId);
                this.manageParagraphDecoration(item, 'remove');

                if (this.currentConfirmationPromise) {
                  this.currentConfirmationPromise.resolve('skipped');
                  this.currentConfirmationPromise = null;
                }

                ignored = true;
                return;
              }

              // Log suggestion
              this.addActionToHistory('✏️ Suggested change', {
                type: 'suggest',
                paragraphId: item.nodeId,
                preview: fullText.substring(0, 100) + (fullText.length > 100 ? '...' : '')
              });
              this.updateAgentStatus('Waiting for user confirmation...');

              this.manageParagraphDecoration(item, 'awaiting_confirmation');
            }
          }
        };

        //TODO bug - even if user aborts, it still waits to complete this before continuing with the next paragraph
        this.confirmationWidgetData.promptResult = await this.executeProjectAgentPrompt(onInitialOutput);
      } catch (error) {
        // Log error for project agent
        this.addActionToHistory('⚠️ Error occurred', {
          type: 'error',
          paragraphId: item.nodeId,
          error: error.message || 'Unknown error'
        });
        this.updateAgentStatus('Error occurred');

        this.confirmationWidgetData.isStreaming = false;
        return 'error';
      }

      const userChoice = await confirmationPromise;

      return userChoice;
    },
    async processIndependentAgent(agent) {
      // Generate full file content with node IDs
      const fullFileContent = this.generateFullFileWithNodeIds();
      if (!fullFileContent.trim()) {
        this.clearProjectAgent();
        return;
      }

      // Log agent start
      this.addActionToHistory('🚀 Agent started', {
        type: 'start',
        agentName: agent.title,
        documentLength: fullFileContent.split('\n').filter(line => line.trim()).length + ' paragraphs'
      });
      this.updateAgentStatus('Analyzing document...');

      try {

        const result = await this.executeIndependentAgentPrompt(fullFileContent);

        await this.processIndependentAgentResult(result, true);

      } catch (error) {
        // Log error
        this.addActionToHistory('⚠️ Error occurred', {
          type: 'error',
          error: error.message || 'Unknown error'
        });
        this.updateAgentStatus('Error occurred');

        this.clearProjectAgent();
        return;
      }

      await this.continueIndependentAgent(this.projectAgent);
    },
    async continueIndependentAgent(agent) {
      if (agent && !this.confirmationWidgetData?.isAgentStopped) {
        // Generate current file content for next iteration
        const currentFileContent = this.generateFullFileWithNodeIds();

        this.independentAgentChatHistory.push({
          type: 'user',
          text: `${currentFileContent}`
        })

        // Log continuation
        this.addActionToHistory('🔄 Continuing to next task', {
          type: 'continue'
        });
        this.updateAgentStatus('Looking for next task...');

        // Continue with the agent for next iteration
        await this.processIndependentAgent(agent);
      }
    },
    async processIndependentAgentResult(result, createNewWidget) {
      if (!result || this.shouldAbortStreaming()) {
        this.clearProjectAgent();
        return;
      }

      // Extract tool calls from the OpenAI response
      const completion = result.completionResponse;
      if (!completion || !completion.choices || completion.choices.length === 0) {
        this.clearProjectAgent();
        return;
      }

      const message = completion.choices[0].message;
      if (!message.tool_calls || message.tool_calls.length === 0) {
        // Log no tool calls
        this.addActionToHistory('⚠️ No actions suggested', {
          type: 'no_actions',
          reason: 'AI did not suggest any modifications'
        });
        this.updateAgentStatus('No actions to perform');

        this.clearProjectAgent();
        return;
      }

      for (const toolCall of message.tool_calls) {
        // Get the first tool call
        const toolCallResult = {
          toolName: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
          toolCallId: toolCall.id
        };

        // Execute the tool
        const toolResult = this.executeIndependentAgentTool(toolCallResult);

        if (toolResult.error) {
          console.log(toolResult.error);
          continue;
        }

        if (toolResult.action === 'stop') {
          // Log stop action
          this.addActionToHistory('🛑 Agent finished his work', {
            type: 'stop',
            reasoning: toolResult.reasoning
          });
          this.updateAgentStatus('Completed');

          this.clearProjectAgent();
          return;
        }

        if (toolResult.action === 'modify') {
          this.projectAgentCurrentProcessingParagraphItem = toolResult.targetNode;

          if(!this.projectAgentCurrentProcessingParagraphItem) {
            this.clearProjectAgent();
            return;
          }

          // Log modification suggestion
          this.addActionToHistory('✏️ Suggested modification', {
            type: 'suggest',
            paragraphId: this.projectAgentCurrentProcessingParagraphItem.nodeId,
            reasoning: toolResult.reasoning,
            preview: toolResult.newContent.substring(0, 100) + (toolResult.newContent.length > 100 ? '...' : '')
          });
          this.updateAgentStatus('Waiting for user confirmation...');

          if(createNewWidget || !this.confirmationWidgetData) {
            // Set up confirmation widget for independent agent
            this.confirmationWidgetData = {
              agentTitle: this.projectAgent.title,
              paragraphRange: { from: this.projectAgentCurrentProcessingParagraphItem.from, to: this.projectAgentCurrentProcessingParagraphItem.to },
              originalText: this.projectAgentCurrentProcessingParagraphItem.text,
              nodeId:  this.projectAgentCurrentProcessingParagraphItem.nodeId,
              conversationMessages: [...this.independentAgentChatHistory],
              isStreaming: false,
              originalAiSuggestion: toolResult.newContent,
              aiSuggestion: toolResult.newContent,
              promptResult: result,
              isIndependentAgent: true,
              reasoning: toolResult.reasoning,
              toolCallResult: toolResult
            };
          } else {
            this.confirmationWidgetData.aiSuggestion = toolResult.newContent;
            this.confirmationWidgetData.conversationMessages = [...this.independentAgentChatHistory];
            this.confirmationWidgetData.promptResult = result;
            this.confirmationWidgetData.reasoning = toolResult.reasoning;
            this.confirmationWidgetData.toolCallResult = toolResult;
          }

          this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'awaiting_confirmation');

          // Add to chat history
          this.independentAgentChatHistory.push({
            type: 'assistant',
            text: `Used tool: modifyParagraph\nTarget: ${this.projectAgentCurrentProcessingParagraphItem.nodeId}\nReasoning: ${toolResult.reasoning}`
          });

          let promiseResolve;
          const confirmationPromise = new Promise((resolve) => {
            promiseResolve = resolve;
          });
          this.currentConfirmationPromise = { resolve: promiseResolve };

          const confirmationResult = await confirmationPromise;

          // Add tool result to assistant history
          if(confirmationResult === 'accepted') {
            this.independentAgentChatHistory.push({
              type: 'function',
              name: 'modifyParagraph',
              toolCallId: toolCallResult.toolCallId,
              text: `Successfully modified paragraph ${this.projectAgentCurrentProcessingParagraphItem.nodeId}. User ACCEPTED the change.`
            });

            // Log user acceptance
            this.addActionToHistory('✅ User accepted change', {
              type: 'user_accept',
              paragraphId: this.projectAgentCurrentProcessingParagraphItem.nodeId
            });

            this.confirmationWidgetData = null;
          } else if (confirmationResult === 'skipped') {
            this.independentAgentChatHistory.push({
              type: 'function',
              name: 'modifyParagraph',
              toolCallId: toolCallResult.toolCallId,
              text: `Modification of paragraph ${this.projectAgentCurrentProcessingParagraphItem.nodeId} was SKIPPED by user. Do not suggest it again!`
            });

            // Log user rejection
            this.addActionToHistory('❌ User skipped change', {
              type: 'user_skip',
              paragraphId: this.projectAgentCurrentProcessingParagraphItem.nodeId
            });

            this.confirmationWidgetData = null;
          }

          const editorStore = useEditorStore();

          editorStore.clearAllAgentDecorations();
          this.currentConfirmationPromise = null;
        }
      }
    },
    async executeIndependentAgentPrompt(fullFileContent) {
      const promptStore = usePromptStore();

      try {
        const newRequest = cloneRequest(this.projectAgentCurrentPromptRequest);
        this.projectAgentCurrentPromptRequest = newRequest;

        newRequest.userPrompt = fullFileContent;
        newRequest.text = fullFileContent;
        newRequest.isProjectAgent = true;
        newRequest.isIndependentAgent = true;
        newRequest.abortController = new AbortController();
        newRequest.silent = true;
        newRequest.contextTypes = this.projectAgentContext;
        newRequest.tools = this.getIndependentAgentTools();

        if (this.independentAgentChatHistory.length > 0) {
          newRequest.appendMessages = [...this.independentAgentChatHistory];
        }

        const result = await promptStore.promptInternalSimple(newRequest);

        return result;
      } catch (error) {
        this.clearProjectAgent();
        throw error;
      }
    },
    stopAgentProcessing() {
      const editorStore = useEditorStore();

      this.projectAgentUserAborted = true;

      if(editorStore.editor) {
        editorStore.editor.commands.blur();
      }

      // Log agent stop
      if (this.projectAgent) {
        this.addActionToHistory('🛑 User stopped agent', {
          type: 'user_stop',
          agentType: this.projectAgent.isIndependent ? 'independent' : 'paragraph_based'
        });
        this.updateAgentStatus('Stopped by user');
      }

      this.projectAgentCurrentPromptRequest?.abortController?.abort();

      if (this.currentConfirmationPromise) {
        this.currentConfirmationPromise.resolve('stopped');
        this.currentConfirmationPromise = null;
      }

      this.clearProjectAgent();
    },
    generateFullFileWithNodeIds() {
      const editorStore = useEditorStore();
      const editor = editorStore.editor;

      if (!editor) return '';

      const doc = editor.state.doc;
      let fullContent = '';

      doc.nodesBetween(0, doc.content.size, (node, pos) => {
        if (node.type.name === 'paragraph') {
          const from = pos;
          const to = pos + node.nodeSize;
          const text = editorTextBetween(doc, { from, to }, '\\n', '\\n');

          if (text.trim().length > 0) {
            fullContent += `[${node.attrs.id}]: ${text.trim()}\n\n`;
          }
        }
      });

      return fullContent;
    },
    findParagraphByNodeId(nodeId) {
      const editorStore = useEditorStore();
      const editor = editorStore.editor;

      if (!editor) return null;

      const doc = editor.state.doc;
      let foundItem = null;

      doc.nodesBetween(0, doc.content.size, (node, pos) => {
        if (foundItem) return false;

        if (node.type.name === 'paragraph' && node.attrs.id === nodeId) {
          const from = pos;
          const to = pos + node.nodeSize;
          const text = editorTextBetween(doc, { from, to }, '\\n', '\\n');

          foundItem = {
            node,
            pos,
            from,
            to,
            text: text.trim(),
            nodeId: node.attrs.id
          };
        }
      });

      return foundItem;
    },
    getIndependentAgentTools() {
      return [
        {
          type: "function",
          function: {
            name: "modifyParagraph",
            description: "Modify the content of a specific paragraph in the document",
            parameters: {
              type: "object",
              properties: {
                nodeId: {
                  type: "string",
                  description: "The ID of the paragraph node to modify"
                },
                newContent: {
                  type: "string",
                  description: "The new content to replace the paragraph with"
                },
                reasoning: {
                  type: "string",
                  description: "Explanation of why this change is being made"
                }
              },
              required: ["nodeId", "newContent", "reasoning"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "stop",
            description: "Stop the agent processing when no more changes are needed",
            parameters: {
              type: "object",
              properties: {
                reasoning: {
                  type: "string",
                  description: "Explanation of why processing is being stopped"
                }
              },
              required: ["reasoning"]
            }
          }
        }
      ];
    },
    executeIndependentAgentTool(toolCall) {
      const { toolName, arguments: args } = toolCall;

      switch (toolName) {
        case 'modifyParagraph':
          return this.executeModifyParagraphTool(args);
        case 'stop':
          return this.executeStopTool(args);
        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    },
    executeModifyParagraphTool(args) {
      const { nodeId, newContent, reasoning } = args;

      if (!nodeId || !newContent || !reasoning) {
        return { error: "Missing required arguments for modifyParagraph" };
      }

      // Find the target paragraph
      const targetNode = this.findParagraphByNodeId(nodeId);
      if (!targetNode) {
        return { error: `Paragraph with ID ${nodeId} not found` };
      }

      return {
        success: true,
        action: 'modify',
        targetNode,
        newContent,
        reasoning
      };
    },
    executeStopTool(args) {
      const { reasoning } = args;

      if (!reasoning) {
        return { error: "Missing reasoning for stop" };
      }

      return {
        success: true,
        action: 'stop',
        reasoning
      };
    },
  },
});
