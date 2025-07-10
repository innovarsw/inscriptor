<template>
  <q-dialog v-model="layoutStore.searchOpen" position="top" >
    <q-card style="width: 800px; max-width: 70vw;">
      <q-input v-model="searchQuery" label="Search..." filled style="min-width: 300px;" dense ref="searchRef" autofocus :debounce="500" clearable>
        <template v-slot:prepend>
          <q-icon name="mdi-magnify" size="xs" />
        </template>
      </q-input>

      <q-card-section v-if="noResults">
        <span class="text-caption">No results found</span>
      </q-card-section>

      <q-card-section v-if="queryResults && queryResults.length > 0">
        <q-list dense>
          <q-item v-for="result in queryResults" :key="result.id" clickable dense @click="openFile(result, false)">
            <q-item-section side>
              <q-icon :name="result.file.originalFile.icon ?? 'mdi-file-document-outline'" :color="result.file.originalFile.state?.color" class="no-padding no-margin" size="17px" />
            </q-item-section>
            <q-item-section>
              <q-item-label><div v-html="result.file.originalFile.title" /></q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-section v-if="fileNameResults.length > 0 || fileContentResults.length > 0">
        <q-list dense>
          <q-item v-for="result in fileNameResults" :key="result.file.id" clickable dense @click="openFile(result.file, false)">
            <q-item-section side>
              <q-icon :name="result.file.icon ?? 'mdi-file-document-outline'" :color="result.file.state?.color" class="no-padding no-margin" size="17px" />
            </q-item-section>
            <q-item-section>
              <q-item-label><div v-html="result.annotation" /></q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-list dense>
          <q-item v-for="result in fileContentResults" :key="result.file.id" clickable dense @click="openFile(result.file, false)">
            <q-item-section side>
              <q-icon :name="result.file.icon ?? 'mdi-file-document-outline'" :color="result.file.state?.color" class="no-padding no-margin" size="17px" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ result.file.title }}</q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label><div v-html="result.annotation" /></q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>
<script setup>
import {ref, watch} from "vue";
import {useLayoutStore} from "stores/layout-store";
import {useFileStore} from "stores/file-store";
import {removeHtmlTags} from "src/common/utils/textUtils";

const layoutStore = useLayoutStore();
const fileStore = useFileStore();

const searchQuery = ref('');

const fileNameResults = ref([]);
const fileContentResults = ref([]);

const noResults = ref(false);

const queryResults = ref(null);

watch(searchQuery, (v) => {
  doSearch();
})

function doSearch() {
  if(!searchQuery.value || searchQuery.value.length < 1) {
    fileNameResults.value = [];
    fileContentResults.value = [];
    noResults.value = false;
    return;
  }

  //TODO replace the methods below with this search
  //queryResults.value = fileStore.queryFiles(searchQuery.value, fileStore.files, true, true, { threshold: 0 });

  function filterFilesByTitles(file, results) {
    const queryLower = searchQuery.value.toLowerCase();
    const titleLower = file.title.toLowerCase();
    const index = titleLower.indexOf(queryLower);

    if (index !== -1) {
      const highlightedTitle = file.title.replace(new RegExp(queryLower, 'gi'), (match) => `<span class="highlight">${match}</span>`);
      results.push({
        file: file,
        annotation: highlightedTitle
      });
    }

    for (const child of file.children ?? []) {
      filterFilesByTitles(child, results);
    }
  }

  function filterFilesByContent(file, results) {
    const content = removeHtmlTags(file.content);
    const contentLower = removeHtmlTags(file.content.toLowerCase());
    const queryLower = searchQuery.value.toLowerCase();
    const index = contentLower.indexOf(queryLower);

    if (index !== -1) {
      const start = Math.max(0, index - 20);
      const end = Math.min(contentLower.length, index + queryLower.length + 20);
      const snippet = '...' + content.substring(start, end) + '...';
      const highlightedSnippet = snippet.replace(new RegExp(queryLower, 'gi'), (match) => `<span class="highlight">${match}</span>`);

      results.push({
        file: file,
        annotation: highlightedSnippet
      });
    }

    for (const child of file.children ?? []) {
      filterFilesByContent(child, results);
    }
  }

  const resultsTitle = [];
  const resultsContent = [];

  for(const file of fileStore.files) {
    filterFilesByTitles(file, resultsTitle);
    filterFilesByContent(file, resultsContent);
  }

  fileNameResults.value = [...resultsTitle]
  fileContentResults.value = [...resultsContent]

  // limit 10 results
  fileNameResults.value = fileNameResults.value.slice(0, 10);
  fileContentResults.value = fileContentResults.value.slice(0, 10);

  if(fileNameResults.value.length === 0 && fileContentResults.value.length === 0) {
    noResults.value = true;
  } else {
    noResults.value = false;
  }
}

function openFile(file) {
  fileStore.selectFile(file, false);
  layoutStore.searchOpen = false;
}

const input = ref('');
</script>

<style>
</style>
