<template>


  <transition
    appear
    enter-active-class="animated fadeIn slower"
    leave-active-class="animated fadeOut"
  >
    <q-card bordered ref="myHoverableElement" id="fakePromptResult">
      <div class="prompt-actions sticky-top">
        <div>
          <q-btn color="primary" flat unelevated size="sm" icon="mdi-chevron-double-left" id="fakePromptResultAdd">
          </q-btn>
          <q-btn-dropdown color="primary" flat unelevated size="sm" icon="mdi-content-copy">
            <q-list dense>
            </q-list>
          </q-btn-dropdown>

          <q-badge class="q-ml-md">Shorten text</q-badge>

          <q-btn class="float-right" flat color="negative" unelevated size="sm" icon="mdi-delete-outline" >
          </q-btn>
        </div>
        <q-separator />
      </div>
      <q-card-section >
        <q-spinner-grid v-if="false" />

        <div class="q-pa-none prompt-card-expanded">

          <div class="write-serif text-editor write-medium no-outline" >
            <span class="text-green-7">Start</span> writing your content <span class="text-green-7">or</span> <span class="text-green-7">select</span> text to access AI <span class="text-green-7">tools</span>. <span class="text-green-7">Use </span>Inscriptor Hub <span class="text-green-7">for</span> prompt packs or import AI models.<span class="text-green-7"> </span>Automate tasks <span class="text-green-7">like</span> grammar correction <span class="text-green-7">with</span> AI Analysis.<span class="text-green-7"> </span> Create something amazing!
          </div>
        </div>

      </q-card-section>

      <q-separator />

      <q-card-actions >
        <q-btn class="text-weight-bold" label="Reply" flat color="primary" unelevated size="sm" icon="mdi-reply-outline"  id="fakePromptResultReply">
          <q-tooltip>Reply on this prompt to AI</q-tooltip>
        </q-btn>

        <q-space />

        <q-btn class="text-weight-bold float-right" label="Prompt Again" flat color="primary" unelevated size="sm" icon="mdi-sync" id="fakePromptResultRegenerate">
          <q-tooltip>Generate this prompt again</q-tooltip>
        </q-btn>

      </q-card-actions>
    </q-card>

  </transition>
</template>

<script setup>


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
