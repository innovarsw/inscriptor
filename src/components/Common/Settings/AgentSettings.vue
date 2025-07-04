<template>
  <q-card flat>
    <q-card-section class="q-gutter-y-sm no-padding">
      <div class="q-gutter-y-sm">

        <div class="bordered">

          <q-expansion-item label="Prompt Agents" caption="Define agents to iteratively improve the output of prompts.">
            <div class="q-pa-sm">
              <q-card flat>
                <q-card-section class="q-pb-none">
                  <div class="text-body2 text-primary q-mb-sm">📝 How Prompt Agents Work</div>
                  <div class="text-caption text-grey q-mb-xs">Prompt agents may execute after your main prompt to refine and improve its output automatically. You need to assign them to the prompts.</div>
                  <div class="text-caption text-grey q-mb-xs"><strong>Example:</strong> Main prompt generates a paragraph of text → Refiner agent polishes the writing style → Critic agent checks for plot consistency</div>
                  <div class="text-caption text-grey">Agents are executed sequentially from first to last in the order you define them.</div>
                  <q-card flat class="q-mt-md bg-yellow-1">
                    <q-card-section class="q-pa-sm">
                      <div class="text-caption text-primary"><strong>💡 Quick Reference</strong></div>
                      <div class="text-caption text-grey-8">
                        <div><strong>Refiner:</strong> "Polish this text to match my writing style"</div>
                        <div><strong>Critic:</strong> "Review this story and suggest improvements. Then, take this suggestion and actually improve the text"</div>
                      </div>
                    </q-card-section>
                  </q-card>
                </q-card-section>
                <q-card-section class="q-gutter-y-md" v-if="agents?.length > 0">
                  <q-card v-for="(agent, index) in agents" :key="index" bordered>
                    <q-card-section class="q-pb-sm">
                      <!-- Header with actions -->
                      <div class="row items-center justify-between q-mb-md">
                        <div class="text-subtitle2 text-weight-medium">
                          {{ agent.title || 'Untitled Agent' }} ({{ agent.type || 'No Type' }})
                        </div>
                        <q-btn-group flat>
                          <q-btn flat dense icon="mdi-arrow-up" @click="movePromptAgentUp(agent)" :disable="index === 0"/>
                          <q-btn flat dense icon="mdi-arrow-down" @click="movePromptAgentDown(agent)" :disable="index === agents.length - 1"/>
                          <q-btn flat dense icon="mdi-delete-outline" @click="deletePromptAgent(agent)" color="red"/>
                        </q-btn-group>
                      </div>

                      <!-- Basic Settings Section -->
                      <div class="q-mb-md q-ml-md">
                        <div class="q-gutter-md">
                          <q-input
                            filled
                            dense
                            label="Agent Name"
                            :model-value="agent.title"
                            v-on:update:model-value="updatePromptAgent(agent, {title: $event})"
                            class="full-width"
                          />
                          <q-select
                            filled
                            dense
                            label="Agent Type"
                            :model-value="agent.type"
                            v-on:update:model-value="updatePromptAgent(agent, {type: $event})"
                            :options="agentTypes"
                            emit-value
                            class="full-width"
                          >
                            <template v-slot:option="scope">
                              <q-item v-bind="scope.itemProps">
                                <q-item-section>
                                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                                  <q-item-label caption v-if="scope.opt.description?.length > 0 ?? false">{{ scope.opt.description }}</q-item-label>
                                </q-item-section>
                              </q-item>
                            </template>
                          </q-select>
                        </div>
                      </div>

                      <q-separator class="q-my-md" v-if="agent.type" />
                    </q-card-section>

                    <q-card-section v-if="agent.type === 'Refiner'">
                      <!-- Refiner Settings Section -->
                      <div class="q-mb-md">
                        <div class="text-body2 text-primary q-mb-sm">✏️ Refiner Settings</div>

                        <div class="q-gutter-md">
                          <CodeEditor
                            :model-value="agent.prompt"
                            v-on:update:model-value="updatePromptAgent(agent, {prompt: $event})"
                            :parameters="[]"
                            label="Refiner Instructions"
                          />

                          <q-input
                            filled
                            dense
                            label="Stop & Ignore text"
                            :model-value="agent.ignoreResultText ?? 'OK'"
                            v-on:update:model-value="updatePromptAgent(agent, {ignoreResultText: $event})"
                            hint="When AI returns exactly this text, refinement stops."
                          >
                            <template v-slot:append>
                              <HelpIcon :tooltip="$t('tooltips.parameters.ignoreResultText')"></HelpIcon>
                            </template>
                          </q-input>

                          <!-- Multiple Runs Settings -->
                          <div class="">
                            <div class="row items-center">
                              <q-checkbox
                                dense
                                label="Allow multiple runs"
                                :model-value="agent.allowMultipleRuns ?? false"
                                v-on:update:model-value="updatePromptAgent(agent, {allowMultipleRuns: $event})"
                                color="primary"
                              />
                              <HelpIcon :tooltip="$t('tooltips.parameters.agentMaxRuns')"></HelpIcon>
                            </div>
                            <div class="text-caption text-grey q-ml-lg q-pl-xs q-mb-md">
                              {{ agent.allowMultipleRuns ? 'Agent will refine multiple times until satisfied or max runs reached' : 'Agent will refine only once' }}
                            </div>

                            <q-input
                              v-if="agent.allowMultipleRuns"
                              filled
                              dense
                              label="Max runs"
                              type="number"
                              :model-value="agent.maxRuns ?? 1"
                              v-on:update:model-value="updatePromptAgent(agent, {maxRuns: $event})"
                              hint="Maximum number of refinement iterations"
                              class="q-ml-lg"
                            />
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                    <q-card-section v-if="agent.type === 'Critic'">
                      <!-- Critic Settings Section -->
                      <div class="q-mb-md">
                        <div class="text-body2 text-primary q-mb-sm">🔍 Critic Settings</div>

                        <div class="q-gutter-md">
                          <CodeEditor
                            :model-value="agent.prompt"
                            v-on:update:model-value="updatePromptAgent(agent, {prompt: $event})"
                            :parameters="[]"
                            label="Critic Instructions"
                          />

                          <q-input
                            filled
                            dense
                            label="Stop text"
                            :model-value="agent.ignoreResultText ?? 'OK'"
                            v-on:update:model-value="updatePromptAgent(agent, {ignoreResultText: $event})"
                            hint="When AI returns exactly this text, criticism stops."
                          >
                            <template v-slot:append>
                              <HelpIcon :tooltip="$t('tooltips.parameters.ignoreResultText')"></HelpIcon>
                            </template>
                          </q-input>

                          <q-input
                            filled
                            dense
                            label="Max iterations"
                            type="number"
                            :model-value="agent.maxRuns ?? 5"
                            v-on:update:model-value="updatePromptAgent(agent, {maxRuns: $event})"
                            hint="Maximum number of evaluate → improve cycles"
                          />
                        </div>
                      </div>
                    </q-card-section>

                  </q-card>
                </q-card-section>
                <q-card-actions class="q-mt-md">
                  <q-btn label="Prompt Agent" outline icon="mdi-plus" flat dense @click="addPromptAgent()"/>
                </q-card-actions>
              </q-card>
            </div>
          </q-expansion-item>

        </div>

        <div class="bordered">

          <q-expansion-item label="Project Agents" caption="Define agents that process paragraphs in your document to make improvements.">
            <div class="q-pa-md">
              <q-card flat>
                <q-card-section class="q-pb-none">
                  <div class="text-body2 text-primary q-mb-sm">🤖 How Project Agents Work</div>
                  <div class="text-caption text-grey q-mb-xs">Project agents work directly on your page content, processing individual paragraphs to make improvements. They ask for your permission before making changes.</div>
                  <div class="text-caption text-grey q-mb-xs"><strong>Independent agents:</strong> Analyze the entire opened page and intelligently choose which paragraphs need improvement.</div>
                  <div class="text-caption text-grey q-mb-sm"><strong>Non-independent agents:</strong> Process paragraphs marked with a search prefix (like "//TODO" or "//improve") or all paragraphs if no prefix is specified.</div>

                  <q-card flat class="q-mt-md bg-yellow-1">
                    <q-card-section class="q-pa-sm">
                      <div class="text-caption text-primary"><strong>🔄 Workflow Examples</strong></div>
                      <div class="text-caption text-grey-8">
                        <div class="q-mb-xs"><strong>Independent:</strong> Agent scans document → "I think paragraph 3 needs better flow" → asks permission → you approve/reject</div>
                        <div><strong>With prefix "//fix":</strong> Agent finds "//fix grammar here" → processes that paragraph → asks permission</div>
                      </div>
                    </q-card-section>
                  </q-card>
                </q-card-section>

                <q-card-section>
                  <div v-for="agent in promptStore.projectAgents" :key="agent.id" class="q-mb-lg">
                    <q-card bordered>
                      <q-card-section class="q-pb-sm">
                        <!-- Header with actions -->
                        <div class="row items-center justify-between q-mb-md">
                          <div class="text-subtitle2 text-weight-medium">
                            {{ agent.title || 'Untitled Agent' }}
                          </div>
                          <q-btn-group flat>
                            <q-btn flat dense icon="mdi-arrow-up" @click="moveProjectAgentUp(agent)" />
                            <q-btn flat dense icon="mdi-arrow-down" @click="moveProjectAgentDown(agent)" />
                            <q-btn flat dense icon="mdi-delete-outline" @click="deleteProjectAgent(agent)" color="red"/>
                          </q-btn-group>
                        </div>

                        <!-- Basic Settings Section -->
                        <div class="q-mb-md q-ml-md">
                          <div class="q-gutter-md">
                            <q-input
                              filled
                              dense
                              label="Agent Name"
                              :model-value="agent.title"
                              v-on:update:model-value="updateProjectAgent(agent, {title: $event})"
                              class="full-width"
                            />
                            <q-select
                              filled
                              dense
                              label="Prompt to Execute"
                              :model-value="availablePrompts.find(p => p.value === agent.promptId)?.label ?? 'Unknown Prompt'"
                              v-on:update:model-value="updateProjectAgent(agent, {promptId: $event})"
                              :options="availablePrompts"
                              emit-value
                              map-options
                              class="full-width"
                            />
                          </div>
                        </div>

                        <q-separator class="q-my-md" />

                        <!-- Mode Settings Section -->
                        <div class="q-mb-md">
                          <div class="text-body2 text-primary q-mb-sm">🎯 Processing Mode</div>

                          <!-- Independent Mode Toggle -->
                          <div class="q-mb-md">
                            <div class="row items-center q-gutter-x-sm">
                              <q-checkbox
                                :model-value="agent.isIndependent ?? false"
                                dense
                                label="Independent Mode"
                                v-on:update:model-value="updateProjectAgent(agent, {isIndependent: $event})"
                                color="primary"
                              />
                              <HelpIcon :tooltip="$t('tooltips.parameters.isIndependent')"></HelpIcon>
                            </div>
                            <div class="text-caption text-grey q-ml-lg q-pl-xs">
                              {{ agent.isIndependent ? 'AI will analyze the document and choose paragraphs to improve' : 'Process paragraphs marked with search prefix or all paragraphs' }}
                            </div>
                          </div>

                          <!-- Non-Independent Settings -->
                          <div v-if="!agent.isIndependent" class="q-gutter-md q-mt-md">
                            <q-input
                              filled
                              dense
                              label="Search prefix (e.g. '//', 'TODO:', 'FIX:')"
                              :model-value="agent.searchPrefix ?? '//'"
                              v-on:update:model-value="updateProjectAgent(agent, {searchPrefix: $event})"
                              hint="Paragraphs starting with this text will be processed. Leave empty to process all paragraphs."
                            >
                              <template v-slot:append>
                                <HelpIcon :tooltip="$t('tooltips.parameters.searchPrefix')"></HelpIcon>
                              </template>
                            </q-input>

                            <q-input
                              filled
                              dense
                              label="Stop processing when AI responds with"
                              :model-value="agent.ignoreResultText ?? 'OK'"
                              v-on:update:model-value="updateProjectAgent(agent, {ignoreResultText: $event})"
                              hint="If the AI returns exactly this text, the suggestion will be ignored."
                            >
                              <template v-slot:append>
                                <HelpIcon :tooltip="$t('tooltips.parameters.ignoreResultText')"></HelpIcon>
                              </template>
                            </q-input>
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </q-card-section>
                <q-card-actions class="q-mt-md">
                  <q-btn label="Project Agent" outline icon="mdi-plus" flat dense @click="addProjectAgent()"/>
                </q-card-actions>
              </q-card>
            </div>
          </q-expansion-item>

        </div>

      </div>
    </q-card-section>
  </q-card>

