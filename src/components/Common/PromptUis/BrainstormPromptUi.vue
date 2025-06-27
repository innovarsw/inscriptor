<template>

  <q-dialog v-model="parametersDialogOpen">
    <q-card style="min-width: 600px; max-width: 80vw;">
      <q-card-section class="column no-wrap q-gutter-y-md">

        <div class="col text-subtitle2">
          Brainstorming Parameters:
        </div>

        <div class="col flex items-center" v-for="variable in (uiData?.variables ?? []).filter(i => i.isFromPromptParameter)" :key="variable.title" style="min-width: 300px;">
          <q-input autogrow dense filled  v-model="variable.value" :label="variable.title" :placeholder="variable.defaultValue" :hint="variable.hint ?? ''" class="full-width" />
        </div>

        <div class="q-mt-xl col flex items-center" v-for="variable in (uiData?.variables ?? []).filter(i => !i.isFromPromptParameter)" :key="variable.title" style="min-width: 300px;">
          <q-input autogrow dense filled  v-model="variable.value" :label="variable.title" :placeholder="variable.defaultValue" :hint="variable.hint ?? ''" class="full-width" />
        </div>

      </q-card-section>
    </q-card>
  </q-dialog>

  <div class="row q-gutter-x-md q-mt-md q-mb-sm">
    <div class="col flex justify-start">
      <q-btn @click="parametersDialogOpen = true" icon="mdi-cog-outline" color="primary" label="Parameters" no-caps flat :disable="isGenerating">
      </q-btn>
      <q-btn @click="expandLikedIdeas()" icon="mdi-creation-outline" no-caps flat color="primary" label="Expand Liked" :disable="isGenerating" v-if="uiData?.likedIdeas.length > 0" />
      <q-btn-dropdown color="negative" flat icon="mdi-delete" label="Remove" :disable="isGenerating" no-caps v-if="uiData?.dislikedIdeas.length > 0 || uiData?.ideas.length > 0">
        <q-list dense>
          <q-item clickable v-close-popup @click="removeDislikedIdeas()" v-if="uiData?.dislikedIdeas.length > 0">
            <q-item-section>
              <q-item-label>Remove Disliked</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="removeAll()" v-if="uiData?.ideas.length > 0">
            <q-item-section>
              <q-item-label>Remove All Ideas</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>
    <div class="col q-gutter-x-sm flex items-center">
      <div class="row full-width">
        <div class="col flex justify-center q-gutter-x-sm" >
          <q-btn @click="generate(false)" icon="mdi-creation-outline" color="accent" label="Generate more" :loading="isGenerating">
            <template v-slot:loading>
              <q-spinner-dots />
            </template>
          </q-btn>

          <q-btn @click="restart()" icon="mdi-restart" color="negative" label="Restart" no-caps :disable="isGenerating">
            <template v-slot:loading>
              <q-spinner-dots />
            </template>
          </q-btn>
        </div>
      </div>
    </div>
    <div class="col flex items-center justify-end">
      <div class="row full-width justify-end q-gutter-x-md">
        <div class="col-auto flex items-center">
          <q-btn-toggle :options="[{value: 'grid', label: 'Grid', icon: 'mdi-view-grid'},{value: 'list', label: 'List', icon: 'mdi-view-sequential'}]" :model-value="viewMode" @update:model-value="setViewMode" unelevated no-caps class="bordered" toggle-color="primary" padding="xs md" />
        </div>
        <div class="col-auto flex items-center" v-if="viewMode === 'grid'">
          <span class="q-mx-xs">Columns:</span>
          <q-btn-toggle :options="[{value: 3, label: 3},{value: 4, label: 4},{value: 5, label: 5}]" :model-value="columnCount" @update:model-value="setColumnCount" unelevated no-caps class="bordered" toggle-color="primary" padding="xs sm" id="aiSwitch" />
        </div>
      </div>
    </div>
  </div>

  <!-- List View Layout -->
  <div class="q-pa-md" v-if="viewMode === 'list'">
    <div class="row list-view-container">
      <!-- Left column (Disliked) -->
      <div class="col-4 list-view-column disliked-column">
        <div class="column-header q-mb-sm">
          <q-chip color="negative" text-color="white" icon="mdi-thumb-down" size="sm">
            Disliked
          </q-chip>
        </div>
        <div class="column-content">
          <transition-group name="idea-move" tag="div" class="column">
            <div v-for="idea in dislikedIdeas" :key="idea.id" class="q-mb-md idea-card-wrapper">
              <BrainstormPromptUiCard
                :idea="idea"
                @pin-idea="pinIdea"
                @like-idea="setIdeaLiked"
                @dislike-idea="setIdeaDisliked"
                @clear-description="idea => idea.description = ''"
                @separate-sub-idea="separateSubIdea"
                @clear-reply="clearConversation"
                @toggle-reply="idea => idea.replyEnabled = !idea.replyEnabled"
                @expand-idea="expandIdea"
                @generate-sub-ideas="generateSubIdeas"
                @generate-similar="generateSimilarIdeas"
                @reply-to-idea="replyToIdea"
              />
            </div>
          </transition-group>
        </div>
      </div>

      <!-- Middle column (Neutral) -->
      <div class="col-4 list-view-column neutral-column">
        <div class="column-header q-mb-sm">
          <q-chip color="grey" text-color="white" icon="mdi-lightbulb" size="sm">
            New Ideas
          </q-chip>
        </div>
        <div class="column-content">
          <transition-group name="idea-move" tag="div" class="column">
            <div v-for="idea in neutralIdeas" :key="idea.id" class="q-mb-md idea-card-wrapper">
              <BrainstormPromptUiCard
                :idea="idea"
                @pin-idea="pinIdea"
                @like-idea="setIdeaLiked"
                @dislike-idea="setIdeaDisliked"
                @clear-description="idea => idea.description = ''"
                @separate-sub-idea="separateSubIdea"
                @clear-reply="clearConversation"
                @toggle-reply="idea => idea.replyEnabled = !idea.replyEnabled"
                @expand-idea="expandIdea"
                @generate-sub-ideas="generateSubIdeas"
                @generate-similar="generateSimilarIdeas"
                @reply-to-idea="replyToIdea"
              />
            </div>
          </transition-group>
        </div>
      </div>

      <!-- Right column (Liked and Pinned) -->
      <div class="col-4 list-view-column liked-column">
        <div class="column-header q-mb-sm">
          <q-chip color="positive" text-color="white" icon="mdi-thumb-up" size="sm">
            Liked & Pinned
          </q-chip>
        </div>
        <div class="column-content">
          <transition-group name="idea-move" tag="div" class="column">
            <div v-for="idea in likedAndPinnedIdeas" :key="idea.id" class="q-mb-md idea-card-wrapper">
              <BrainstormPromptUiCard
                :idea="idea"
                @pin-idea="pinIdea"
                @like-idea="setIdeaLiked"
                @dislike-idea="setIdeaDisliked"
                @clear-description="idea => idea.description = ''"
                @separate-sub-idea="separateSubIdea"
                @clear-reply="clearConversation"
                @toggle-reply="idea => idea.replyEnabled = !idea.replyEnabled"
                @expand-idea="expandIdea"
                @generate-sub-ideas="generateSubIdeas"
                @generate-similar="generateSimilarIdeas"
                @reply-to-idea="replyToIdea"
              />
            </div>
          </transition-group>
        </div>
      </div>
    </div>
  </div>

  <!-- Grid View Layout (Original) -->
  <div class="q-pa-md" v-else>
    <!-- Pinned ideas row -->
    <div class="row q-mb-md pinned-ideas-section" v-if="pinnedIdeas.length > 0">
      <div class="col-12 q-mb-sm pinned-section-header q-ml-sm">
        <q-chip color="accent" text-color="white" icon="mdi-pin" size="sm">
          Pinned
        </q-chip>
      </div>
      <div class="row masonry-container full-width">
        <div v-for="columnIndex in columns" :key="'pinned-column-'+columnIndex" class="masonry-column" :style="{ width: `${100/columns}%` }">
          <transition-group name="idea-move" tag="div" class="column">
            <div v-for="(idea, i) in getPinnedColumnIdeas(columnIndex-1)" :key="idea.id || 'pinned-'+i" class="q-mb-md idea-card-wrapper" tabindex="0">
              <BrainstormPromptUiCard
                :idea="idea"
                @pin-idea="pinIdea"
                @like-idea="setIdeaLiked"
                @dislike-idea="setIdeaDisliked"
                @clear-description="idea => idea.description = ''"
                @separate-sub-idea="separateSubIdea"
                @clear-reply="clearConversation"
                @toggle-reply="idea => idea.replyEnabled = !idea.replyEnabled"
                @expand-idea="expandIdea"
                @generate-sub-ideas="generateSubIdeas"
                @generate-similar="generateSimilarIdeas"
                @reply-to-idea="replyToIdea"
              />
            </div>
          </transition-group>
        </div>
      </div>
    </div>

    <!-- Masonry-style layout for non-pinned ideas -->
    <div class="row masonry-container">
      <div v-for="columnIndex in columns" :key="'column-'+columnIndex" class="masonry-column" :style="{ width: `${100/columns}%` }">
        <transition-group name="idea-move" tag="div" class="column">
          <div v-for="(idea, i) in getColumnIdeas(columnIndex-1)" :key="idea.id || i" class="q-mb-md idea-card-wrapper" tabindex="0">
            <BrainstormPromptUiCard
              :idea="idea"
              @pin-idea="pinIdea"
              @like-idea="setIdeaLiked"
              @dislike-idea="setIdeaDisliked"
              @clear-description="idea => idea.description = ''"
              @separate-sub-idea="separateSubIdea"
              @clear-reply="clearConversation"
              @toggle-reply="idea => idea.replyEnabled = !idea.replyEnabled"
              @expand-idea="expandIdea"
              @generate-sub-ideas="generateSubIdeas"
              @generate-similar="generateSimilarIdeas"
              @reply-to-idea="replyToIdea"
            />
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, defineExpose, computed} from 'vue';
import {cloneRequest, executePromptClick2} from 'src/common/helpers/promptHelper';
import {convertHtmlToText, markdownToHtml} from 'src/common/utils/textUtils';
import BrainstormPromptUiCard from 'src/components/Common/PromptUis/BrainstormPromptUiCard.vue';
import PromptContextSelector from 'components/Common/PromptSelector/PromptContextSelector.vue';
import {useLayoutStore} from 'stores/layout-store';

