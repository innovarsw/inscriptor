<template>
  <q-page class="" style="overflow: visible;" :style="cssVariables">
    <div class="full-width full-height" style="overflow: visible;">

      <div class="custom-splitter full-height" ref="splitterContainer">
        <!-- Left Menu Panel -->
        <div
          class="splitter-panel splitter-left-menu bg-transparent"
          :style="{ width: leftMenuWidth }"
        >
          <div :style="{ height: `calc(100vh - ${LEFT_MENU_HEIGHT_OFFSET_PX}px)` }">
            <div class="fit left-menu-scroll">
              <div class="q-pa-none">
                <LeftMenuComponent />
              </div>
              <div class="absolute full-width" style="bottom: 0">
                <q-separator />
                <div class="row items-center bg-theme-primary justify-center no-wrap" id="variables">
                  <div class="col-auto">
                    <q-btn no-caps stack unelevated class="row text-primary q-my-sm cursor-pointer" icon="mdi-database-outline" label="Variables" @click="layoutStore.setVariableSettingsOpen(true)" />
                  </div>
                  <div class="col-auto">
                    <q-btn no-caps stack unelevated class="row text-primary q-my-sm cursor-pointer" icon="mdi-cog" label="Settings" @click="layoutStore.setSettingsOpen(true)" id="settingsButton" />
                  </div>
                  <div class="col-auto">
                    <q-btn no-caps stack unelevated class="row text-primary q-my-sm cursor-pointer" icon="mdi-history" label="History" @click="layoutStore.setConsoleOpen(!layoutStore.consoleOpen)"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- First Resize Handle (between left menu and main content) -->
        <div
          v-if="layoutStore.leftDrawerOpen"
          class="splitter-handle"
          @mousedown="startLeftResize"
          @touchstart="startLeftResize"
        ></div>

        <!-- Main Content Panel -->
        <div
          class="splitter-panel splitter-main"
          :style="{ width: mainPanelWidth }"
        >
          <div class="" :style="{ height: `calc(100vh - ${MAIN_PANEL_HEIGHT_OFFSET_PX}px)`, overflowY: 'auto', overflowX: 'visible' }">
            <div class="fit bg-white-transparent">
              <div class="" id="file">
                <FileDetail />
              </div>
            </div>
          </div>
        </div>

        <!-- Second Resize Handle (between main content and right menu) -->
        <div
          v-if="layoutStore.rightDrawerOpen"
          class="splitter-handle"
          @mousedown="startRightResize"
          @touchstart="startRightResize"
        ></div>

        <!-- Right Menu Panel -->
        <div
          class="splitter-panel splitter-right"
          :style="{ width: rightPanelWidth }"
        >
          <div class="" :style="{ height: `calc(100vh - ${RIGHT_PANEL_HEIGHT_OFFSET_PX}px)` }">
            <div class="">
              <div class="fit bg-white-transparent">
                <RightMenuComponent />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>

import {onMounted, computed, ref, onBeforeUnmount, watch} from 'vue'
import FileDetail from "components/MainPanel/FileDetail.vue";
import RightMenuComponent from "components/RightMenu/RightMenuComponent.vue";
import LeftMenuComponent from "components/LeftMenu/LeftMenuComponent.vue";
import {useLayoutStore} from "stores/layout-store";

const layoutStore = useLayoutStore();

// Pixel dimensions
const LEFT_MENU_MIN_WIDTH_PX = ref(300); // Minimum width for left menu in pixels
const LEFT_MENU_HEIGHT_OFFSET_PX = ref(32); // Height offset for left menu
const MAIN_PANEL_HEIGHT_OFFSET_PX = ref(50); // Height offset for main panel
const RIGHT_PANEL_HEIGHT_OFFSET_PX = ref(33); // Height offset for right panel
const SPLITTER_HANDLE_WIDTH_PX = ref(4); // Width of resize handles
const MAIN_PANEL_WIDTH_OFFSET_PX = ref(8); // Width offset for main panel (2 handles)
const SPLITTER_INDICATOR_HEIGHT_PX = ref(20); // Height of splitter handle indicator
const SPLITTER_INDICATOR_WIDTH_PX = ref(2); // Width of splitter handle indicator
const MOBILE_LEFT_MENU_MIN_WIDTH_PX = ref(220); // Minimum left menu width on mobile