</template>

<script setup>

import {usePromptStore} from "stores/prompt-store";
import HelpIcon from 'components/Common/HelpIcon.vue';
import CodeEditor from 'components/Common/Editors/CodeEditor.vue';
import {computed} from 'vue';

const promptStore = usePromptStore();

const agents = computed(() => promptStore.promptAgents);

const agentTypes = [
  { label: "Refiner", value: "Refiner", description: "Continuously improves the prompt output by applying your instructions multiple times until satisfied. Perfect for polishing writing style, grammar, or content quality. Can run up to the max runs limit you set." },
  { label: "Critic", value: "Critic", description: "Acts as a critical reviewer that evaluates the output and provides specific feedback for improvements. Creates a conversation loop: evaluates → suggests changes → applies changes → evaluates again. Great for complex refinements." },
];

const availablePrompts = computed(() => {
  return promptStore.prompts.map(p => ({label: p.title + ' (' + p.modelId + ')', value: p.id}));
});

function addPromptAgent() {
  promptStore.addPromptAgent();
}

function deletePromptAgent(agent) {
  promptStore.deletePromptAgent(agent);
}

function movePromptAgentUp(agent) {
  promptStore.movePromptAgentUp(agent);
}

function movePromptAgentDown(agent) {
  promptStore.movePromptAgentDown(agent);
}

function updatePromptAgent(agent, args) {
  promptStore.updatePromptAgent(agent, args);
}

function addProjectAgent() {
  promptStore.addProjectAgent();
}

function deleteProjectAgent(agent) {
  promptStore.deleteProjectAgent(agent);
}

function moveProjectAgentUp(agent) {
  promptStore.moveProjectAgentUp(agent);
}

function moveProjectAgentDown(agent) {
  promptStore.moveProjectAgentDown(agent);
}

function updateProjectAgent(agent, args) {
  promptStore.updateProjectAgent(agent, args);
}


</script>

<style scoped>

</style>