const props = defineProps({
  promptResult: {
    type: Object,
    required: true,
  }
});

const layoutStore = useLayoutStore();

const parametersDialogOpen = ref(false);

const isGenerating = ref(false);
// Number of columns for masonry layout
const columns = computed(() => uiData.value?.columns || 3);
const columnCount = computed({
  get: () => columns.value,
  set: (value) => {
    if (uiData.value) {
      uiData.value.columns = value;
    }
  }
});

// View mode toggle between grid and list views
const viewMode = ref('grid');

// Initialize viewMode from uiData if available
if (props.promptResult?.uiData?.viewMode) {
  viewMode.value = props.promptResult.uiData.viewMode;
}


const request = computed(() => props.promptResult.request);
const prompt = computed(() => props.promptResult.prompt);
const uiData = computed({
  get: () => props.promptResult.uiData,
  // eslint-disable-next-line vue/no-mutating-props
  set: (value) => props.promptResult.uiData = value
});

// Separate pinned ideas
const pinnedIdeas = computed(() => {
  return uiData.value?.ideas?.filter(idea => idea.pinned) || [];
});

// Get non-pinned ideas
const nonPinnedIdeas = computed(() => {
  return uiData.value?.ideas?.filter(idea => !idea.pinned) || [];
});

// Get ideas for a specific column (masonry-style)
function getColumnIdeas(columnIndex) {
  return nonPinnedIdeas.value.filter((_, index) => index % columns.value === columnIndex);
}

