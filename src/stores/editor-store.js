import { defineStore } from 'pinia';
import {getEditorSelection} from 'src/common/utils/editorUtils';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    editor: null,
    titleRef: null,

    pendingAutocompleteTextInput: null,

    autoCompleteText: null,
    autoCompleteTextInput: null,
  }),
  getters: {
    getEditor: (state) => state.editor,
  },
  actions: {
    setEditor(editor) {
      this.editor = editor;
    },
    // Agent decoration management methods
    addAgentDecoration(from, to, status = 'pending') {
      if (!this.editor) return false;
      return this.editor.commands.addAgentDecoration(from, to, status);
    },
    updateAgentDecoration(from, to, status) {
      if (!this.editor) return false;
      return this.editor.commands.updateAgentDecoration(from, to, status);
    },
    removeAgentDecoration(from, to) {
      if (!this.editor) return false;
      return this.editor.commands.removeAgentDecoration(from, to);
    },
    clearAllAgentDecorations() {
      if (!this.editor) return false;
      return this.editor.commands.clearAllAgentDecorations();
    },
    setPendingAutocompleteTextInput(input) {
      this.pendingAutocompleteTextInput = input;
    },
    setAutoCompleteText(text, input = null) {
      this.autoCompleteTextInput = input;

      if(text === this.autoCompleteText) {
        return;
      }

      this.autoCompleteText = text;
      if (this.editor) {
        this.editor.view.updateState(this.editor.state); // TODO motherfucker not working
      }
    },
    confirmAutocompleteText() {
      if(!this.autoCompleteText || !this.editor) return;

      const { from, to, empty } = getEditorSelection();

      this.editor
        .chain()
        //.focus()
        .insertContentAt(from, this.autoCompleteText,
          {
            updateSelection: false,
            parseOptions: {
              preserveWhitespace: true,
            }
          })
        .run();

      this.autoCompleteText = null;
    }
  }
});
