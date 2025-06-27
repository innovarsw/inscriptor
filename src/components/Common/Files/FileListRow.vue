<template>

  <div style="position: relative;" >
    <div v-if="isDragAndDropping" :class="[offset]" class="drop-box" style="height: 5px;"
         @dragevent.prevent
         @dragover.prevent
         @dragenter="onDragBetweenEnter($event, file)"
         @dragleave="onDragBetweenLeave($event, file)"
         @drop="onDropBetween($event, file, false)"
    ></div>
  </div>

  <div class="q-mx-sm" :class="[hover, classes]" ref="mainFileDivRow" @click="selectFile" >
    <div class="row" :class="[offset]">
      <div
        ref="mainFileDiv"
        @dragevent.prevent
        @dragover.prevent
        @dragenter="onDragEnter($event, file)"
        @dragleave="onDragLeave($event, file)"
        @drop="onDrop($event, file)"
        class="col self-center cursor-pointer" style="height: 25px;">

        <div class="row">
          <div class="col-auto">
            <q-btn :color="props.file.state?.color" flat dense @click.prevent="clickExpandFile($event, file)" padding="4px 1px" size="10px" class="q-mr-xs">
              <q-icon :name="isMainRowHovered ? (file.expanded ? 'expand_less' : 'expand_more') : (file.icon ?? ('mdi-folder-outline'))" size="16px" class="no-margin no-padding"/>
              <q-tooltip :delay="500" v-if="props.file.state?.color">
                State: {{ props.file.state?.label }}
              </q-tooltip>
            </q-btn>
          </div>

          <div class="col flex items-center">
            <span class="file-menu-item flex items-center no-wrap" style="white-space: nowrap; overflow: hidden;">
              {{ truncate(file.title, 300) }}
              <span v-if="file.dirty" class="text-grey-7">*</span>
              <template v-if="file.children && file.children.length > 0 && !file.expanded">
                <q-badge color="grey-5" rounded :label="file.children.length" class="q-ml-xs file-child-count-bubble">
                </q-badge>
              </template>
            </span>
          </div>

          <div class="col-auto flex items-center q-ml-xs">
            <template v-for="(label, index) in file.labels ?? []" :key="index">
              <q-badge :color="label.color + '-3'" rounded class="q-ml-xs">
                <q-tooltip :delay="500">
                  {{ label.label }} label
                </q-tooltip>
              </q-badge>
            </template>

            <template v-if="file.settings?.contextType">
              <q-badge :color="file.settings.contextType.color + '-1'" :text-color="file.settings.contextType.color + '-7'" rounded class="q-ml-xs" style="font-size: 0.7rem;">
                <template v-if="isMainRowHovered">
                  {{file.settings?.contextType.label}}
                </template>
                <template v-else>
                  {{file.settings?.contextType.label.charAt(0)}}
                </template>
                <q-tooltip :delay="500">
                  This file is included in the {{ file.settings.contextType.label }} context.
                </q-tooltip>
              </q-badge>
            </template>
          </div>
          <div class="col-auto flex items-center" :style="{ visibility: isMainRowHovered ? 'visible' : 'hidden' }">
            <q-btn icon="mdi-dots-horizontal" color="grey" flat dense size="10px" padding="3px 2px" @click.stop class="q-ml-xs">
              <q-menu>
                <FileListRowContextMenu :file="file"/>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
  <template v-if="showChildren && file.children?.length > 0 && file.expanded">
    <template v-for="(child, index) in file.children"
              :key="child.id">
      <FileListRow :file="child"
                   :show-children="true"
                   :level="level + 1"
                   :is-last-children="index === file.children.length - 1"/>

    </template>
  </template>
  <template v-if="showChildren && file.expanded && (!file.children || file.children.length === 0)">
    <div class="q-mx-sm" :class="[]" @click="selectFile" ref="emptyChildRef" >
      <div class="row full-width text-grey-5 text-caption items-center" style="height: 23px">
        <div class="col-auto" :class="offset"  />
        <div class="col-auto q-ml-lg" v-if="!isEmptyChildRefHovered">
          Nothing inside
        </div>
        <div class="col-auto q-ml-lg" v-if="isEmptyChildRefHovered">
          <q-btn unelevated size="12px" color="grey-5" padding="1px 5px" flat dense no-caps class="transparent full-width q-mx-sm" @click="addFile(file, $event)">
            <q-icon name="add" /> Add
          </q-btn>
        </div>
      </div>
    </div>
  </template>


  <div style="position: relative">
    <div v-if="isLastChildren && isDragAndDropping" class="drop-box" :class="[offset]" style="height: 5px;"
         @dragevent.prevent
         @dragover.prevent
         @dragenter="onDragBetweenEnter($event, file)"
         @dragleave="onDragBetweenLeave($event, file)"
         @drop="onDropBetween($event, file, true)"
    ></div>
  </div>

</template>

<script setup>
import {useFileStore} from "stores/file-store";
import {computed, ref} from "vue";
import {useLayoutStore} from "stores/layout-store";
import {useElementHover} from "@vueuse/core";
import {usePromptStore} from "stores/prompt-store";
import {truncate} from "src/common/utils/textUtils";
import FileListRowContextMenu from "components/Common/Files/FileListRowContextMenu.vue";

const fileStore = useFileStore();
const layoutStore = useLayoutStore();
const promptStore = usePromptStore();

