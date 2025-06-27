<template>
  <q-dialog v-model="layoutStore.userInfoDialogOpen" @beforeShow="showBuyCredits = false;">
    <q-card style="width: 1350px; max-width: 95vw;">
      <q-card-section>
        <div class="row">
          <div class="col text-h6">
            User Plan
          </div>
          <div class="col-auto">
            <q-btn flat dense icon="mdi-close" @click="layoutStore.userInfoDialogOpen = false" />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-x-md no-padding" v-if="userData">
        <div class="row">
          <div class="col-4 q-pa-md column bg-grey-1" v-if="!showBuyCredits">
            <div class="row q-mb-md">
              <span class="text-subtitle2 q-mr-sm">Email:</span>
              <span class="">{{ user.email }}</span>
            </div>

            <div class="row">
              <span class="text-subtitle2 q-mr-sm">Subscription:</span>

              <q-icon name="mdi-crown-outline" class="q-mr-xs q-pt-xs" color="amber" v-if="userData.subscriptionLevel > 0" />
              <span class="text-subtitle2">{{ getLevelName(userData.subscriptionLevel) }}</span>

              <span class="text-subtitle2 q-ml-xs" v-if="hasFreePremium">(Early Adopter)</span>

              <a href="#" @click="cancelSubscription" class="q-ml-md" v-if="userData.subscriptionLevel > 0 && !userData.subscriptionCancelledAt && !hasFreePremium">Cancel</a>
            </div>

            <div class="q-my-md" v-if="userData.subscriptionCancelledAt">
              <div><span class="">You cancelled your subscription on <span class="">{{ new Date(userData.subscriptionCancelledAt).toDateString() }}</span></span></div>
              <div><span class="">You subscription remains active until <span class="">{{ new Date(userData.subscriptionCancelAt).toDateString() }}</span></span></div>
              <div class="q-mt-sm q-mb-lg"><q-btn label="Resume Subscription" color="positive" class="full-width" @click="renewSubscription" /></div>
            </div>

            <div class="row">
              <span class="text-subtitle2 q-mr-sm">Remaining Monthly Credits:</span>
              <span class="q-mr-md">{{ formatNumber(userData.monthlyRemainingCredits ?? 0) }}</span>
            </div>

            <div class="row" v-if="!userData.subscriptionCancelledAt && userData.subscriptionLevel > 0">
              <span class="text-subtitle2 q-mr-sm">Monthly Credits Reset:</span>
              <span class="q-mr-md">{{ new Date(userData.nextMonthlyReward).toDateString() }}</span>
            </div>

            <div class="row q-mt-md">
              <span class="text-subtitle2 q-mr-sm">Additional AI Credits:</span>
              <span class="q-mr-md">{{ formatNumber(userData.maxUsage - userData.usage) }}</span>
            </div>

            <div class="row q-mt-sm">
              <q-btn label="Buy more credits" @click="showBuyCredits = !showBuyCredits" color="accent" class="full-width" />
              <q-btn flat label="Apply Coupon" @click="openCouponDialog" color="primary" class="full-width q-mt-sm" />
            </div>

            <q-space />

            <div class="row q-mt-xl">
              <q-btn flat label="Delete your account" color="negative" class="full-width" @click="deleteAccount" />
            </div>
          </div>

          <q-separator vertical />

          <div class="col q-pa-md" style="min-height: 590px;">

            <div class="row q-px-md q-pb-lg q-pt-lg q-gutter-x-sm" v-if="showBuyCredits">

              <div class="col-12 text-h6 q-mb-lg text-weight-bold row text-center">
                <div class="col-auto" style="width: 0px">
                  <q-btn flat color="primary" icon="mdi-arrow-left-thin" style="width: 120px" label="back" @click="showBuyCredits = false"></q-btn>
                </div>
                <div class="col">
                  Get more AI credits
                </div>

              </div>

              <div class="col q-mr-sm">

                <q-card class="text-center">
                  <q-card-section>
                    <q-chip>Get started</q-chip>
                  </q-card-section>

                  <q-card-section class="q-pt-none">
                    <div class="text-subtitle2">1000 Credits</div>
                    <div class="text-h5">$4.90</div>
                  </q-card-section>

                  <q-card-section class="q-pt-none" style="height: 58px">
                    Enough to get you started using cloud AI.
                  </q-card-section>

                  <q-separator />
                  <q-card-section>
                    <q-btn color="accent" class="full-width" @click="buyCredits('Credits1000')">Buy now</q-btn>
                  </q-card-section>

                </q-card>
              </div>
              <div class="col q-mr-sm">
                <q-card class="text-center">
                  <q-card-section>
                    <q-chip color="accent" class="text-white text-weight-bold">Save 11%</q-chip>
                  </q-card-section>
                  <q-card-section class="q-pt-none">
                    <div class="text-subtitle2">2250 Credits</div>
                    <div class="text-h5">$9.90</div>
                  </q-card-section>

                  <q-card-section class="q-pt-none" style="height: 58px">
                    Our most popular choice.
                  </q-card-section>

                  <q-separator />
                  <q-card-section>
                    <q-btn color="accent" class="full-width" @click="buyCredits('Credits2250')">Buy now</q-btn>
                  </q-card-section>

                </q-card>
              </div>
              <div class="col q-mr-sm">
                <q-card class="text-center">
                  <q-card-section>
                    <q-chip color="accent" class="text-white text-weight-bold">Save 25%</q-chip>
                  </q-card-section>
                  <q-card-section class="q-pt-none">
                    <div class="text-subtitle2">5000 Credits</div>
                    <div class="text-h5">$19.50</div>
                  </q-card-section>

                  <q-card-section class="q-pt-none" style="height: 58px">
                    Large lump of AI credits to use on cloud AI.
                  </q-card-section>

                  <q-separator />
                  <q-card-section>
                    <q-btn color="accent" class="full-width" @click="buyCredits('Credits5000')">Buy now</q-btn>
                  </q-card-section>

                </q-card>
              </div>
              <div class="col q-mr-sm">
                <q-card class="text-center">
                  <q-card-section>
                    <q-chip color="accent" class="text-white text-weight-bold">Save 42%</q-chip>
                  </q-card-section>
                  <q-card-section class="q-pt-none">
                    <div class="text-subtitle2">10000 Credits</div>
                    <div class="text-h5">$34.50</div>
                  </q-card-section>

                  <q-card-section class="q-pt-none" style="height: 58px">
                    Go big and stop thinking about credits.
                  </q-card-section>

                  <q-separator />
                  <q-card-section>
                    <q-btn color="accent" class="full-width" @click="buyCredits('Credits10000')">Buy now</q-btn>
                  </q-card-section>

                </q-card>
              </div>

            </div>

            <div class="row q-mt-md q-mb-md q-gutter-x-lg justify-center" v-else>

              <div class="col flex justify-end">
                <q-card style="max-width: 330px; min-height: 510px;" class="bg-blue-grey-1">
                  <q-card-section class="bg-blue-grey-2">
                    <div class="flex items-center">
                      <span class="text-h6">Free plan</span>
                      <q-badge color="primary" class="q-ml-md" v-if="userData.subscriptionLevel === 0">Current</q-badge>
                    </div>
                    Free & Open Source. Consider Premium plan to support the project!
                  </q-card-section>
                  <q-card-section class="bg-blue-grey-2 shadow-1">
                    <div class="text-h6">Free</div>
                  </q-card-section>
                  <q-list class="q-py-sm bg-blue-grey-1">
                    <q-item clickable>
                      <q-item-section avatar>
                        <q-icon color="black" name="mdi-folder-outline" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>All Inscriptor functions</q-item-label>
                        <q-item-label caption>All writing and planning tools included </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item clickable>
                      <q-item-section avatar>
                        <q-icon color="black" name="mdi-folder-outline" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>Unlimited local projects</q-item-label>
                        <q-item-label caption>Store your project on your disk</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable>
                      <q-item-section avatar>
                        <q-icon color="black" name="mdi-chip" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>AI API Key & Local AI models</q-item-label>
                        <q-item-label caption>Use any AI model you want</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable>
                      <q-item-section avatar>
                        <q-icon color="black" name="mdi-cloud-outline" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>Run cloud AI models</q-item-label>
                        <q-item-label caption>Buy credits to run AI on Inscriptor cloud easily</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable>
                      <q-item-section avatar>
                        <q-icon color="black" name="mdi-folder-outline" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>1 project on cloud</q-item-label>
                        <q-item-label caption>max 30 files per project</q-item-label>
                      </q-item-section>
                    </q-item>

                  </q-list>
                  <q-card-actions v-if="userData.subscriptionLevel === 0" class="bg-blue-grey-1">

                  </q-card-actions>
                </q-card>
              </div>

              <div class="col">
                <q-card class="shadow-16 bg-inscriptorblue" :class="{'primary-highlight': userData.subscriptionLevel === 1}" style="max-width: 330px;  min-height: 510px;">
                  <q-card-section class="bg-inscriptorblue text-white">
                    <div class="flex items-center">
                      <q-icon name="mdi-crown-outline" class="q-mr-xs q-pt-xs" color="amber" size="sm" />
                      <span class="text-h6 q-ml-xs text-aleo">Inscriptor Premium</span>
                      <q-badge color="amber" text-color="accent" class="q-ml-md" v-if="userData.subscriptionLevel === 1">Current</q-badge>
                    </div>
                    Get the most from Inscriptor with cloud and monthly AI credits.
                  </q-card-section>
                  <q-card-section class="bg-inscriptorblue text-white shadow-2">
                    <div class="row">
                      <div class="col">
                        <div class="text-h6">
                          <span class="text-weight-bold">{{ yearly ? '7.90$' : '9,90$'}}</span> / month
                        </div>
                      </div>
                      <div class="col-auto flex items-center">
                        <q-toggle
                          dense
                          color="amber"
                          :label="`Anually`"
                          v-model="yearly"
                        />
                        <q-badge v-if="yearly" color="amber" class="q-mr-sm q-mt-xs text-accent" floating>Save 21%</q-badge>
                      </div>
                    </div>

                  </q-card-section>
                  <q-list class="q-py-sm bg-inscriptorblue-dark text-inscriptorblue-light">
                    <q-item clickable>
                      <q-item-section avatar>
                        <q-icon name="mdi-check" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>Everything from Free plan</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable>
                      <q-item-section avatar>
                        <q-icon name="mdi-cloud-outline" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>Run cloud AI models</q-item-label>
                        <q-item-label caption class="text-inscriptorblue-light">Enjoy your 2250 AI monthly credits that are included via Inscriptor AI Cloud</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable>
                      <q-item-section avatar>
                        <q-icon name="mdi-chip" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>Access to advanced AI tools</q-item-label>
                        <q-item-label caption class="text-inscriptorblue-light">Gain early access to all planned AI tools</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable>
                      <q-item-section avatar>
                        <q-icon name="mdi-folder-outline" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>Up to 20 projects on cloud</q-item-label>
                        <q-item-label caption class="text-inscriptorblue-light">Synchronized across all devices</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable>
                      <q-item-section avatar>
                        <q-icon name="mdi-creation-outline" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="text-bold">2250 AI Credits / Month</q-item-label>
                        <q-item-label caption class="text-inscriptorblue-light">Each month, consume 2250 AI credits for free</q-item-label>
                      </q-item-section>
                    </q-item>

                  </q-list>
                  <q-card-actions v-if="userData.subscriptionLevel === 0" class="bg-inscriptorblue">
                    <q-btn color="accent" class="full-width" @click="buyPremium(yearly ? 'SubscriptionPremiumYearly' : 'SubscriptionPremium')">Subscribe</q-btn>
                  </q-card-actions>
                  <q-card-actions v-else-if="!hasFreePremium"  class="bg-inscriptorblue text-white">
                    <q-btn flat unelevated class="full-width" icon="mdi-check" label="Subscribed"></q-btn>
                  </q-card-actions>
                  <q-card-actions v-else  class="bg-inscriptorblue text-white">
                    <q-btn flat no-caps unelevated class="full-width" icon="mdi-check" label="Free for Early Adopters"></q-btn>
                  </q-card-actions>
                </q-card>
              </div>

            </div>
          </div>

        </div>

      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {usePromptStore} from "stores/prompt-store";
  import {computed, ref} from "vue";
  import {applyCoupon, deleteCurrentUser} from "src/common/apiServices/userProjectService";
  import {useCurrentUser} from "vuefire";
  import {open} from "@tauri-apps/plugin-shell";
  import {getLevelName} from "src/common/resources/subscriptionLevels";
  import {formatNumber} from "src/common/utils/textUtils";
  import {Dialog, Notify} from "quasar";
  import {cancel, checkout, renew} from "src/common/apiServices/checkoutService";

  const layoutStore = useLayoutStore();
  const promptStore = usePromptStore();

  const data = ref(null);
  const user = useCurrentUser();

  const showBuyCredits = ref(false);
  const yearly = ref(true);

  const userData = computed(() => layoutStore.userData);

  function openBrowserPage(link) {
    if(layoutStore.runsInDesktopApp()) {
      open(link);
    } else {
      window.open(link, '_blank');
    }
  }

  const hasFreePremium = computed(() => userData.value.subscriptionLevel === 1 && !userData.value.subscriptionId);

  async function deleteAccount() {
    if(userData.value.subscriptionLevel > 0) {
      Notify.create({
        message: 'You need to cancel your subscription before deleting your account.',
        color: 'negative',
        position: 'top'
      });
      return;
    }

    Dialog.create({
      title: 'Confirm account deletion',
      message: 'All your projects and settings will be lost. Are you sure you want to proceed?',
      cancel: true,
      persistent: false
    }).onOk(() => {
      Dialog.create({
        title: 'Confirm account deletion',
        message: 'Deleting your account is irreversible. Confirm your decision by typing DELETE in the input field below.',
        prompt: {
          model: '',
          type: 'text' // optional
        },
        cancel: true,
        persistent: false
      }).onOk(async data => {
        if(data === 'DELETE') {
          const user = useCurrentUser();

          try {
            await deleteCurrentUser(await user.value.getIdToken());
          } catch(error) {
            // unhandled
          }

          window.location.reload();
        }
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }).onCancel(() => {
      // console.log('>>>> Cancel')
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    })
  }

  async function buyCredits(variant) {
    layoutStore.loadingDialogOpen = true;

    try {
      const user = useCurrentUser();
      const response = await checkout(user, variant, null, null);

      // open checkout page
      openBrowserPage(response.url);

    } catch (e) {
      Notify.create({
        message: 'An error occured. Please try again later.',
        color: 'negative',
        position: 'top-right'
      });
    } finally {
      layoutStore.loadingDialogOpen = false;
    }
  }

  async function buyPremium(variant) {
    layoutStore.loadingDialogOpen = true;

    try {
      const user = useCurrentUser();
      const response = await checkout(user, null, variant, null);

      // open checkout page
      openBrowserPage(response.url);

    } catch (e) {
      Notify.create({
        message: 'An error occured. Please try again later.',
        color: 'negative',
        position: 'top-right'
      });
    } finally {
      layoutStore.loadingDialogOpen = false;
    }
  }

  async function cancelSubscription() {
    Dialog.create({
      title: 'Confirm Subscription Cancellation',
      message: 'Are you sure you want to cancel your subscription?',
      cancel: true,
      persistent: false
    }).onOk(async () => {
      layoutStore.loadingDialogOpen = true;

      try {
        const user = useCurrentUser();
        await cancel(user);

        await layoutStore.loadUserData();

        Notify.create({
          message: 'Your subscription has been cancelled.',
          color: 'positive',
          position: 'top-right'
        });

        layoutStore.loadingDialogOpen = false;
      } catch (e) {
        Notify.create({
          message: 'An error occured. Please try again later.',
          color: 'negative',
          position: 'top-right'
        });
        layoutStore.loadingDialogOpen = false;
      }
    });
  }

  async function renewSubscription() {
    layoutStore.loadingDialogOpen = true;

    try {
      const user = useCurrentUser();
      await renew(user);

      await layoutStore.loadUserData();

      Notify.create({
        message: 'Your subscription has been renewed. Thank you!',
        color: 'positive',
        position: 'top-right'
      });

    } catch (e) {
      Notify.create({
        message: 'An error occured. Please try again later.',
        color: 'negative',
        position: 'top-right'
      });
    } finally {
      layoutStore.loadingDialogOpen = false;
    }
  }

  function openCouponDialog() {

    const user = useCurrentUser();
    if(!user) return;

    Dialog.create({
      title: 'Apply Your Coupon',
      message: 'Enter Coupon:',
      prompt: {
        model: '',
        type: 'text' // optional
      },
      cancel: true,
      persistent: true
    }).onOk(async data => {

      await applyCoupon(user, data);

      Notify.create({
        message: 'Coupon applied successfully!',
        color: 'positive',
        position: 'top'
      });
    }).onCancel(() => {
      // console.log('>>>> Cancel')
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    })
  }

</script>

<style scoped>

</style>