// Computed properties for list view
const dislikedIdeas = computed(() => {
  return uiData.value?.ideas?.filter(idea => idea.disliked) || [];
});

const neutralIdeas = computed(() => {
  return uiData.value?.ideas?.filter(idea => !idea.liked && !idea.disliked && !idea.pinned) || [];
});

const likedAndPinnedIdeas = computed(() => {
  return uiData.value?.ideas?.filter(idea => idea.liked || idea.pinned) || [];
});

// Get pinned ideas for a specific column (masonry-style)
function getPinnedColumnIdeas(columnIndex) {
  return pinnedIdeas.value.filter((_, index) => index % columns.value === columnIndex);
}

async function restart() {
  const newRequest = {
    prompt: request.value.prompt,
    text: request.value.text,
    userInput: request.value.userInput,

}

  await executePromptClick2(newRequest);

  layoutStore.promptUiDialogOpen = false;
}

async function generate(replace = true) {
  initialiseUiData();

  try {
    isGenerating.value = true;

    const newRequest = cloneRequest(request.value);

    // Create a new batch ID for this generation
    const batchId = new Date().getTime();

    prepareRequest(newRequest);
    if(!uiData.value.variables) {
      initialiseVariables(newRequest);
    }
    replaceVariables(newRequest, uiData.value.ideas);

    const onOutput = (fullText, newText, isFinished, isError, request, result) => {
      processOutput(fullText, uiData.value.pendingNewIdeas);
    };

    newRequest.onOutput = onOutput;

    await executePromptClick2(newRequest);

    if (replace) {
      uiData.value.ideas = [];
    }

    for (const idea of uiData.value.pendingNewIdeas) {
      if (!uiData.value.ideas.some(existing => existing.text === idea.text)) {
        // Assign an ID to the new idea
        idea.id = `idea-${uiData.value.nextIdeaId++}`;
        // Assign the batch ID to track which generation batch this idea belongs to
        idea.generationBatchId = batchId;
        uiData.value.ideas.push(idea);
      }
    }

    updatePromptResultText();
  } finally {
    isGenerating.value = false;
  }
}

