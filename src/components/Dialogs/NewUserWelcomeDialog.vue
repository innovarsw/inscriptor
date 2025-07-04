<template>
  <q-dialog v-model="layoutStore.newUserWelcomeDialog" persistent maximized transition-show="jump-up" transition-hide="jump-down" transition-duration="1500">
    <div class="flex items-center justify-around welcome-dialog-bg" flat bordered>
      <div class="flex text-aleo">
        <transition-group
          appear
          enter-active-class="animated fadeIn slower"
          leave-active-class="animated fadeOut "
        >
          <div class="text-white text-h5" v-if="step === 0">
            Welcome to <span class="text-accent">Inscriptor!</span>
          </div>
          <div class="text-white  text-h6" v-if="step === 2">
            <div>Thank you for being an early adopter.</div>
          </div>
          <div class="text-white  text-h6" v-if="step === 4">
            <div>Do you have a promo code?</div>

            <transition-group
              appear
              enter-active-class="animated fadeIn slower delay-1s"
              leave-active-class="animated fadeOut "
            >
              <div class="flex q-gutter-x-md justify-center q-mt-md">
                <q-btn label="Yes" color="accent" @click="step = 5; scheduleStep(6, 500)" />
                <q-btn label="No :-(" color="primary" @click="step = 7; scheduleStep(8)" />
              </div>
            </transition-group>
          </div>

          <div class="text-white" v-if="step === 6">
            <div class="text-center text-h6">Great! Enter the code:</div>

            <transition-group
              appear
              enter-active-class="animated fadeInDown slower delay-1s"
              leave-active-class="animated fadeOut "
            >
              <div class="flex q-gutter-x-md justify-center q-mt-md">
                <q-input filled color="accent" bg-color="grey-3" autofocus v-model="promoCode" dense />
                <q-btn no-caps label="Confirm" color="accent" @click="confirmPromoCode()" />
                <q-btn no-caps label="Skip" color="primary" @click="step = 5; scheduleStep(7)" />
              </div>
            </transition-group>

            <div style="height: 75px" class="q-mt-lg">
              <transition
                appear
                enter-active-class="animated fadeInDown slower delay-1s"
                leave-active-class="animated fadeOut "
              >
                <div class="flex justify-center text-subtitle1" v-if="couponMessage">
                  {{ couponMessage}}
                </div>
              </transition>
            </div>
          </div>

          <div class="text-white  text-h6" v-if="step === 8">
            <div>Never mind, we still gave you <span class="text-accent">10 free AI credits</span> to get started!</div>

            <div class="flex q-gutter-x-md justify-end q-mt-md">
              <q-btn no-caps label="OK!" color="accent" @click="step = 9; scheduleStep(10)" />
            </div>
          </div>

          <div class="text-white  " v-if="step === 10">
            <div class="text-h5 text-center">Enjoy <span class="text-accent">Inscriptor!</span></div>

            <div class="text-subtitle1 text-center q-mt-md">Consider watching the App Tour and other tutorials to get the most out of it.</div>

            <div class="text-subtitle1 text-center q-mt-sm">Also, please give us your Feedback. Only that will help us build the best writing tool.</div>

            <div class="flex q-gutter-x-md justify-center q-mt-lg">
              <q-btn no-caps label="Get Started" color="accent" @click="layoutStore.newUserWelcomeDialog = false; layoutStore.appTourOpened = true;" />
            </div>
          </div>

        </transition-group>
      </div>

    </div>
  </q-dialog>
</template>

<script setup>
import {useLayoutStore} from "stores/layout-store";
import {computed, ref, watch} from "vue";
import {applyCoupon} from "src/common/apiServices/userProjectService";
import {useCurrentUser} from "vuefire";
const layoutStore = useLayoutStore();

const step = computed({
  get: () => layoutStore.newUserWelcomeDialogStep,
  set: (value) => {layoutStore.newUserWelcomeDialogStep = value;}
})


const couponMessage = ref(null);

const animationInterval = 500;

const promoCode = ref('');

watch(step, (newStep) => {

  if(newStep === -1 || newStep === 0) {
    scheduleStep(1, 3000);
    scheduleStep(2, 3000 + animationInterval);
  }

  if(newStep === 2) {
    scheduleStep(3, 2500);
    scheduleStep(4, 2500 + animationInterval);
  }

});

/*setInterval(() => {
  step.value ++;

  if(step.value > 2){
    step.value = -1;
  }
}, 2000, 2000);*/

function scheduleStep(newStep, timeout = 750){
  setTimeout(() => {
    step.value = newStep;
  }, timeout);
}

async function confirmPromoCode() {

  couponMessage.value = null;

  if(promoCode.value) {
    try {
      const user = useCurrentUser();
      await applyCoupon(user, promoCode.value);
      couponMessage.value = 'Coupon applied!';

      scheduleStep(9, 2000);
      scheduleStep(10, 2000 + animationInterval);
    } catch (e) {
      couponMessage.value = 'Sorry, the coupon code is invalid or has already been used.';
    }

  }
}



</script>

<style scoped>

.transform-animation {
  transition: all 1s;

}

</style>
