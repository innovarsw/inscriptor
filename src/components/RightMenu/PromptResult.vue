<template>

  <bubble-menu :editor="editor" :tippy-options="{ duration: 100 }" v-if="editor" >
    <q-card class="bubble-menu">
      <q-card-section class="q-pa-xs q-gutter-xs">
        <div class="row q-gutter-x-xs">
          <div class="col-auto">
            <q-btn @click="promptResultInlinePrompt(promptResult.prompt, 'Expand')" label="Expand" no-caps size="12px" dense flat icon="mdi-creation-outline" padding="4px 6px" class="bg-theme-primary" color="primary" :loading="replyLoading">
            </q-btn>
          </div>
          <div class="col-auto">
            <q-btn @click="promptResultInlinePrompt(promptResult.prompt, 'Explain')" label="Explain" no-caps size="12px" dense flat icon="mdi-creation-outline" padding="4px 6px" class="bg-theme-primary" color="primary" :loading="replyLoading">
            </q-btn>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <q-input autofocus dense filled v-model="inlineReactText" label="Instruction" />
          </div>
          <div class="col-auto flex items-center">
            <q-btn @click="promptResultInlinePrompt(promptResult.prompt, inlineReactText)" no-caps size="12px" dense flat icon="mdi-send" padding="4px 6px" class="bg-theme-primary" color="primary" :loading="replyLoading">
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </bubble-menu>

  <template v-if="showAsChat">

    <div class="row">
      <div class="chat-message chat-user-message q-mt-md" style="">
        <div class="chat-message-header">
          <span class="chat-message-role">You:</span>
        </div>
        <div class="chat-message-content">
          <contenteditable tag="span" ref="userPromptInput" contenteditable="true" v-model="promptResultInput" :no-html="false">
          </contenteditable>
        </div>
      </div>
    </div>

  </template>

  <transition appear enter-active-class="animated fadeIn slow" leave-active-class="animated fadeOut">

    <q-card :class="[isReactionToAnotherPrompt ? 'q-ml-md' : '', isPreviousPromptResult ? 'gradient-variation-3' : 'gradient-variation-1']" class="hoverable-card idea-card  q-pa-xs no-p-margin">
      <div class="prompt-actions" :class="type === 'inline' ? '' : 'sticky-top'">
        <div class="row no-wrap ellipsis">
          <div class="col-auto">
            <q-btn color="grey-7" flat unelevated size="sm" :icon="type === 'inline' ? 'mdi-plus' : 'mdi-chevron-double-left'" @click="insert" :loading="copying" class="hoverable-btn-semi">
              <q-tooltip :delay="1000">
                Click to insert
              </q-tooltip>
            </q-btn>
          </div>
          <div class="col-auto" v-if="hasCopy">
            <q-btn color="grey-7" flat unelevated size="sm" icon="mdi-content-copy" v-if="type !== 'inline'" class="hoverable-btn-semi">
              <q-menu>
                <q-list dense>
                  <template v-if="!hasImages">
                    <q-item clickable @click="copyToClipboard($event)">
                      <q-item-section side>
                        <q-icon name="mdi-clipboard-multiple-outline" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Copy to clipboard
                      </q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable @click="copyToVariable($event, variable)" v-for="variable in variables" :key="variable.title">
                      <q-item-section side>
                        <q-icon name="mdi-cogs" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Copy to variable ${{variable.title}}
                      </q-item-section>
                    </q-item>
                  </template>
                  <template v-if="hasImages">
                    <q-separator />
                    <q-item clickable @click="copyToFileImage($event)">
                      <q-item-section side>
                        <q-icon name="mdi-image-outline" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Copy to file cover image
                      </q-item-section>
                    </q-item>
                  </template>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

          <div class="col ellipsis" v-if="showPromptInfo">
            <q-badge class="q-ml-md q-gutter-x-xs hoverable-btn-semi">
              <span>{{ promptResultTitle }}</span>
              <span v-if="promptResultModel?.length > 0"><q-icon name="mdi-chip"  />{{ promptResultModel }}</span>
              <span v-if="promptResultTemperature"><q-icon  name="mdi-thermometer-low" /> {{ promptResultTemperature }}</span>
            </q-badge>
          </div>

          <div class="col" v-if="isPreviousPromptResult">
            <q-badge class="q-ml-md q-gutter-x-xs hoverable-btn-semi">
              <q-icon name="mdi-history" />
              <span>{{ promptResult.title }}</span>
            </q-badge>
          </div>
          <div class="col" v-else />

          <div class="col-auto" v-if="collapsed">
            <q-btn color="grey-7" flat unelevated size="sm" :icon="collapsed ? 'mdi-plus-square' : 'mdi-minus-box-outline'" @click="collapsed = !collapsed" class="hoverable-btn-semi">
            </q-btn>
          </div>
          <div class="col-auto" v-if="hasClose">
            <q-btn color="grey-7" flat unelevated size="sm" icon="mdi-close" @click="onClose" class="hoverable-btn-semi">
            </q-btn>
          </div>
          <div class="col-auto" v-else-if="showMenu">
            <div class="col-auto">
              <q-btn color="grey-7" flat unelevated size="sm" icon="mdi-dots-vertical" class="hoverable-btn-semi">
                <q-menu>
                  <q-list dense>
                    <q-item clickable @click="expanded = !expanded; collapsed = false">
                      <q-item-section side>
                        <q-icon name="mdi-arrow-expand" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        {{ expanded ? 'Collapse' : 'Expand' }}
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="collapsed = !collapsed" v-if="!isPrompting && type !== 'inline'">
                      <q-item-section side>
                        <q-icon :name="collapsed ? 'mdi-plus-square' : 'mdi-minus-box-outline'" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        {{ collapsed ? 'Maximize' : 'Minimize' }}
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="htmlViewOverride = !(htmlView ?? defaultHtmlView)">
                      <q-item-section side>
                        <q-icon name="mdi-view-agenda-outline" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Toggle view
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="editEnabled = !editEnabled">
                      <q-item-section side>
                        <q-icon name="mdi-pen" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Edit
                      </q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable @click="removePromptResult($event)" v-if="!isPrompting && type !== 'inline'" class="text-negative">
                      <q-item-section side>
                        <q-icon name="mdi-delete-outline" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Delete
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>
          <div class="col-auto">
            <q-btn class="float-right hoverable-btn-semi" flat color="warning" unelevated size="sm" icon="mdi-stop" @click.prevent="stopPrompting($event)" v-if="isPrompting" >
              <q-tooltip>Stop</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
      <q-card-section v-if="collapsed === false" class="">
        <q-spinner-grid v-if="promptResult.waitingForResponse" />

        <div class="q-pa-none" :class="classes">
          <template v-if="hasImages">
            <q-img v-for="(image, index) in promptResult.images" :src="imageUrl(image)" :key="index" fit="contain" height="400px" />
          </template>

          <div v-if="hasAppendMessages" class="chat-history-container q-mb-md">
            <div class="chat-messages-container cursor-pointer">
              <div v-if="!appendMessagesExpanded" class="chat-message chat-user-message q-my-sm" @click="appendMessagesExpanded = true">
                <div class="chat-message-header">
                  <span class="chat-message-role">You:</span>
                  <span class="chat-message-time">
                    <q-btn icon="mdi-expand-all-outline" size="sm" @click="appendMessagesExpanded = true" color="primary" flat dense no-caps />
                  </span>
                </div>
                <div class="chat-message-content">
                  {{ lastUserAppendMessage.text }}
                </div>
              </div>

              <div v-if="appendMessagesExpanded" @click="appendMessagesExpanded = false">
                <div v-for="(message, index) in promptResult.appendMessages" :key="index">
                  <div v-if="message.type === 'assistant'" >
                    <div class="chat-message chat-ai-message q-my-sm">
                      <div class="chat-message-header">
                        <span class="chat-message-role">AI:</span>
                      </div>
                      <div class="chat-message-content">
                        <div v-html="markdownToHtml(message.text)" />
                      </div>
                    </div>


                  </div>
                  <template v-if="message.type === 'user'">
                    <div class="chat-message chat-user-message q-my-sm">
                      <div class="chat-message-header">
                        <span class="chat-message-role">You:</span>
                      </div>
                      <div class="chat-message-content">
                        <span v-html="message.text" />
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div v-if="promptResult.prompt.promptStyle === 'brainstorm-ui'" class="q-mb-md">
            <q-btn color="grey-7" label="Open" no-caps size="sm" icon="mdi-open-in-new" @click="useLayoutStore().openPromptUiDialog(promptResult)">
            </q-btn>
          </div>


          <template v-if="promptResult.prompt.promptStyle === 'brainstorm'">
            <template v-if="promptBrainstormValueTree != null && promptBrainstormValueTree.length> 0">
              <q-card v-for="(idea, index) in promptBrainstormValueTree" :key="index" flat class="no-margin bg-transparent">
                <q-card-section class="q-px-sm q-py-none">
                  <div class="prompt-brainstorm-idea">
                    <q-btn @click="promptBrainstormValueTree.splice(index, 1)" flat size="sm" class="float-right" icon="mdi-close" color="negative" dense />
                    <span v-html="markdownToHtml(idea.text)"></span>

                    <div class="full-width flex q-my-xs prompt-brainstorm-actions">
                      <template v-if="!idea.loading">
                        <q-btn flat padding="xs xs" no-caps color="primary" size="sm" icon="mdi-creation-outline" label="Expand" @click="promptTreeRespond(idea, 'Create ideas that are building on this idea')" class="q-mr-md"/>
                        <q-btn flat padding="xs xs" no-caps color="primary" icon="mdi-creation-outline" size="sm" label="Similar" @click="promptTreeRespond(idea, 'Create ideas similar to this idea')"  class="q-mr-md"/>
                        <template v-if="idea.customReplyEnabled">
                          <q-input v-model="idea.customReply" filled dense autofocus autogrow/>
                          <q-btn flat padding="xs sm" no-caps color="primary" icon="mdi-reply-outline" size="sm" @click="idea.customReplyEnabled = false; promptTreeRespond(idea, 'Perform this custom instruction - \'' + idea.customReply + '\'')" class="q-mr-sm"/>
                          <q-btn flat padding="xs sm" no-caps color="primary" icon="mdi-close" size="sm" @click="idea.customReplyEnabled = false"  class="q-mr-sm"/>
                        </template>
                        <template v-else>
                          <q-btn flat padding="xs xs" no-caps color="primary" icon="mdi-creation-outline" size="sm" label="Reply" @click="idea.customReplyEnabled = true"  class="q-mr-sm"/>
                        </template>

                      </template>
                    </div>

                    <q-card v-if="idea.children && idea.children.length > 0" bordered flat class="bg-grey-1 q-py-md q-mb-md">
                      <template v-for="(child, i) in idea.children " :key="i">
                        <q-card-section class="q-px-md q-py-none" >
                          <q-btn @click="idea.children.splice(i, 1)" flat size="sm" class="float-right" icon="mdi-close" color="negative" dense />
                          <span v-html="markdownToHtml(child.text)" class=""></span>


                          <div class="full-width flex q-my-xs prompt-brainstorm-actions">
                            <template v-if="!child.loading">
                              <q-btn flat padding="xs xs" no-caps color="primary" icon="mdi-creation-outline" size="sm" label="Expand" @click="promptTreeRespond(child, 'Create ideas that are expanding on this idea')"  class="q-mr-sm"/>
                              <q-btn flat padding="xs xs" no-caps color="primary" icon="mdi-creation-outline" size="sm" label="Similar" @click="promptTreeRespond(child, 'Create ideas similar to this idea')"  class="q-mr-sm"/>
                              <template v-if="child.customReplyEnabled">
                                <q-input v-model="child.customReply" filled dense autofocus autogrow/>
                                <q-btn flat padding="xs sm" no-caps color="primary" icon="mdi-reply-outline" size="sm" @click="child.customReplyEnabled = false; promptTreeRespond(child, 'Perform this custom instruction - \'' + child.customReply + '\'')" class="q-mr-sm"/>
                                <q-btn flat padding="xs sm" no-caps color="primary" icon="mdi-close" size="sm" @click="child.customReplyEnabled = false"  class="q-mr-sm"/>
                              </template>
                              <template v-else>
                                <q-btn flat padding="xs xs" no-caps color="primary" icon="mdi-creation-outline" size="sm" label="Reply" @click="child.customReplyEnabled = true"  class="q-mr-sm"/>
                              </template>
                            </template>
                          </div>
                          <div v-if="child.loading">
                            <q-spinner-grid class="q-mt-sm q-mb-md" />
                            <div v-html="formatPendingBrainstormingPrompt(child.progressText, promptResult.prompt.resultsSeparator ?? '&lt;split/&gt;')" class="q-pa-md rounded-borders bg-blue-grey-1" />
                          </div>

                          <q-card v-if="child.children && child.children.length > 0" bordered flat class="q-mt-md bg-blue-grey-1 q-mb-md">

                            <template v-for="(childChild, ii) in child.children " :key="ii">
                              <q-card-section class="q-pa-md">
                                <q-btn @click="child.children.splice(ii, 1)" flat size="sm" class="float-right" icon="mdi-close" color="negative" dense />
                                <span v-html="markdownToHtml(childChild.text)"></span>
                              </q-card-section>
                            </template>
                          </q-card>

                        </q-card-section>
                      </template>
                    </q-card>

                  </div>
                  <div v-if="idea.loading">
                    <q-spinner-grid class="q-mt-sm q-mb-md" />
                    <div v-html="formatPendingBrainstormingPrompt(idea.progressText, promptResult.prompt.resultsSeparator ?? '&lt;split/&gt;')" class="q-pa-md bordered rounded-borders bg-grey-1" />
                  </div>
                </q-card-section>
              </q-card>
            </template>
            <template v-else>
              <div v-html="formatPendingBrainstormingPrompt(promptResultText, promptResult.prompt.resultsSeparator ?? '&lt;split/&gt;')" />
            </template>
          </template>
          <template v-else-if="promptResult.prompt.promptStyle === 'mermaid'">
            <vue-mermaid-string :value="promptResult.text" :options="{ securityLevel: 'loose' }"/>
          </template>
          <template v-else>
            <q-input v-if="!hasImages && editEnabled" filled dense v-model="promptResultText" type="textarea"
              autogrow />
            <template v-else-if="promptResultText">
              <div v-if="!hasImages && !htmlView" :class="writeClasses" class="no-outline" v-html="promptResultText" ref="promptResultRef" />
              <div class="q-mx-sm">
                <editor-content v-if="htmlView" :editor="editor" spellcheck="false" class="no-outline" :class="writeClasses" />
              </div>
            </template>
          </template>
        </div>

        <div v-if="promptResult.error">
          <span class="text-negative">
            <q-icon name="mdi-exclamation-thick" />
            Error while prompting: {{ promptResult.error }}
          </span>
        </div>

        <div v-if="promptResult.analysingByAgent" class="q-mt-lg text-caption">
          <q-spinner-grid class="q-mr-sm" />
          <span v-if="promptResult.analysingByAgentMessage">
            {{ promptResult.analysingByAgentMessage }}
          </span>
          <span v-else>
            Analysing by {{ promptResult.analysingByAgent.title }}...
          </span>

          <div class="row q-mt-sm">
            <q-btn color="negative" dense unelevated size="sm" no-caps icon="mdi-close" @click="promptStore.abortAgentAnalysis(promptResult)" label="Abort" />
          </div>
        </div>

      </q-card-section>

      <div v-if="type === 'inline'" class="row prompt-actions">
        <q-btn class="text-weight-bold hoverable-btn-semi" label="Reply" no-caps flat color="grey-7" unelevated size="sm" icon="mdi-reply-outline" @click.prevent="toggleReply()" :loading="replyLoading" >
          <q-tooltip>Reply on this prompt to AI</q-tooltip>
        </q-btn>
      </div>

      <div v-if="!isPrompting && allowRegenerate && collapsed === false && promptResult.prompt.promptType !== 'chat' && promptResult.prompt.promptStyle !== 'brainstorm-ui'" class="row prompt-actions overflow-hidden-y">
        <div class="col-auto">
          <q-btn class="text-weight-bold hoverable-btn-semi" label="Reply" no-caps flat color="grey-7" unelevated size="sm" icon="mdi-reply-outline" @click.prevent="toggleReply()">
            <q-tooltip>Reply on this prompt to AI</q-tooltip>
          </q-btn>
        </div>

        <div class="col q-ml-md">
          <q-btn class="col-auto text-weight-bold hoverable-btn-semi" flat color="grey-7" unelevated size="sm"
            @click.prevent="generateFollowUpQuestions()" icon="mdi-creation-outline"
            v-if="promptStore.getPredefinedPromptId('Prompt Follow-Up Generator')"
            :loading="promptStore.isSilentPrompting">
            <q-tooltip>
              Generate Follow-up questions
            </q-tooltip>
          </q-btn>
          <template v-if="promptResult.followUpQuestions">
            <template v-for="question in promptResult.followUpQuestions" :key="question.title">
              <q-btn class="col-auto text-weight-bold hoverable-btn-semi" :label="question.title" flat color="accent" unelevated size="sm" no-caps
                @click.prevent="doPromptAction({type: 'Reply', typeParameter: question.followUp})">
                <q-tooltip>
                  Reply: '{{ question.followUp }}'
                </q-tooltip>
              </q-btn>
            </template>
            <q-btn class="col-auto text-weight-bold hoverable-btn-semi" flat color="grey-7" unelevated size="sm" no-caps
              @click.prevent="removeFollowUpQuestions()" icon="mdi-close">
            </q-btn>
          </template>
          <template v-else>
            <template v-for="(promptAction, index) in promptResult.prompt.actions ?? []" :key="index">
              <q-btn class="col-auto text-weight-bold hoverable-btn-semi" :label="promptAction.title" flat color="grey-7" unelevated no-caps
                size="sm" @click.prevent="doPromptAction(promptAction)" :icon="getPromptActionIcon(promptAction)">
                <q-tooltip v-if="promptAction.type === 'Add to Context'">
                  Add this text to a file with context '{{promptAction.typeParameter}}'
                </q-tooltip>
                <q-tooltip v-if="promptAction.type === 'Run Prompt'">
                  Runs prompt with this text as input
                </q-tooltip>
                <q-tooltip v-if="promptAction.type === 'Save to Variable'">
                  Saves this text to a variable
                </q-tooltip>
                <q-tooltip v-if="promptAction.type === 'Reply'">
                  Reply: '{{ promptAction.typeParameter }}'
                </q-tooltip>
              </q-btn>
            </template>
          </template>
        </div>

        <q-space />

        <div class="col-auto">
          <q-btn v-if="!promptResult.prompt.enablePromptRuns" class="text-weight-bold float-right hoverable-btn-semi" flat color="grey-7"
            unelevated size="sm" icon="arrow_drop_down">
            <q-menu>
              <q-list dense>

                <q-item clickable v-ripple>
                  <q-item-section>Prompt with creativity...</q-item-section>
                  <q-item-section side>
                    <q-icon name="keyboard_arrow_right" />
                  </q-item-section>

                  <q-menu anchor="top end" self="top start">
                    <q-list dense>
                      <q-item clickable v-close-popup @click="regeneratePrompt($event, false, 1)">
                        <q-item-section side>
                          <q-icon name="mdi-palette" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>Very Creative (temperature 1)</q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-item clickable v-close-popup @click="regeneratePrompt($event, false, 0.8)">
                        <q-item-section side>
                          <q-icon name="mdi-palette-outline" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>Creative (temperature 0.8)</q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-item clickable v-close-popup @click="regeneratePrompt($event, false, 0.5)">
                        <q-item-section side>
                          <q-icon name="mdi-keyboard-outline" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>Deterministic (temperature 0.5)</q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-item clickable v-close-popup @click="regeneratePrompt($event, false, 0)">
                        <q-item-section side>
                          <q-icon name="mdi-keyboard" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>Very Deterministic (temperature 0)</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-item>

                <q-item clickable v-ripple>
                  <q-item-section>Prompt using model...</q-item-section>
                  <q-item-section side>
                    <q-icon name="keyboard_arrow_right" />
                  </q-item-section>

                  <q-menu anchor="top end" self="top start">
                    <q-list>


                      <q-item v-for="model in promptStore.models" :key="model"
                        @click="regeneratePrompt($event, false, undefined, model)" dense clickable>
                        <q-item-section side>
                          <q-icon name="mdi-chip" size="xs" />
                        </q-item-section>
                        <q-item-section>{{ model.name }}</q-item-section>
                      </q-item>

                    </q-list>
                  </q-menu>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn class="text-weight-bold hoverable-btn-semi" label="Prompt Again" flat color="grey-7" unelevated size="sm" no-caps
                 icon="mdi-sync" @click.prevent="regeneratePrompt($event, false)">
            <q-tooltip>Generate this prompt again</q-tooltip>
          </q-btn>
        </div>

      </div>

      <q-slide-transition>
        <div v-show="reactExpanded" class="row q-mx-md q-pb-sm">
          <div class="col q-mr-sm">
            <q-input v-model="reactInput" borderless dense label="Message" autofocus autogrow ref="reactInputRef" @keyup="onReplyKeyup" />
          </div>
          <div class="col-auto">
            <q-btn icon="mdi-reply-outline" @click="promptReactClick()" color="grey-7" />
          </div>
        </div>
      </q-slide-transition>

      <q-menu touch-position context-menu>
        <q-card>
          <PromptSelector prompt-types="selection" @promptClick="promptClick"></PromptSelector>
        </q-card>
      </q-menu>
    </q-card>

  </transition>

  <div v-if="promptResult.prevResults && promptResult.prevResults.length > 0" class="text-center">
    <q-btn class="text-weight-bold hoverable-btn-semi" :label="previousResultsExpanded ? 'Hide results before agents' : 'Show results before agents (' + promptResult.prevResults.length + ')'" flat color="grey-7" unelevated size="sm" no-caps @click="previousResultsExpanded = !previousResultsExpanded" />
  </div>

  <template v-if="previousResultsExpanded && promptResult.prevResults && promptResult.prevResults.length > 0">
    <template v-for="(previousResult, index) in promptResult.prevResults" :key="index">
      <transition appear enter-active-class="animated fadeIn slow" leave-active-class="animated fadeOut">
        <div class="q-mx-md">
          <PromptResult :prompt-result="previousResult" :showPromptInfo="false" :isPreviousPromptResult="true" />
        </div>
      </transition>
    </template>
  </template>

  <div class="row q-mr-md q-mt-md" v-if="inlinePromptResult">
    <PromptResult :promptResult="inlinePromptResult" type="inline" has-close @close="inlinePromptResult = null" :show-prompt-info="false" @replace-self="replacePromptResult"/>
  </div>