async function expandLikedIdeas() {
  initialiseUiData();

  // Get all liked ideas
  const likedIdeas = uiData.value.ideas.filter(idea => idea.liked);

  // Generate sub-ideas for each liked idea
  for (const idea of likedIdeas) {
    await expandIdea(idea);

    await generateSubIdeas(idea, false);
  }
}

async function removeDislikedIdeas() {
  initialiseUiData();

  // Add a visual fade-out effect before removal
  const animateRemoval = () => {
    // Find all disliked ideas
    const dislikedIdeas = uiData.value.ideas.filter(idea => idea.disliked);

    // Add a temporary class for animation
    for (const idea of dislikedIdeas) {
      idea.removing = true;
    }

    // After animation completes, remove the ideas
    setTimeout(() => {
      // Remove from disliked ideas collection first
      uiData.value.dislikedIdeas = [];
      // Then remove from main ideas collection
      uiData.value.ideas = uiData.value.ideas.filter(idea => !idea.disliked);
      updatePromptResultText();
    }, 500); // 500ms animation duration
  };

  // Execute the animated removal
  animateRemoval();
}

function removeAll() {
  initialiseUiData();

  // Add a visual fade-out effect before removal
  const animateRemoval = () => {
    // Add a temporary class for animation to all ideas
    for (const idea of uiData.value.ideas) {
      idea.removing = true;
    }

    // After animation completes, remove all ideas
    setTimeout(() => {
      uiData.value.ideas = [];
      uiData.value.likedIdeas = [];
      uiData.value.dislikedIdeas = [];
      updatePromptResultText();
    }, 500); // 500ms animation duration
  };

  // Execute the animated removal
  animateRemoval();
}

async function generateSubIdeas(idea, replace = false) {
  initialiseUiData();

  try {
    isGenerating.value = true;
    idea.generating = true;

    const newRequest = cloneRequest(request.value);

    const ideasString = generateExistingIdeasString(uiData.value.ideas);

    const appendMessages = [];
    appendMessages.push({type: 'assistant', text: convertHtmlToText(ideasString)});
    let expandMessage = prompt.value.settings.brainstorm_subIdeasMessage ?? 'Generate sub-ideas similar: $Idea';
    expandMessage = expandMessage.replaceAll('$Idea', getIdeaContext(idea));

    appendMessages.push({type: 'user', text: expandMessage});

    newRequest.appendMessages = appendMessages;

    if(idea.children === undefined) {
      idea.children = [];
    }

    prepareRequest(newRequest);
    if(!uiData.value.variables) {
      initialiseVariables(newRequest);
    }
    replaceVariables(newRequest, idea.children);

    idea.tempChildren = [];

    const onOutput = (fullText, newText, isFinished, isError, request, result) => {
      processOutput(fullText, idea.tempChildren);
    };

    newRequest.onOutput = onOutput;

    await executePromptClick2(newRequest);

    if (replace) {
      idea.children = [];
    }

    for (const child of idea.tempChildren) {
      if (!idea.children.some(existing => existing.text === child.text)) {
        idea.children.push(child);
      }
    }

    updatePromptResultText();
  } finally {
    isGenerating.value = false;
    idea.generating = false;
  }
}