// Percentage dimensions
const DEFAULT_LEFT_MENU_WIDTH_PCT = ref(12); // Default left menu width percentage
const DEFAULT_RIGHT_PANEL_WIDTH_PCT = ref(15); // Default right panel width percentage
const MAX_LEFT_MENU_WIDTH_PCT = ref(35); // Maximum left menu width percentage
const MAX_RIGHT_PANEL_WIDTH_PCT = ref(50); // Maximum right panel width percentage
const MIN_MAIN_PANEL_WIDTH_PCT = ref(20); // Minimum main panel width percentage
const splitterContainer = ref(null);
const isResizing = ref(false);
const resizeType = ref(''); // 'left' or 'right'
const startX = ref(0);
const startLeftMenuWidth = ref(DEFAULT_LEFT_MENU_WIDTH_PCT.value); // Default for left menu (matches minimum)
const startRightPanelWidth = ref(DEFAULT_RIGHT_PANEL_WIDTH_PCT.value); // Starting width for right panel resize (matches minimum)

// Store panel widths as percentages
const leftMenuWidthPercent = ref(layoutStore.leftDrawerOpen ? DEFAULT_LEFT_MENU_WIDTH_PCT.value : 0); // Will be updated to use dynamic minimum
const rightPanelWidthPercent = ref(layoutStore.rightDrawerOpen ? (layoutStore.prevLayoutSplitterModel || DEFAULT_RIGHT_PANEL_WIDTH_PCT.value) : 0); // Show/hide based on rightDrawerOpen

// Computed properties for panel widths
const leftMenuWidth = computed(() => {
  return `${leftMenuWidthPercent.value}%`;
});

const rightPanelWidth = computed(() => {
  return `${rightPanelWidthPercent.value}%`;
});

// Calculate minimum percentage for left panel width based on pixel minimum
const leftMenuMinPercent = computed(() => {
  if (!splitterContainer.value) return DEFAULT_LEFT_MENU_WIDTH_PCT.value; // fallback when container not ready
  const containerWidth = splitterContainer.value.clientWidth;
  return Math.max(DEFAULT_LEFT_MENU_WIDTH_PCT.value, (LEFT_MENU_MIN_WIDTH_PX.value / containerWidth) * 100);
});

const mainPanelWidth = computed(() => {
  const remaining = 100 - leftMenuWidthPercent.value - rightPanelWidthPercent.value;
  return `calc(${Math.max(MIN_MAIN_PANEL_WIDTH_PCT.value, remaining)}% - ${MAIN_PANEL_WIDTH_OFFSET_PX.value}px)`; // Subtract for two handles
});

// Resize functionality for left handle (between left menu and main content)
const startLeftResize = (e) => {
  isResizing.value = true;
  resizeType.value = 'left';
  startX.value = e.clientX || e.touches[0].clientX;
  startLeftMenuWidth.value = leftMenuWidthPercent.value;

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchmove', handleResize);
  document.addEventListener('touchend', stopResize);

  document.body.style.userSelect = 'none';
  e.preventDefault();
};

// Resize functionality for right handle (between main content and right menu)
const startRightResize = (e) => {
  isResizing.value = true;
  resizeType.value = 'right';
  startX.value = e.clientX || e.touches[0].clientX;
  startRightPanelWidth.value = rightPanelWidthPercent.value;

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchmove', handleResize);
  document.addEventListener('touchend', stopResize);

  document.body.style.userSelect = 'none';
  e.preventDefault();
};

