import { defineStore } from 'pinia';
import {getUserData, setUserState} from "src/common/apiServices/userProjectService";
import {useCurrentUser} from "vuefire";
import {getModelData} from "src/common/apiServices/modelService";
import {useFileStore} from "stores/file-store";
import {tutorial} from "src/common/utils/driverUtils";
import {useQuasar} from "quasar";
import { setCssVar } from 'quasar'

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    leftDrawerOpen: true,
    rightDrawerOpen: true,
    layoutSplitterModel: 50,
    prevLayoutSplitterModel: 50,
    settingsOpen: false,
    variableSettingsOpen: false,
    isDragAndDropping: false,
    consoleOpen: false,
    fileSettingsOpen: false,

    loginDialogOpen: false,
    projectSelectionDialogOpen: false,

    analysisTriggered: false,

    projectSyncIndicator: false,
    projectSyncIndicatorValue: false,
    userSyncIndicator: false,
    userSyncIndicatorValue: false,

    loadingDialogOpen: false,
    loadingDialogMessage: "",

    promptMarketplaceOpen: false,

    quickPromptSettingsOpen: false,
    quickPromptSettingsPrompt: null,

    messageUsDialog: false,

    exportDialogOpen: false,
    exportDialogFile: null,

    errorDialogOpen: false,

    userInfoDialogOpen: false,
    userData: null,
    modelData: null,

    browserDialogOpen: false,

    darkMode: false,
    browserDialogUrl: "",

    promptUiDialogOpen: false,
    promptUiDialogPromptResult: null,

    promptActionDialogOpen: false,
    promptAction: null,
    promptActionPromptResult: null,

    promptSelectorManuallyOpened: false,
    fileDetailsOpen: false,
    fakePromptResult: false,

    searchQuery: '',
    searchOpen: false,

    lowOnCreditsDialog: false,

    desktopAppVersion: null,


    ctrlDown: false,

    tutorialOpened: false,

    feedbackWindowOpened: false,
    tutorialCode: '',

    appTourOpened: false,
    settingsTab: 'prompts',

    settingsPredefinedPromptsOpened: false,
    settingsLabelsOpened: false,
    settingsStatusesOpened: false,
    settingsContextTypesOpened: false,
    settingsPromptCategoriesOpened: false,
    settingsPromptFoldersOpened: false,
    settingsFileTemplatesOpened: false,
    settingsDefaultFileSettingsOpened: false,

    addPromptDialogOpened: false,
    addPromptDialogStep: 1,
    addPromptDialogPromptName: 'New Prompt',
    addPromptDialogSystemPrompt: 'Perform the task to the best of your ability',
    addPromptDialogUserPrompt: '$textOrSelection',
    addPromptDialogModelId: '',

    customPromptModelValue: '',

    newUserWelcomeDialog: false,
    newUserWelcomeDialogStep: -1,

    promptPreview: null,
    promptPreviewShown: false,

    chatSystemPromptText: null,

    editProjectMetadataOpen: false,

    currentRightMenuView: 'prompts',
  }),
  getters: {
    getIsDragAndDropping: (state) => state.isDragAndDropping,
  },
  actions: {
    applyDarkMode($q, isDarkMode) {
      // Apply theme classes to body element and set primary color
      if (isDarkMode) {
        document.body.classList.remove('day-mode');
        document.body.classList.add('dark-mode');
        // Set lighter primary color for dark mode
        setCssVar('primary', '#7e7e8e');
      } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('day-mode');
        // Set original primary color for light mode
        setCssVar('primary', '#7e7e8e');
      }
    },
    toggleDarkMode($q) {
      $q.dark.toggle();
      this.darkMode = $q.dark.isActive;
      this.applyDarkMode($q, this.darkMode);
      // Persist to localStorage
      localStorage.setItem('inscriptor_darkMode', this.darkMode);
    },
    initializeDarkMode($q) {
      const saved = localStorage.getItem('inscriptor_darkMode');
      let isDarkMode;

      if (saved !== null) {
        isDarkMode = JSON.parse(saved);
        $q.dark.set(isDarkMode);
      } else {
        // Default to system preference
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        $q.dark.set(isDarkMode);
        localStorage.setItem('inscriptor_darkMode', isDarkMode);
      }

      // Update store state
      this.darkMode = isDarkMode;
      this.applyDarkMode($q, isDarkMode);
    },
    setLeftDrawerOpen(b) {
      this.leftDrawerOpen = b;
    },
    resetAddPromptDialog() {
      this.addPromptDialogPromptName = 'New Prompt';
      this.addPromptDialogSystemPrompt = 'Perform the task to the best of your ability';
      this.addPromptDialogUserPrompt = '$textOrSelection';
      this.addPromptDialogStep = 1;
    },
    openAddPromptDialog(b, modelId, systemPrompt = undefined, userPrompt = undefined, promptName = undefined) {
      if(b === true && this.addPromptDialogOpened === false) {
        this.resetAddPromptDialog();
      }
      this.addPromptDialogModelId = modelId;
      if (systemPrompt) {
        this.addPromptDialogSystemPrompt = systemPrompt;
      }
      if (userPrompt) {
        this.addPromptDialogUserPrompt = userPrompt;
      }
      if (promptName) {
        this.addPromptDialogPromptName = promptName;
      }
      this.addPromptDialogOpened = b;
    },
    setSettingsOpen(b) {
      if(b === true && this.settingsOpen === false) {
        this.settingsTab = 'prompts';
        this.settingsPredefinedPromptsOpened = false;
        this.settingsLabelsOpened = false;
        this.settingsStatusesOpened = false;
        this.settingsContextTypesOpened = false;
        this.settingsPromptCategoriesOpened = false;
        this.settingsPromptFoldersOpened = false;
        this.settingsFileTemplatesOpened = false;
        this.settingsDefaultFileSettingsOpened = false;
      }

      this.settingsOpen = b;
    },
    setVariableSettingsOpen(b) {
      this.variableSettingsOpen = b;
    },
    setConsoleOpen(b) {
      this.consoleOpen = b;
    },
    closeRightPanel() {
      this.rightDrawerOpen = !this.rightDrawerOpen;
      if(this.layoutSplitterModel === 100) {
        this.layoutSplitterModel = this.prevLayoutSplitterModel;
      } else {
        this.prevLayoutSplitterModel = this.layoutSplitterModel;
        this.layoutSplitterModel = 100;
      }
    },
    setIsDragAndDropping(val) {
      this.isDragAndDropping = val;
    },
    setAnalysisWillBeTriggered(time) {
      this.analysisTriggered = true;

      setTimeout(() => {
        this.analysisTriggered = false;
      }, time);
    },
    setAnalysisTriggered(b) {
      this.analysisTriggered = b;
    },
    setProjectSyncIndicator(val, timeout = 0) {
      this.projectSyncIndicatorValue = val;

      if(val === true || timeout === 0) {
        this.projectSyncIndicator = val;
      }

      let setTimer = val === true && timeout > 0;
      let setTimerTime = timeout;

      if(setTimer) {
        setTimeout(() => {
          if(this.projectSyncIndicatorValue === false) {
            this.projectSyncIndicator = false;
          }
        }, setTimerTime);
      }
    },
    setLoadingDialogOpen(b, message = "") {
      this.loadingDialogOpen = b;
      this.loadingDialogMessage = message;
    },
    async showUserDialog() {
      this.userInfoDialogOpen = true;

      await this.loadUserData();
    },
    async loadUserData() {
      const user = useCurrentUser();

      if(user && !user.isAnonymous) {
        try {
          const idToken = await user.value.getIdToken();
          const data = await getUserData(idToken);
          this.userData = JSON.parse(data)

          await this.onUserDataLoad(idToken);

          return this.userData;
        } catch (error) {
          return null;
        }
      } else {
        this.userData = null;

        return null;
      }
    },
    async onUserDataLoad(idToken) {

      if(this.userData) {
        if(this.userData.state === 0) {
          await setUserState(idToken, { firstLoginCompleted: true })
        }
      }
    },
    async loadModelData() {
      const user = useCurrentUser();

      if(user) {
        try {
          const data = await getModelData(await user.value.getIdToken());
          this.modelData = JSON.parse(data)
        } catch (error) {
          return;
        }
      } else {
        this.modelData = null;
      }
    },
    getModelData(modelName) {
      if(!this.modelData) {
        return null;
      }

      return this.modelData.models?.find(m => m.name === modelName);
    },
    getMaxFiles() {
      if(!this.userData) {
        return 0;
      }

      return this.userData.maxFiles;
    },
    getMaxFileSize() {
      if(!this.userData) {
        return 0;
      }

      const fileStore = useFileStore();

      if(fileStore.projectSettings?.syncToCloud) {
        return this.userData.maxFileSize;
      } else {
        return 300000;
      }
    },
    getMaxProjects() {
      if(!this.userData) {
        return 0;
      }

      return this.userData.maxProjects;
    },
    openPromptActionDialog(promptAction, promptActionPromptResult) {
      this.promptActionDialogOpen = true;
      this.promptAction = promptAction;
      this.promptActionPromptResult = promptActionPromptResult;
    },
    runsInDesktopApp() {
      return window.__TAURI_INTERNALS__;
    },
    openTutorial(tutorialName, callback) {
      return tutorial(tutorialName, callback);
    },
    openConfiguration(configuration) {
      if(configuration === 'labels') {
        this.setSettingsOpen(true);
        this.settingsTab = 'files';
        this.settingsLabelsOpened = true;
      } else if(configuration === 'statuses') {
        this.setSettingsOpen(true);
        this.settingsTab = 'files';
        this.settingsStatusesOpened = true;
      } else if(configuration === 'contextTypes') {
        this.setSettingsOpen(true);
        this.settingsTab = 'files';
        this.settingsContextTypesOpened = true;
      } else if(configuration === 'promptCategories') {
        this.setSettingsOpen(true);
        this.settingsTab = 'files';
        this.settingsPromptCategoriesOpened = true;
      } else if(configuration === 'promptFolders') {
        this.setSettingsOpen(true);
        this.settingsTab = 'files';
        this.settingsPromptFoldersOpened = true;
      } else if(configuration === 'predefinedPrompts') {
        this.setSettingsOpen(true);
        this.settingsTab = 'files';
        this.settingsPredefinedPromptsOpened = true;
      }else if(configuration === 'fileTemplates') {
        this.setSettingsOpen(true);
        this.settingsTab = 'files';
        this.settingsFileTemplatesOpened = true;
      } else if(configuration === 'defaultFileTemplate') {
        this.setSettingsOpen(true);
        this.settingsTab = 'files';
        this.settingsDefaultFileSettingsOpened = true;
      } else if(configuration === 'apiKeys') {
        this.setSettingsOpen(true);
        this.settingsTab = 'apikeys';
      }
    },
    openPromptUiDialog(promptResult) {
      this.promptUiDialogOpen = true;
      this.promptUiDialogPromptResult = promptResult;
    }
  }
});
