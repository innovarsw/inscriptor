<template>
  <q-dialog v-model="layoutStore.messageUsDialog" >
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Message Us!</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-gutter-y-sm">
        <q-input dense outlined v-model="title" label="Title" />
        <q-input dense outlined v-model="message" type="textarea" label="Message" />

        <div class="text-center">
          <div class="text-center">We value your feedback and we will contact you back as soon as possible.</div>
          <div class="text-center">You can also contact us at <a href="mailto:info@inscriptor.io">info@inscriptor.io</a></div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn icon="mdi-reply-outline" label="Send" color="primary" @click="sendFeedback" :disable="!canSendFeedback" :loading="sent"/>
      </q-card-actions>
    </q-card>

  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {computed, ref} from "vue";
  import {sendFeedbackMessage} from "src/common/apiServices/feedbackService";
  import {useCurrentUser} from "vuefire";
  import {Notify} from "quasar";

  const message = ref('');
  const title = ref('');
  const user = useCurrentUser();

  const sent = ref(false);

  const layoutStore = useLayoutStore();

  async function sendFeedback() {
    if(!sent.value || message.value && message.value.length > 1 && title.value && title.value.length > 1) {

      if(!user) return;

      sent.value = true;

      try {
        await sendFeedbackMessage(user, title.value, message.value);
      } catch (error) {
        return;
      }

      message.value = '';
      title.value = '';

      Notify.create({
        message: 'Feedback sent!',
        color: 'positive',
        position: 'top',
        timeout: 2000
      });

      // send feedback
      layoutStore.messageUsDialog = false;
    } else {
      Notify.create({
        message: 'Please enter a title and a message',
        color: 'negative',
        position: 'top',
        timeout: 2000
      });
    }
  }

  const canSendFeedback = computed(() => message.value.length > 1 && title.value.length > 1);
</script>

<style scoped>

</style>