const handleResize = (e) => {
  if (!isResizing.value || !splitterContainer.value) return;

  const clientX = e.clientX || e.touches[0].clientX;
  const containerWidth = splitterContainer.value.clientWidth;
  const deltaX = clientX - startX.value;
  const deltaPercent = (deltaX / containerWidth) * 100;

  if (resizeType.value === 'left') {
    // Only allow resizing if left drawer is open
    if (!layoutStore.leftDrawerOpen) return;

    // Resizing left menu
    let newLeftMenuWidth = startLeftMenuWidth.value + deltaPercent;

    // Apply limits (dynamic minimum based on pixel value to max percentage for left menu)
    newLeftMenuWidth = Math.max(leftMenuMinPercent.value, Math.min(MAX_LEFT_MENU_WIDTH_PCT.value, newLeftMenuWidth));

    // Ensure main panel doesn't get too small
    const remainingForMain = 100 - newLeftMenuWidth - rightPanelWidthPercent.value;
    if (remainingForMain < MIN_MAIN_PANEL_WIDTH_PCT.value) {
      newLeftMenuWidth = 100 - MIN_MAIN_PANEL_WIDTH_PCT.value - rightPanelWidthPercent.value;
    }

    leftMenuWidthPercent.value = newLeftMenuWidth;
  } else if (resizeType.value === 'right') {
    // Only allow resizing if right drawer is open
    if (!layoutStore.rightDrawerOpen) return;

    // Resizing right panel
    let newRightPanelWidth = startRightPanelWidth.value - deltaPercent;

    // Apply limits (default to max percentage for right panel)
    newRightPanelWidth = Math.max(DEFAULT_RIGHT_PANEL_WIDTH_PCT.value, Math.min(MAX_RIGHT_PANEL_WIDTH_PCT.value, newRightPanelWidth));

    // Ensure main panel doesn't get too small
    const remainingForMain = 100 - leftMenuWidthPercent.value - newRightPanelWidth;
    if (remainingForMain < MIN_MAIN_PANEL_WIDTH_PCT.value) {
      newRightPanelWidth = 100 - MIN_MAIN_PANEL_WIDTH_PCT.value - leftMenuWidthPercent.value;
    }

    rightPanelWidthPercent.value = newRightPanelWidth;
    layoutStore.layoutSplitterModel = newRightPanelWidth; // Keep sync with store
    layoutStore.prevLayoutSplitterModel = newRightPanelWidth; // Update saved width
  }
};

const stopResize = () => {
  isResizing.value = false;
  resizeType.value = '';

  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('touchmove', handleResize);
  document.removeEventListener('touchend', stopResize);

  document.body.style.userSelect = '';
};

// Watchers to sync with layout store
watch(() => layoutStore.leftDrawerOpen, (newValue) => {
  leftMenuWidthPercent.value = newValue ? leftMenuMinPercent.value : 0;
});

watch(() => layoutStore.rightDrawerOpen, (newValue) => {
  if (newValue) {
    // Opening: use prevLayoutSplitterModel or default percentage
    rightPanelWidthPercent.value = layoutStore.prevLayoutSplitterModel || DEFAULT_RIGHT_PANEL_WIDTH_PCT.value;
  } else {
    // Closing: set to 0%
    rightPanelWidthPercent.value = 0;
  }
});

// Also watch layoutSplitterModel changes when panel is open (for manual resizing)
watch(() => layoutStore.layoutSplitterModel, (newValue) => {
  if (layoutStore.rightDrawerOpen && newValue !== 100) {
    rightPanelWidthPercent.value = newValue;
  }
});

// Handle window resize to maintain pixel widths
let previousContainerWidth = 0;