</template>

<script setup>
  import {useTextSelection} from '@vueuse/core'
  import {computed, ref, watch} from "vue";
  import { writeText } from '@tauri-apps/plugin-clipboard-manager';
  import {usePromptStore} from "stores/prompt-store";
  import {cloneRequest, executePromptClick2} from "src/common/helpers/promptHelper";
  import {
    convertHtmlToText,
    convertToParagraphs,
    hasMultiBreaks,
    markdownToHtml,
    replaceParameterEditorText, truncate
  } from "src/common/utils/textUtils";
  import PromptSelector from "components/Common/PromptSelector/PromptSelector.vue";
  import contenteditable from 'vue-contenteditable';
  import {useFileStore} from "stores/file-store";
  import {useQuasar} from "quasar";
  import {uploadImage} from "src/common/apiServices/imageGenService";
  import {useCurrentUser} from "vuefire";
  import {useLayoutStore} from "stores/layout-store";
  import {editorTextBetween, getEditor, getEditorSelection} from "src/common/utils/editorUtils";
  import {BubbleMenu, EditorContent, FloatingMenu, useEditor} from "@tiptap/vue-3";
  import Document from "@tiptap/extension-document";
  import Paragraph from "@tiptap/extension-paragraph";
  import Text from "@tiptap/extension-text";
  import Image from "@tiptap/extension-image";
  import History from "@tiptap/extension-history";
  import {HardBreak} from "@tiptap/extension-hard-break";
  import {Link} from "@tiptap/extension-link";
  import {Underline} from "@tiptap/extension-underline";
  import {Italic} from "@tiptap/extension-italic";
  import {Bold} from "@tiptap/extension-bold";
  import {CodeBlock} from "@tiptap/extension-code-block";
  import {ListItem} from "@tiptap/extension-list-item";
  import {BulletList} from "@tiptap/extension-bullet-list";
  import {OrderedList} from "@tiptap/extension-ordered-list";
  import {Heading} from "@tiptap/extension-heading";
  import {Blockquote} from "@tiptap/extension-blockquote";
  import VueMermaidString from 'vue-mermaid-string'

  const promptStore = usePromptStore();
  const fileStore = useFileStore();
  const $q = useQuasar();

  const reactInputRef = ref();
  const previousResultsExpanded = ref(false);

  const props = defineProps({
    promptResult: Object,
    showAsChat: {
      type: Boolean,
      default: false,
    },
    allowRegenerate: {
      type: Boolean,
      default: false,
    },
    insertTarget: {
      type: Object,
    },
    insertFunc: {
      type: Function,
    },
    type: {
      type: String,
      default: 'default',
    },
    hasClose: {
      type: Boolean,
      default: false,
    },
    showPromptInfo: {
      type: Boolean,
      default: true,
    },
    isPreviousPromptResult: {
      type: Boolean,
      default: false,
    },
    showMenu: {
      type: Boolean,
      default: true,
    },
    hasCopy: {
      type: Boolean,
      default: true,
    }
  });

  const selection = useTextSelection();

  const emits = defineEmits(['close', 'replaceSelf', 'onInsert']);

  function onClose() {
    emits('close')
  }

  const expanded = ref(false);
  const userPromptInput = ref(null);
  const promptResultRef = ref(null);
  const reactInput = ref('');
  const reactExpanded = ref(false);
  const appendMessagesExpanded = ref(false);
  const replyLoading = ref(false);

  const collapsed = computed({
    get: () => {
      return props.promptResult.collapsed;
    },
    set: (value) => {
      const pr = props.promptResult;
      pr.collapsed = value;
    }
  })
  const defaultHtmlView = computed(() => {
    if(props.promptResult.prompt.promptStyle === 'change') {
      return false;
    }
    return true;
  });
  const htmlViewOverride = ref(null);
  const htmlView = computed(() => {
    if(htmlViewOverride.value !== null) {
      return htmlViewOverride.value;
    }
    return defaultHtmlView.value;
  });

  const editEnabled = ref(false);

  const hasImages = computed(() => {
    return props.promptResult.type === 'image' && (props.promptResult.images?.length > 0 ?? false)
    });

  const classes = computed(() => {
    return {
      //'bg-grey-1': isHovered.value,
      'prompt-card': !hasImages.value && !expanded.value,
      'prompt-card-expanded': !hasImages.value && expanded.value,
      //'prompt-card-image': hasImages.value,
    }
  });

  const writeClasses = computed(() => {
    return {
      'write-serif': (fileStore.selectedFile?.settings?.fontType ?? 'serif') === 'serif',
      'write-sans-serif': fileStore.selectedFile?.settings?.fontType === 'sans-serif',
      'write-monospace': fileStore.selectedFile?.settings?.fontType === 'monospace',
      'write-small': fileStore.selectedFile?.settings?.fontSize === 'small',
      'write-medium': (fileStore.selectedFile?.settings?.fontSize ?? 'medium') === 'medium',
      'write-large': fileStore.selectedFile?.settings?.fontSize === 'large',

      'text-editor': props.type !== 'inline' && (fileStore.selectedFile?.settings?.editorType ?? 'regular') === 'regular',
      'text-editor-condensed': props.type !== 'inline' && fileStore.selectedFile?.settings?.editorType === 'condensed',
      'text-editor-non-indented': props.type === 'inline' || fileStore.selectedFile?.settings?.editorType === 'non-indented',

      'prompt-text-editor': true,

      'prompt-results': true,
    }
  });

  const variables = computed(() => {
    return fileStore.variables;
  });

  const hasAppendMessages = computed(() => {
    return props.promptResult.appendMessages && props.promptResult.appendMessages.length > 0;
  });

  const isReactionToAnotherPrompt = computed(() => {
    return hasAppendMessages.value;
  });

  const appendMessagesCount = computed(() => {
    return props.promptResult.appendMessages.length;
  });

  const lastUserAppendMessage = computed(() => {
    const msgs = props.promptResult.appendMessages.filter(msg => msg.type === 'user');
    return msgs[msgs.length - 1] ?? null;
  });

  function imageUrl(imgName) {
    //return url + "/Files/Images/" + imgName;
    return imgName;
  }

  const promptResultInput = computed({
    get: () => {
      return props.promptResult.input;
    },
    set: (value) => {
      const pr = props.promptResult;
      pr.input = value;
    }
  });

  const inlineReactText = ref('');

  const promptBrainstormValueTree = computed(() => {
    if(isPrompting.value === true) {
      return null;
    }

    if(!props.promptResult.text) {
      return null;
    }

    const pr = props.promptResult;
    if(pr.valueTree && pr.valueTreeInput === pr.text) {
      return pr.valueTree;
    }

    const separator = props.promptResult.prompt.resultsSeparator ?? '<split/>'
    let tree = pr.text.split(separator).map(item => ({ text: item })).filter(item => item.text.trim() !== '');

    pr.valueTreeInput = pr.text;
    pr.valueTree = tree;

    return props.promptResult.valueTree;
  });

  function formatPendingBrainstormingPrompt(text, separator) {
    //TODO take separator from prompt, encode it
    return text.replaceAll(separator, '<br><br>').replaceAll('\n', '<br>').replaceAll('<br><br>', '<br>').replaceAll('<br><br>', '<br>');
  }

  const promptResultText = computed({
    get: () => {
      //console.log(props.promptResult.text);
      //return props.promptResult.text.trimStart().replace(/\n/g, '<br>');

      if(editEnabled.value === true) {
        return (props.promptResult.originalText.trimStart());
      }

      if(htmlView.value === true) {
        return markdownToHtml((props.promptResult.originalText ?? props.promptResult.text).trimStart()).replace(/\\n/g, '<br>');
      }

      const doDiff = props.promptResult.diff &&
        (!props.promptResult.prompt.promptStyle || props.promptResult.prompt.promptStyle === 'change');

      if(!doDiff) {
        return (props.promptResult.text.trimStart());
      }

      let text = '';
      for(const part of props.promptResult.diff) {

        let value = part.value;
        if(part.added) { text += '<span class="text-green-7">' + value + '</span>'; }
        //else if(part.removed) { text += '<span class="text-negative">' + part.value + '</span>';}
        else if(!part.added && !part.removed) { text += value;}
      }

      /*for (const el of props.promptResult.diff) {
        if (el[0] === 1) { text += '<span class="text-positive">' + el[1] + '</span>'; }
        //else if (el[0] === -1) { text += '<span class="text-negative">' + el[1] + '</span>'; }
        else if(el[0] === 0) { text += el[1]; }
      }*/

      return (text);
    },
    set: (value) => {
      const pr = props.promptResult;
      pr.text = value;
      pr.originalText = value;
    }
  });

  async function doPromptAction(action, parameter) {
    await promptStore.runPromptResultAction(props.promptResult, action, parameter);
  }

  function removeFollowUpQuestions() {
    // eslint-disable-next-line vue/no-mutating-props
    props.promptResult.followUpQuestions = null;
  }

  async function generateFollowUpQuestions() {
    const promptId = promptStore.getPredefinedPromptId('Prompt Follow-Up Generator');
    if(!promptId || promptId.length === 0 || !props.promptResult.prompt.systemPrompt) {
      return;
    }

    let followUps = null;

    for (const id of promptId) {
      const prompt = promptStore.getPromptById(id);

      let message = prompt.userPrompt;

      message = message.replaceAll('$template_systemPrompt', props.promptResult.prompt.systemPrompt);
      message = message.replaceAll('$template_aiReply', props.promptResult.originalText);

      const previousQuestions = props.promptResult.followUpQuestions;
      if(previousQuestions) {
        message = message.replaceAll('$previousFollowups', '\n\n(These follow up questions have already been provided to the user, come up with new ones: ' + JSON.stringify(previousQuestions, null, 2) + ')');
      } else {
        message = message.replaceAll('$previousFollowups', '');
      }

      message += '$$$replaceUserPrompt$$$';

      console.log(message);

      const request = {
        prompt: prompt,
        text: message,
        clear: false,
        forceBypassMoreParameters: true,
        silent: true
      }

      const result = await executePromptClick2(request);

      try {
        //TODO to helper

        // remove ```json and ```
        const json = result.originalText.replace(/```json/g, '').replace(/```/g, '').trim();
        const newFollowUps = JSON.parse(json);

        if(!followUps) {
          followUps = newFollowUps;
        } else {
          followUps = followUps.concat(newFollowUps);
        }

      } catch (error) {
        console.error(error);
      }
    }

    // eslint-disable-next-line vue/no-mutating-props
    props.promptResult.followUpQuestions = followUps;
  }

  function getPromptActionIcon(action) {
    if(action.type === 'Add to Context') {
      return 'mdi-file-document-outline';
    }
    if(action.type === 'Run Prompt') {
      return 'mdi-creation-outline';
    }
    if(action.type === 'Save to Variable') {
      return 'mdi-cogs';
    }
    if(action.type === 'Reply') {
      return undefined;
    }
    return undefined;
  }

  async function promptClick(promptClickData) {
    const prompt = promptClickData.prompt;

    const request = {
      prompt: prompt,
      forceModelId: promptClickData.forceModelId,
      forceTemperature: promptClickData.forceTemperature,
      text: replaceParameterEditorText(promptResultText.value)
    }

    await executePromptClick2(request);
  }

  async function promptReactClick() {
    if(reactInput.value.trim() === '') return;

    const request = cloneRequest(props.promptResult.request);

    const appendMessages = [];

    let overrideText = null;
    if(request.prompt.promptStyle === 'mermaid') {
      overrideText = props.promptResult.text;
    }

    if(props.promptResult.appendMessages) {
      appendMessages.push(...props.promptResult.appendMessages);
    }
    appendMessages.push({type: 'assistant', text: overrideText ?? convertHtmlToText(replaceParameterEditorText(promptResultText.value))});
    appendMessages.push({type: 'user', text: reactInput.value});

    reactInput.value = '';
    reactExpanded.value = false;

    request.appendMessages = appendMessages;
    request.forceBypassMoreParameters = true;
    request.clear = false;
    //request.text: props.promptResult.input;

    if(props.type === 'inline') {
      replyLoading.value = true;

      request.silent = true;

      const result = await executePromptClick2(request);
      replyLoading.value = false;

      emits('replaceSelf', result);
    } else {
      collapsed.value = true;
      await executePromptClick2(request);
    }
  }

  async function promptTreeRespond(treeItem, instruction) {
    if(!instruction) return;
    const appendMessages = [];

    if(props.promptResult.appendMessages) {
      appendMessages.push(...props.promptResult.appendMessages);
    }

    appendMessages.push({type: 'assistant', text: convertHtmlToText(replaceParameterEditorText(promptResultText.value))});
    appendMessages.push({type: 'user', text: instruction + ': ' + treeItem.text});

    treeItem.progressText = '';

    replyLoading.value = true;

    treeItem.loading = true;

    const onOutput = (fullText, newText, isFinished, isError, request, result) => {
      treeItem.progressText = fullText;
    };

    const request = {
      prompt: props.promptResult.prompt,
      text: props.promptResult.input,
      clear: false,
      appendMessages: appendMessages,
      forceBypassMoreParameters: true,
      silent: true,
      forceShowContextSelection: false,
      onOutput
    }

    const result = await executePromptClick2(request);
    replyLoading.value = false;

    if(!treeItem.children) {
      treeItem.children = [];
    }

    const separator = props.promptResult.prompt.resultsSeparator ?? '<split/>'

    const childTree = result.text.split(separator).map(item => ({ text: item })).filter(item => item.text.trim() !== '');

    treeItem.children.push(...childTree);

    treeItem.loading = false;

    return result;
  }

  function formatBrainstormBubbles(promptResult) {
    const separator = props.promptResult.prompt.resultsSeparator ?? '<split/>'

    let mindmap =
      `graph TD
`;
    const ideas = promptResult.split(separator).map((item, index) => ({ title: ('id' + index), text: item })).filter(item => item.text.trim() !== '');

    for (const idea of ideas) {
      mindmap += '\n    mindmap --> ' + idea.title + '["' + idea.text + '"]';
    }

    // Keep the click functionality but adapt it to the flowchart syntax
    for (const idea of ideas) {
      mindmap += '\n    click ' + idea.title + '';
    }

    return mindmap;

  }

  const inlinePromptResult = ref(null);

  function replacePromptResult(result) {
    inlinePromptResult.value = result;
  }

  async function promptResultInlinePrompt(prompt, instruction) {
    const appendMessages = [];

    if(props.promptResult.appendMessages) {
      appendMessages.push(...props.promptResult.appendMessages);
    }

    const selectedText = getSelectedText();

    appendMessages.push({type: 'assistant', text: convertHtmlToText(replaceParameterEditorText(promptResultText.value))});
    appendMessages.push({type: 'user', text: instruction + ': ' + selectedText});

    const request = {
      prompt: prompt,
      text: props.promptResult.input,
      clear: false,
      inline: true,
      appendMessages: appendMessages,
      forceBypassMoreParameters: true,
    };

    if(props.type === 'inline') {
      replyLoading.value = true;

      request.silent = true;

      const result = await executePromptClick2(request);
      replyLoading.value = false;

      inlinePromptResult.value = result;

      emits('replaceSelf', result);
    } else if(props.showAsChat === true) {
      replyLoading.value = true;
      request.silent = true;

      const result = await executePromptClick2(request);

      inlinePromptResult.value = result;

      replyLoading.value = false;
    } else {
      collapsed.value = true;

      await executePromptClick2(request);
    }
  }

  function getSelectedText() {
    const { from, to, empty } = editor.value.state.selection;

    if (empty) {
      return null;
    }

    const text = editorTextBetween(editor.value.state.doc, { from, to }, '\n', '\n');

    return text;
  }

  function toggleReply() {
    reactExpanded.value = !reactExpanded.value;

    if(reactExpanded.value) {
      reactInputRef.value.focus();
    }
  }

  const copying = ref(false);

  async function insert() {
    try {
      copying.value = true;
      await insertInternal();
      emits('onInsert');
    } finally {
      copying.value = false;
    }
  }

  async function insertInternal() {
    let text;

    if(props.insertTarget) {
      if(htmlView.value === true) {
        text = markdownToHtml(props.promptResult.originalText);
      } else {
        text = props.promptResult.text;
      }

      props.insertTarget(text);
      emits('close')
      return;
    }

    if(props.insertFunc) {
      props.insertFunc(props.promptResult);
      emits('close')
      return;
    }

    const editor = getEditor();
    if(!editor) return;

    const { from, to, empty } = getEditorSelection();

    const resolvedFrom = editor.state.doc.resolve(from);
    const resolvedTo = editor.state.doc.resolve(to);

    // Find the parent node and its position
    const parentNodeFrom = resolvedFrom.node(resolvedFrom.depth);
    const parentNodeTo = resolvedTo.node(resolvedTo.depth);

    // Get the start and end positions of the parent node
    const startPos = resolvedFrom.start(resolvedFrom.depth);
    const endPos = resolvedTo.start(resolvedTo.depth) + parentNodeTo.content.size;

    // Check if the selection spans the whole node
    const isWholeNodeSelected = from === startPos && to === endPos;

    let surroundedWithPTags = isWholeNodeSelected;
    console.log(surroundedWithPTags);

    if(!empty) {
      editor
        .chain()
        .focus()
        .deleteSelection()
        .run()
    }

    const user = useCurrentUser();

    const idToken = await user.value.getIdToken();

    if(hasImages.value) {

      try {
        const newUrl = await uploadImage(idToken, props.promptResult.images[0], useCurrentUser().value.uid);
        text = '<img src=\"' + newUrl + '\" ></img>';
      } catch (error) {
        return;
      }

    } else {

      if(htmlView.value === true) {
        text = markdownToHtml(props.promptResult.originalText);
      } else {
        text = props.promptResult.text;

        if(surroundedWithPTags || hasMultiBreaks(text)) {
          //text = "<p>" + text + "</p>";
          text = convertToParagraphs(text);
        }
      }
    }

    editor
      .chain()
      //.focus()
      .insertContentAt(from, text,
        {
          updateSelection: false,
          parseOptions: {
            preserveWhitespace: true,
          }
        })
      .run()


    // print editor text
    console.log(getEditor()?.getHTML());
  }
  async function copyToClipboard(event) {
    event.stopPropagation();

    if(layoutStore.runsInDesktopApp()) {
      await writeText(replaceParameterEditorText(promptResultText.value));
    } else {
      // copy to clipboard
      navigator.clipboard.writeText(replaceParameterEditorText(promptResultText.value));
    }

    $q.notify({
      message: 'Copied to clipboard',
      color: 'positive',
      position: 'top-right',
      timeout: 1000,
    });
  }

  async function copyToFileImage(event) {
    try {
      const user = useCurrentUser();

      const idToken = await user.value.getIdToken();

      const newUrl = await uploadImage(idToken, props.promptResult.images[0], useCurrentUser().value.uid);
      fileStore.selectedFile.imageUrl = newUrl;
    } catch (error) {
      return;
    }
  }

  async function copyToVariable(event, variable) {
    variable.value = replaceParameterEditorText(promptResultText.value);
    $q.notify({
      message: 'Copied to ' + variable.title,
      color: 'positive',
      position: 'top-right',
      timeout: 1000,
    });
  }

  async function stopPrompting(event) {
    event.stopPropagation();
    const promptStore = usePromptStore();
    promptStore.stopPrompt();
    promptStore.finishPromptResult(props.promptResult);
  }

  async function regeneratePrompt(event, removeCurrent = true, forceTemperature = null, forceModel = null) {
    event.stopPropagation();
    const promptStore = usePromptStore();
    const layoutStore = useLayoutStore();

    if(removeCurrent === true) {
      await removePromptResult(event);
    }

    const request = cloneRequest(props.promptResult.request);

    let appendMessages = null;

    if(props.promptResult.appendMessages) {
      appendMessages = [];
      appendMessages.push(...props.promptResult.appendMessages);
    }

    if(props.promptResult.executedTextMessages) {
      request.executedTextMessages = [...props.promptResult.executedTextMessages];
    }

    if(forceTemperature) {
      request.forceTemperature = forceTemperature;
    }

    if(forceModel) {
      request.forceModelId = forceModel.id;
    }

    if(appendMessages) {
      request.appendMessages = appendMessages;
    }

    if(event.ctrlKey) {
      //await promptStore.promptAgain(props.promptResult, appendMessages, promptAgainArgs);
      await promptStore.promptAgain2(request);
    } else {

      request.previewOnly = true;

      const data = await promptStore.promptAgain2(request);

      data.isRegenerating = true;
      promptStore.currentPromptConfirmationRequest = request;
      layoutStore.promptPreview = data;
      layoutStore.promptPreviewShown = true;
    }
  }

  async function removePromptResult(event) {
    event.stopPropagation();
    const promptStore = usePromptStore();
    promptStore.removePromptResult(props.promptResult);
  }

  const isPrompting = computed(() => {
    return promptStore.isPrompting && !promptStore.isSilentPrompting;
  });

  const promptResultTitle = computed(() => {
    let retValue = '';

    if(isReactionToAnotherPrompt.value) {
      retValue += 'Reply: ';
    }

    retValue += truncate(props.promptResult.prompt.title, 30);

    //retValue += ' [' + truncate(promptStore.getModel(props.promptResult.model?.id)?.name, 12) + ']';

    /*if(props.promptResult.temperature !== undefined && props.promptResult.temperature !== null) {
      retValue += ' (temperature ' + props.promptResult.temperature + ')';
    }*/

    return retValue;
  });

  const promptResultModel = computed(() => {
    return truncate(promptStore.getModel(props.promptResult.model?.id)?.name, 12);
  });

  const promptResultTemperature = computed(() => {
    if(props.promptResult.temperature !== undefined && props.promptResult.temperature !== null) {
      return '' + props.promptResult.temperature + '';
    }

    return undefined;
  });

  function onReplyKeyup(event) {
    if(event.key === 'Enter' && (!event.shiftKey)) {
      promptReactClick();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  const editor = useEditor({
    content: promptResultText.value,
    extensions: [
      Document,
      Paragraph,
      Text,
      EditorContent,
      BubbleMenu,
      FloatingMenu,
      Image,
      History,
      HardBreak,
      Link,
      Underline,
      Italic,
      Bold,
      CodeBlock,
      ListItem,
      BulletList.configure({
        keepMarks: true,
      }),
      OrderedList.configure({
        keepMarks: true,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'user-message',
        },
      }),
    ],

  })

  watch(() => promptResultText.value, (value) => {
    // HTML
    const isSame = editor.value.getHTML() === value

    // JSON
    // const isSame = JSON.stringify(this.editor.getJSON()) === JSON.stringify(value)

    if (isSame) {
      return
    }

    editor.value.commands.setContent(value, false);
  })

</script>

<style scoped>
  .prompt-actions{
    z-index: 1000;
    height: 1.7rem;
  }

  h3 {
    font-size: 1.1rem;
  }
  h2 {
    font-size: 1.2rem;
  }
  h1 {
    font-size: 1.3rem;
  }

</style>