async function expandIdea(idea) {
  initialiseUiData();

  try {
    isGenerating.value = true;
    idea.generating = true;

    const newRequest = cloneRequest(request.value);

    const ideasString = generateExistingIdeasString(uiData.value.ideas);

    const appendMessages = [];
    appendMessages.push({type: 'assistant', text: convertHtmlToText(ideasString)});

    let expandMessage = prompt.value.settings.brainstorm_expandPromptMessage ?? 'Expand this idea: $Idea';
    expandMessage = expandMessage.replaceAll('$Idea', getIdeaContext(idea));

    appendMessages.push({type: 'user', text: expandMessage});

    newRequest.appendMessages = appendMessages;

    prepareRequest(newRequest);
    if(!uiData.value.variables) {
      initialiseVariables(newRequest);
    }
    replaceVariables(newRequest, []);

    idea.descriptionAppend = '';

    const onOutput = (fullText, newText, isFinished, isError, request, result) => {
      idea.descriptionAppend = fullText;
    };

    newRequest.onOutput = onOutput;

    await executePromptClick2(newRequest);

    if (idea.description) {
      idea.description = idea.description + "\n\n" + idea.descriptionAppend;
    } else {
      idea.description = idea.descriptionAppend;
    }

    idea.descriptionAppend = '';

    updatePromptResultText();
  } finally {
    isGenerating.value = false;
    idea.generating = false;
  }
}

async function replyToIdea(idea, message) {
  initialiseUiData();

  try {
    isGenerating.value = true;
    idea.generating = true;
    idea.replyMessage = '';
    idea.replyEnabled = false;

    // Initialize conversation array if it doesn't exist
    if (!idea.conversation) {
      idea.conversation = [];
    }

    // Add user message to conversation history
    idea.conversation.push({
      role: 'user',
      text: message,
      timestamp: new Date().toISOString()
    });

    const newRequest = cloneRequest(request.value);

    // Add messages to appendMessages
    const appendMessages = [];

    // Start with idea context
    appendMessages.push({
      type: 'assistant',
      text: getIdeaContext(idea)
    });

    // Add each conversation message as a separate entry with the appropriate role
    if (idea.conversation && idea.conversation.length > 0) {
      // Add all conversation messages except the most recent one (which we'll add separately)
      for (let i = 0; i < idea.conversation.length - 1; i++) {
        const msg = idea.conversation[i];
        appendMessages.push({
          type: msg.role === 'user' ? 'user' : 'assistant',
          text: msg.text
        });
      }
    }

    // Add the most recent user message with any special formatting from the prompt settings
    let replyMessage = prompt.value.settings.brainstorm_replyMessage ?? '$Message';
    replyMessage = replyMessage.replaceAll('$Message', message);
    appendMessages.push({type: 'user', text: replyMessage});

    newRequest.appendMessages = appendMessages;

    prepareRequest(newRequest);
    if(!uiData.value.variables) {
      initialiseVariables(newRequest);
    }
    replaceVariables(newRequest, []);

    // We'll store the AI's response here temporarily
    let aiResponse = '';

    const onOutput = (fullText, newText, isFinished, isError, request, result) => {
      aiResponse = fullText;
    };

    newRequest.onOutput = onOutput;

    await executePromptClick2(newRequest);

    // Add AI response to conversation history
    idea.conversation.push({
      role: 'assistant',
      text: aiResponse,
      timestamp: new Date().toISOString()
    });

    updatePromptResultText();
  } finally {
    isGenerating.value = false;
    idea.generating = false;
  }
}

// Also update the clear-reply emit to clear conversation
function clearConversation(idea) {
  idea.conversation = [];
}