const handleWindowResize = () => {
  if (layoutStore.leftDrawerOpen && splitterContainer.value) {
    const oldWidth = previousContainerWidth || splitterContainer.value.clientWidth;
    const newWidth = splitterContainer.value.clientWidth;
    
    // Calculate what the current pixel width was
    const currentPixelWidth = (leftMenuWidthPercent.value / 100) * oldWidth;
    
    // Calculate new percentage to maintain same pixel width
    let newPercent = (currentPixelWidth / newWidth) * 100;
    
    // Apply constraints: minimum pixel width and maximum percentage
    const minPercent = (LEFT_MENU_MIN_WIDTH_PX.value / newWidth) * 100;
    newPercent = Math.max(minPercent, Math.min(MAX_LEFT_MENU_WIDTH_PCT.value, newPercent));
    
    leftMenuWidthPercent.value = newPercent;
    previousContainerWidth = newWidth;
  }
};

onMounted(() => {
  // Initialize left panel width with proper minimum on mount
  if (layoutStore.leftDrawerOpen) {
    leftMenuWidthPercent.value = leftMenuMinPercent.value;
  }

  // Initialize previous container width
  if (splitterContainer.value) {
    previousContainerWidth = splitterContainer.value.clientWidth;
  }

  // Add window resize listener
  window.addEventListener('resize', handleWindowResize);
})

onBeforeUnmount(() => {
  // Clean up event listeners if component is unmounted during resize
  if (isResizing.value) {
    stopResize();
  }

  // Remove window resize listener
  window.removeEventListener('resize', handleWindowResize);
});

// Computed property to generate CSS variables
const cssVariables = computed(() => ({
  '--splitter-handle-width': `${SPLITTER_HANDLE_WIDTH_PX.value}px`,
  '--splitter-indicator-height': `${SPLITTER_INDICATOR_HEIGHT_PX.value}px`,
  '--splitter-indicator-width': `${SPLITTER_INDICATOR_WIDTH_PX.value}px`,
  '--mobile-left-menu-min-width': `${MOBILE_LEFT_MENU_MIN_WIDTH_PX.value}px`
}));

</script>

<style scoped>
.custom-splitter {
  display: flex;
  position: relative;
  overflow: visible; /* Allow content to overflow for modals/dialogs */
  z-index: 1; /* Ensure proper stacking context */
}

.splitter-panel {
  position: relative;
  overflow: visible; /* Key: Allow overflow for modals and dialogs */
  min-width: 0; /* Allow flex items to shrink below content size */
}

.splitter-left-menu {
  flex-shrink: 0;
  border-right: 1px solid;
  transition: width 0.3s ease;
  overflow: hidden; /* Hide content when width is 0 */
}

.splitter-main {
  flex-shrink: 0;
  position: relative;
  transition: width 0.3s ease;
  overflow: visible; /* Explicitly allow overflow for dialogs */
  z-index: 2; /* Higher z-index for main content and dialogs */
}

.splitter-right {
  flex-shrink: 0;
  border-left: 1px solid;
  transition: width 0.3s ease;
  overflow: hidden; /* Hide content when width is 0 */
  z-index: 1; /* Lower z-index so dialogs can appear above */
}

.splitter-handle {
  width: var(--splitter-handle-width, 4px);
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  transition: background-color 0.2s ease;
}

.splitter-handle:hover {
}

.splitter-handle:active {
}

/* Add visual indicator on hover */
.splitter-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--splitter-indicator-width, 2px);
  height: var(--splitter-indicator-height, 20px);
  transform: translate(-50%, -50%);
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.splitter-handle:hover::after {
  opacity: 1;
}

/* Ensure proper z-index for overflow content */
.splitter-panel > * {
  position: relative;
  z-index: 1;
}

/* Left menu scroll area */
.left-menu-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

/* Shadow for Variables/Settings/History area */
.inscriptor-insert-shadow-top {
}

/* Handle mobile touch */
@media (max-width: 768px) {
  .splitter-handle {
    width: calc(var(--splitter-handle-width, 4px) * 2); /* Make handle wider on mobile for easier touch */
  }

  .splitter-left-menu {
    min-width: var(--mobile-left-menu-min-width, 220px); /* Ensure left menu doesn't get too narrow on mobile */
  }
}
</style>
