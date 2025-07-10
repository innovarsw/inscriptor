<template>
  <div class="code-editor">
    <div class="text-subtitle2">{{ label }}</div>
    <code-mirror
      ref="cm"
      :model-value="modelValue"
      @update:model-value="updateValue"
      basic
      :placeholder="label"
      tab
      wrap
      drawSelection
      :extensions="extensions"
    />
  </div>
</template>

<script setup>
import {onDeactivated, onMounted, ref} from "vue";
import {useFileStore} from "stores/file-store";
import CodeMirror from 'vue-codemirror6';
import { autocompletion } from "@codemirror/autocomplete";
import {variables} from "src/common/resources/variables";

const extensions = [
  autocompletion({
    icons: false,
    override: [myCompletions],
  }),
];

function myCompletions(context) {
  let word = context.matchBefore(/\w*/)
  if (word.from == word.to && !context.explicit)
    return null

  const options = [...variables];

  options.push(...props.parameters.map(parameter => {
    return {
      label: parameter.name, type: "variable", apply: '$' + parameter.name, info: parameter.hint, icon: null, detail: ''
      //value: parameter.name, description: parameter.hint, caption: 'Prompt'
    }
  }));

  options.push(...fileStore.variables.map(parameter => {
    return {
      label: parameter.title, type: "variable", apply: '$' + parameter.title, info: '', icon: null, detail: 'variable'
      //value: parameter.title, description: null, caption: 'Variable'
    }
  }));

  /*options.push(...fileStore.files.map(file => {
    return {
      label: file.title, type: "variable", apply: '@file(' + file.id + ',' + file.title + ')' , info: '', icon: null, detail: 'file'
      //value: parameter.title, description: null, caption: 'Variable'
    }
  }));*/

  return {
    from: word.from,
    options: options,
  }
}


const fileStore = useFileStore();

const cm = ref();

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  parameters: {
    type: Object,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
});



const emits = defineEmits(['update:modelValue']);

function updateValue(value) {
  emits('update:modelValue', value)
}

onMounted(() =>{
})

onDeactivated(() => {
});
</script>

<style lang="scss">
.cm-editor {
  min-height: 120px;
  border-radius: 6px !important;
}

.cm-content,
.cm-gutter {
  min-height: 150px;
  padding: 0.5rem 0.5rem !important;
//  font-family: Baskervville-Regular, Georgia, Garamond, "Times New Roman", Times, serif !important;
}

.cm-gutters {
  display: none !important;
}

.cm-scroller {
  overflow: auto;
}

.cm-wrap {
  border: 1px solid;
}

.code-editor {
  border: 0px solid;
  border-radius: 6px !important;
}

.cm-focused {
  outline-width: 0px !important;
  transition: background-color 0.36s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)
}

.ͼ2 .cm-activeLine {
}

.ͼ2 .cm-activeLineGutter {
}

.cm-completionLabel {
  @extend .text-caption !optional;
}

.cm-completionDetail {
  float: right;
}

</style>