async function generateSimilarIdeas(idea, replace = false) {
  initialiseUiData();

  try {
    isGenerating.value = true;
    idea.generating = true;

    const newRequest = cloneRequest(request.value);

    // Create a new batch ID for this generation
    const batchId = new Date().getTime();

    const ideasString = generateExistingIdeasString(uiData.value.ideas, true);

    const appendMessages = [];
    appendMessages.push({type: 'assistant', text: convertHtmlToText(ideasString)});

    let expandMessage = prompt.value.settings.brainstorm_similarIdeasMessage ?? 'Create ideas similar to this idea:\n$Idea';
    expandMessage = expandMessage.replaceAll('$Idea', getIdeaContext(idea));

    appendMessages.push({type: 'user', text: expandMessage});

    newRequest.appendMessages = appendMessages;

    if(idea.children === undefined) {
      idea.children = [];
    }

    prepareRequest(newRequest);
    if(!uiData.value.variables) {
      initialiseVariables(newRequest);
    }
    replaceVariables(newRequest, idea.children);

    idea.tempChildren = [];

    const onOutput = (fullText, newText, isFinished, isError, request, result) => {
      processOutput(fullText, uiData.value.pendingNewIdeas);
    };

    newRequest.onOutput = onOutput;

    await executePromptClick2(newRequest);

    if (replace) {
      uiData.value.ideas = [];
    }

    for (const idea of uiData.value.pendingNewIdeas) {
      if (!uiData.value.ideas.some(existing => existing.text === idea.text)) {
        // Assign the batch ID to track which generation batch this idea belongs to
        idea.generationBatchId = batchId;
        // Add an ID if it doesn't have one
        if (!idea.id) {
          idea.id = `idea-${uiData.value.nextIdeaId++}`;
        }
        uiData.value.ideas.push(idea);
      }
    }

    updatePromptResultText();
  } finally {
    isGenerating.value = false;
    idea.generating = false;
  }
}

function separateSubIdea(subIdea, parentIdea) {
  initialiseUiData();

  const newIdea = {
    text: subIdea.text,
    liked: false,
    disliked: false,
    children: []
  };

  uiData.value.ideas.push(newIdea);

  // If this is a sub-idea, remove it from the parent's children array
  if (parentIdea && parentIdea.children) {
    const index = parentIdea.children.findIndex(idea => idea.text === subIdea.text);
    if (index !== -1) {
      parentIdea.children.splice(index, 1);
    }
  }

  updatePromptResultText();
}

function processOutput(text, outputCollection) {
  let items = text.split(request.value.prompt.resultsSeparator ?? '<split/>').map(item => ({ text: item })).filter(item => item.text.trim() !== '');

  items = items.map(item => {
    return item;
  });

  outputCollection.splice(0, outputCollection.length);

  for (const item of items) {
    if (!outputCollection.some(existing => existing.text === item.text)) {
      outputCollection.push(item);
    }
  }

  return outputCollection;
}

async function onShow(payload) {
  if(!uiData.value) {
    initialiseUiData();

    await generate();
  }
}

function initialiseUiData() {
  if(!uiData.value) {
    uiData.value = {
      ideas: [],
      pendingNewIdeas: [],
      dislikedIdeas: [],
      likedIdeas: [],
      columns: calculateOptimalColumns(),
      nextIdeaId: 1,
      viewMode: viewMode.value // Initialize with current view mode
    };
  }

  // Ensure columns is initialized if not present
  if (uiData.value.columns === undefined) {
    uiData.value.columns = calculateOptimalColumns();
  }

  // Ensure viewMode is initialized if not present
  if (uiData.value.viewMode === undefined) {
    uiData.value.viewMode = viewMode.value;
  } else {
    // Sync with uiData if it exists
    viewMode.value = uiData.value.viewMode;
  }

  // Ensure nextIdeaId is initialized
  if (uiData.value.nextIdeaId === undefined) {
    uiData.value.nextIdeaId = 1;
  }

  // Assign IDs to any ideas that don't have them yet and initialize conversation arrays
  if (uiData.value.ideas) {
    for (const idea of uiData.value.ideas) {
      if (!idea.id) {
        idea.id = `idea-${uiData.value.nextIdeaId++}`;
      }
      // Initialize conversation array if not present
      if (!idea.conversation) {
        idea.conversation = [];
      }
    }
  }
}

function calculateOptimalColumns() {
  // Calculate optimal number of columns based on screen width
  // Assuming each card is about 350px wide
  const cardWidth = 350;
  const screenWidth = window.innerWidth;
  const padding = 32; // Account for container padding

  // Calculate how many cards can fit in the available width
  const availableWidth = screenWidth - padding;
  const columns = Math.max(1, Math.floor(availableWidth / cardWidth));

  // Limit to a reasonable range (1-5 columns)
  return Math.min(5, Math.max(1, columns));
}

