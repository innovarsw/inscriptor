<template>
  <q-page class="" style="overflow: visible;">
    <div class="full-width full-height" style="overflow: visible;">

      <div class="custom-splitter full-height" ref="splitterContainer">
        <!-- Left Menu Panel -->
        <div
          class="splitter-panel splitter-left-menu bg-transparent"
          :style="{ width: leftMenuWidth }"
        >
          <div style="height: calc(100vh - 32px)">
            <div class="fit left-menu-scroll">
              <div class="q-pa-none">
                <LeftMenuComponent />
              </div>
              <div class="absolute full-width" style="bottom: 0">
                <q-separator />
                <div class="row items-center bg-white justify-center no-wrap" id="variables">
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
          <div class="" style="height: calc(100vh - 50px); overflow-y: auto; overflow-x: visible;">
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
          <div class="" style="height: calc(100vh - 33px)">
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
const splitterContainer = ref(null);
const isResizing = ref(false);
const resizeType = ref(''); // 'left' or 'right'
const startX = ref(0);
const startLeftMenuWidth = ref(12); // Default 10% for left menu (matches minimum)
const startRightPanelWidth = ref(15); // Starting width for right panel resize (matches minimum)

// Store panel widths as percentages
const leftMenuWidthPercent = ref(layoutStore.leftDrawerOpen ? 12 : 0); // Will be updated to use dynamic minimum
const rightPanelWidthPercent = ref(layoutStore.rightDrawerOpen ? (layoutStore.prevLayoutSplitterModel || 15) : 0); // Show/hide based on rightDrawerOpen

// Computed properties for panel widths
const leftMenuWidth = computed(() => {
  return `${leftMenuWidthPercent.value}%`;
});

const rightPanelWidth = computed(() => {
  return `${rightPanelWidthPercent.value}%`;
});

// Calculate minimum percentage for 270px left panel width
const leftMenuMinPercent = computed(() => {
  if (!splitterContainer.value) return 12; // fallback when container not ready
  const containerWidth = splitterContainer.value.clientWidth;
  return Math.max(12, (270 / containerWidth) * 100);
});

const mainPanelWidth = computed(() => {
  const remaining = 100 - leftMenuWidthPercent.value - rightPanelWidthPercent.value;
  return `calc(${Math.max(20, remaining)}% - 8px)`; // Subtract 8px for two 4px handles
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

    // Apply limits (dynamic minimum based on 270px to 35% for left menu)
    newLeftMenuWidth = Math.max(leftMenuMinPercent.value, Math.min(35, newLeftMenuWidth));

    // Ensure main panel doesn't get too small
    const remainingForMain = 100 - newLeftMenuWidth - rightPanelWidthPercent.value;
    if (remainingForMain < 20) {
      newLeftMenuWidth = 100 - 20 - rightPanelWidthPercent.value;
    }

    leftMenuWidthPercent.value = newLeftMenuWidth;
  } else if (resizeType.value === 'right') {
    // Only allow resizing if right drawer is open
    if (!layoutStore.rightDrawerOpen) return;

    // Resizing right panel
    let newRightPanelWidth = startRightPanelWidth.value - deltaPercent;

    // Apply limits (15% to 50% for right panel)
    newRightPanelWidth = Math.max(15, Math.min(50, newRightPanelWidth));

    // Ensure main panel doesn't get too small
    const remainingForMain = 100 - leftMenuWidthPercent.value - newRightPanelWidth;
    if (remainingForMain < 20) {
      newRightPanelWidth = 100 - 20 - leftMenuWidthPercent.value;
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
    // Opening: use prevLayoutSplitterModel or default to 15%
    rightPanelWidthPercent.value = layoutStore.prevLayoutSplitterModel || 15;
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

// Handle window resize to recalculate minimum percentages
const handleWindowResize = () => {
  // Ensure left panel doesn't shrink below 270px when window is resized
  if (layoutStore.leftDrawerOpen && leftMenuWidthPercent.value < leftMenuMinPercent.value) {
    leftMenuWidthPercent.value = leftMenuMinPercent.value;
  }
};

onMounted(() => {
  // Initialize left panel width with proper minimum on mount
  if (layoutStore.leftDrawerOpen) {
    leftMenuWidthPercent.value = leftMenuMinPercent.value;
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
  border-right: 1px solid #e0e0e0;
  background-color: #fafafa;
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
  border-left: 1px solid #e0e0e0;
  transition: width 0.3s ease;
  overflow: hidden; /* Hide content when width is 0 */
  z-index: 1; /* Lower z-index so dialogs can appear above */
}

.splitter-handle {
  width: 4px;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  transition: background-color 0.2s ease;
}

.splitter-handle:hover {
  background-color: #d0d0d0;
}

.splitter-handle:active {
  background-color: #1976d2;
}

/* Add visual indicator on hover */
.splitter-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 20px;
  background-color: #999;
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
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

/* Handle mobile touch */
@media (max-width: 768px) {
  .splitter-handle {
    width: 8px; /* Make handle wider on mobile for easier touch */
  }

  .splitter-left-menu {
    min-width: 220px; /* Ensure left menu doesn't get too narrow on mobile */
  }
}
</style>