const isDragAndDropping = computed(() => layoutStore.getIsDragAndDropping);
const mainFileDiv = ref(null);
const mainFileDivRow = ref(null);
const emptyChildRef = ref(null);

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
  showChildren: {
    type: Boolean,
    default: true,
  },
  level: {
    type: Number,
    default: 0,
  },
  isLastChildren: {
    type: Boolean,
    default: false,
  },
});

const truncateContextChars = computed(() => {
  return isMainRowHovered.value ? 15 : 0;
})

const offset = computed(() => 'tree-padding-' + props.level);

const isMainRowHovered = computed(() => isHovered.value && (!isEmptyChildRefHovered.value || !emptyChildRef.value));

const isHovered = useElementHover(mainFileDivRow);
const isEmptyChildRefHovered = useElementHover(emptyChildRef, {

});

const hover = computed(() => isHovered.value ? 'bg-file-list-hover file-list-item-hover' : 'file-list-item');

const isSelected = computed(() => fileStore.selectedFile?.id === props.file.id);

const classes = computed(() => {
  return {
    'bg-file-list-selected': isSelected.value,
  };
});

function selectFile () {
  fileStore.selectFile(props.file);
}

async function addFile(parent, event) {
  const file = await fileStore.addFile('New', parent);
  if(file) {
    fileStore.selectFile(file, true);
  }

  if(event) {
    event.stopPropagation();
  }
}

let dragEnterTarget = null;
let dragBetweenEnterTarget = null;

function startDrag(event, item) {
  if(event.target && event.target.style) {
    event.target.style.opacity = '0.4';
  }

  console.log('drag start');
  event.dataTransfer.dropEffect = 'move';
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setDragImage(mainFileDiv.value, 0, 0);

  let files = [];
  files.push(item);
  /*if(store.getSelectedPages.find((p) => item.id === p.id)) {
    pages = store.getSelectedPages;
  } else {
    pages = [];
    pages.push(item);
  }*/

  const json = JSON.stringify(files.map((p) => p.id));

  //event.dataTransfer.setData( 'text/plain', pages.map((p) => p.id).join(','));
  //event.dataTransfer.setData( 'text/html', '<span>aa</span>' );
  event.dataTransfer.setData('itemId', json);

  setTimeout(() => {
    // for some fucking reason, if this is called synchronously, it stops drag n drop from working
    layoutStore.setIsDragAndDropping(true);
  }, 0);
}

function endDrag(event, item) {
  console.log('drag end');
  layoutStore.setIsDragAndDropping(false);

  if(event.srcElement && event.srcElement.style) {
    event.srcElement.style.opacity = '1';
  }
}

async function onDrop(event, targetPage) {
  console.log('drop');
  const itemIds = JSON.parse(event.dataTransfer.getData('itemId'));

  const files = [];
  for (const id of itemIds) {
    files.push(fileStore.getFile(id))
  }

  mainFileDiv.value?.classList.remove('bg-grey-4');

  for (const file of files) {
    if (!fileStore.checkCanDrop(file, targetPage)) {
      return;
    }
  }

  for (const file of files) {
    await fileStore.setParent(file, targetPage.id);
    fileStore.selectFile(file);
  }


}

async function onDropBetween(event, targetPage, after) {

  let targetPageCollection = fileStore.files;
  if(targetPage.parentId) {
    console.log(targetPage.parentId);
    targetPageCollection = targetPage.parent.children;
  }

  console.log(targetPageCollection);

  if(dragBetweenEnterTarget) {
    dragBetweenEnterTarget.classList.remove('bg-grey-4');
  }

  const itemIds = JSON.parse(event.dataTransfer.getData('itemId'));

  const files = [];
  for (const id of itemIds) {
    files.push(fileStore.getFile(id))
  }

  for (const file of files) {
    if (!fileStore.checkCanDrop(file, targetPage)) {
      return;
    }
  }

  let order = targetPageCollection.indexOf(targetPage);

  for (const file of files) {
    if(file === targetPage) continue;

    if(after) {
      order ++;
    }

    // when moving in the same parent to earlier position, we need to account for the current order
    if(file.parent === targetPage.parent && file.order < order) {
      order --;
    }

    await fileStore.setParent(file, targetPage.parentId, order);

    if(!after) {
      order ++;
    }
  }
}

function onDragEnter(event, item) {
  dragEnterTarget = event.target;

  if(event.target) {
    mainFileDiv.value.classList.add('bg-grey-4');
  }

  event.stopPropagation();
  event.preventDefault();
}

function onDragLeave(event, item) {
  if(dragEnterTarget === event.target) {
    event.stopPropagation();
    event.preventDefault();
    mainFileDiv.value.classList.remove('bg-grey-4');
  }
}

function onDragBetweenEnter(event, item) {
  dragBetweenEnterTarget = event.target;

  if(event.target) {
    event.target.classList.add('bg-grey-4');
  }

  event.stopPropagation();
  event.preventDefault();
}

function onDragBetweenLeave(event, item) {
  if(dragBetweenEnterTarget === event.target) {
    event.stopPropagation();
    event.preventDefault();
    event.target.classList.remove('bg-grey-4');
  }
}

function clickExpandFile(event, file) {
  file.expanded = !file.expanded;
  event.stopPropagation();
}

const fileTemplates = computed(() => promptStore.fileTemplates);

</script>