function prepareRequest(request) {
  request.silent = true;
  request.previewOnly = false;
  request.clear = false;
  request.forceBypassMoreParameters = true;
  request.executeCustomPromptUi = true;

  request.systemPrompt = request.prompt.systemPrompt;
  request.userPrompt = request.prompt.userPrompt;
}

function replaceVariables(request, existingIdeas) {
  const existingIdeasString = generateExistingIdeasString(existingIdeas);

  request.systemPrompt = request.systemPrompt.replaceAll('$ExistingIdeas', existingIdeasString)
  request.userPrompt = request.userPrompt.replaceAll('$ExistingIdeas', existingIdeasString)

  for (const variable of uiData.value.variables) {
    if(variable.isFromPromptParameter) {
      const parameterValue = request.parametersValue.find(p => p.name === variable.title);
      if(parameterValue) {
        parameterValue.value = variable.value;
      }
    } else {
      request.systemPrompt = request.systemPrompt.replaceAll(variable.fullName, variable.value);
      request.userPrompt = request.userPrompt.replaceAll(variable.fullName, variable.value);
    }
  }
}

function initialiseVariables(request) {
  const vars = [];

  const systemPromptVars = extractUIVariables(request.systemPrompt);
  const userPromptVars = extractUIVariables(request.userPrompt);

  const allVars = [...systemPromptVars];
  for (const userVar of userPromptVars) {
    if (!allVars.some(v => v.title === userVar.title)) {
      allVars.push(userVar);
    }
  }

  // Add all found variables to the vars array
  vars.push(...allVars);

  // Helper function to extract UI variables from text
  function extractUIVariables(text) {
    if (!text) return [];

    const regex = /\$UI_([a-zA-Z0-9_]+)(?:\(([^)]*)\))?/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        title: match[1],
        defaultValue: match[2] || '',
        value: match[2] || '',
        fullName: match[0]
      });
    }

    return matches;
  }

  for (const promptParameter of request.parametersValue) {
    vars.push({
      title: promptParameter.name,
      defaultValue: promptParameter.value,
      value: promptParameter.value,
      fullName: promptParameter.name,
      isFromPromptParameter: true,
      hint: promptParameter.hint
    });
  }

  uiData.value.variables = vars;
}

function generateExistingIdeasString(collection, includeDetails = false) {
  // Split ideas into three categories
  const likedIdeas = collection.filter(idea => idea.liked);
  const dislikedIdeas = collection.filter(idea => idea.disliked);
  const neutralIdeas = collection.filter(idea => !idea.liked && !idea.disliked);

  // Build the string with sections
  let ideasString = '';

  if (likedIdeas.length > 0) {
    ideasString += "IDEAS SPECIFICALLY LIKED BY USER:\n" + likedIdeas.map(idea => {
      let text = idea.text;
      if (includeDetails && idea.description) {
        text += "\nDetails: " + idea.description;
      }
      return text;
    }).join('\n') + '\n\n';
  }

  if (dislikedIdeas.length > 0) {
    ideasString += "IDEAS SPECIFICALLY DISLIKED BY USER:\n" + dislikedIdeas.map(idea => {
      let text = idea.text;
      if (includeDetails && idea.description) {
        text += "\nDetails: " + idea.description;
      }
      return text;
    }).join('\n') + '\n\n';
  }

  if (neutralIdeas.length > 0) {
    ideasString += "IDEAS:\n" + neutralIdeas.map(idea => {
      let text = idea.text;
      if (includeDetails && idea.description) {
        text += "\nDetails: " + idea.description;
      }
      return text;
    }).join('\n') + '\n\n';
  }

  return ideasString.trim();
}

function getIdeaContext(idea) {
  let context = `Idea: ${idea.text}`;

  // Add description if available
  if (idea.description) {
    context += `\n\nDetails: ${idea.description}`;
  }

  // Add child/related ideas if available
  if (idea.children && idea.children.length > 0) {
    context += '\n\nRelated Ideas:';
    idea.children.forEach(child => {
      context += `\n- ${child.text}`;
      if (child.description) {
        context += `: ${child.description}`;
      }
    });
  }

  return context;
}

function setIdeaLiked(idea, likedState) {
  if(idea.disliked) {
    setIdeaDisliked(idea, false);
  }

  if(!likedState) {
    const index = uiData.value.likedIdeas.findIndex(i => i === idea);
    if (index !== -1) {
      uiData.value.likedIdeas.splice(index, 1);
    }
  } else {
    if (!uiData.value.likedIdeas.includes(idea)) {
      uiData.value.likedIdeas.push(idea);
    }
  }
  idea.liked = likedState;

  updatePromptResultText();
}

function updatePromptResultText() {
  const likedIdeas = uiData.value.ideas.filter(idea => idea.liked || idea.pinned);
  // eslint-disable-next-line vue/no-mutating-props
  props.promptResult.originalText = likedIdeas.map(idea => {
    let text = `${idea.text}`;

    // Add description if available
    if (idea.description) {
      text += '\n\n\n Details:\n\n ' + idea.description;
    }

    // Add related/child ideas if available
    if (idea.children && idea.children.length > 0) {
      text += '\n\nRelated Ideas:\n\n';
      idea.children.forEach(child => {
        text += '\n' + child.text;
      });
    }

    // Add a markdown separator between sections for better readability
    text += '\n\n===\n\n';

    return text;
  }).join('\n\n\n');
  // eslint-disable-next-line vue/no-mutating-props
  props.promptResult.text = props.promptResult.originalText;
}

function setIdeaDisliked(idea, dislikedState) {
  if(idea.liked) {
    setIdeaLiked(idea, false);
  }

  if(!dislikedState) {
    const index = uiData.value.dislikedIdeas.findIndex(i => i === idea);
    if (index !== -1) {
      uiData.value.dislikedIdeas.splice(index, 1);
    }
  } else {
    if (!uiData.value.dislikedIdeas.includes(idea)) {
      uiData.value.dislikedIdeas.push(idea);
    }
  }
  idea.disliked = dislikedState;

  updatePromptResultText();
}

function pinIdea(idea) {
  idea.pinned = !idea.pinned;

  updatePromptResultText();
}

function removeIdea(idea) {
  // Remove from main ideas collection
  const index = uiData.value.ideas.findIndex(i => i === idea);
  if (index !== -1) {
    uiData.value.ideas.splice(index, 1);
  }

  // Remove from liked collection if present
  const likedIndex = uiData.value.likedIdeas.findIndex(i => i === idea);
  if (likedIndex !== -1) {
    uiData.value.likedIdeas.splice(likedIndex, 1);
  }

  // Remove from disliked collection if present
  const dislikedIndex = uiData.value.dislikedIdeas.findIndex(i => i === idea);
  if (dislikedIndex !== -1) {
    uiData.value.dislikedIdeas.splice(dislikedIndex, 1);
  }

  updatePromptResultText();
}

function trimLines(text) {
  return text.split('\n').map(line => line.trim()).join('\n');
}

function setColumnCount(count) {
  columnCount.value = count;
}

function setViewMode(mode) {
  viewMode.value = mode;

  // Save the preference to uiData
  if (uiData.value) {
    uiData.value.viewMode = mode;
  }
}

defineExpose({
  onShow
});
</script>

<style scoped>
  /* Card styles have been moved to BrainstormPromptUiCard.vue */
  .no-p-margin p {
    margin: 0;
  }

  .masonry-column {
    padding: 0 8px;
    display: flex;
    flex-direction: column;
  }

  .idea-card-wrapper {
    transition: all 0.3s ease;
  }

  .masonry-container {
    margin: 0 -8px;
  }

  .pinned-ideas-section {
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 22px;
    padding: 8px;
    margin-bottom: 16px;
  }

  .pinned-section-header {
  }

  /* List view styles */
  .list-view-container {
  }

  .list-view-column {
    padding: 0 24px;
  }

  .list-view-column .column-header {
    padding: 8px 0;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .list-view-column .column-content {
    border-radius: 8px;
    height: 100%;
  }

  .disliked-column .column-content {
    background-color: rgba(0, 0, 0, 0.02);
  }

  .neutral-column .column-content {
  }

  .liked-column .column-content {
    background-color: rgba(82, 91, 177, 0.04);
  }

  /* Add media queries for responsive column adjustment */
  @media (max-width: 768px) {
    .masonry-column {
      width: 50% !important;
    }

    .list-view-column {
      padding: 0 8px;
    }
  }

  @media (max-width: 480px) {
    .masonry-column {
      width: 100% !important;
    }

    .list-view-column {
      width: 100% !important;
      margin-bottom: 16px;
    }

    .list-view-container {
      flex-direction: column;
    }
  }
</style>
