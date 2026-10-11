<template>
  <DialogFrame :title="$t('Pay too much?')" :width="460" class="overpayment-dialog" @close="emit('dismiss')">
    <template #icon>
      <i class="resource_icon resource_icon--megacredits overpayment-dialog__title-icon"></i>
    </template>

    <!-- Key figure first: how much is lost and for what -->
    <div class="overpayment-dialog__hero">
      <span class="overpayment-dialog__excess" data-test="excess">
        +{{ excess }}<i class="resource_icon resource_icon--megacredits"></i>
      </span>
      <span class="overpayment-dialog__hero-text">
        <span class="overpayment-dialog__hero-label" v-i18n>too much</span>
        <span v-if="itemName !== undefined" class="overpayment-dialog__item" data-test="item">{{ $t(itemName) }}</span>
      </span>
    </div>

    <!-- Bar: every currency as a segment in M€, the cost as a marker with label above, the excess hatched beyond it -->
    <div class="overpayment-dialog__chart">
      <div class="overpayment-dialog__scale">
        <span class="overpayment-dialog__mark" :style="{left: costPercent + '%'}">
          <span v-i18n>Costs</span> {{ cost }}
        </span>
      </div>
      <div class="overpayment-dialog__bar">
        <span v-for="part of parts" :key="part.unit" class="overpayment-dialog__segment"
          :class="'overpayment-dialog__segment--' + part.unit" :style="{flexGrow: part.value}" :data-test="'segment-' + part.unit">
          <i class="resource_icon" :class="iconClass(part.unit)"></i>
        </span>
        <span class="overpayment-dialog__lost" :style="{left: costPercent + '%'}"></span>
        <span class="overpayment-dialog__cost-line" :style="{left: costPercent + '%'}"></span>
      </div>
      <!-- Sum below the bar: above it would collide with the cost label, which sits close to the end -->
      <div class="overpayment-dialog__scale overpayment-dialog__scale--below">
        <span class="overpayment-dialog__mark overpayment-dialog__mark--end">
          <span v-i18n>Sum</span> {{ total }}
        </span>
      </div>

      <!-- Legend under the bar: count × rate = value, in the order of the segments -->
      <ul class="overpayment-dialog__legend">
        <li v-for="part of parts" :key="part.unit" class="overpayment-dialog__legend-row">
          <i class="resource_icon overpayment-dialog__legend-icon" :class="iconClass(part.unit)"></i>
          <span class="overpayment-dialog__legend-calc">{{ part.count }} × {{ part.rate }}</span>
          <span class="overpayment-dialog__legend-value">= {{ part.value }}</span>
          <i class="resource_icon overpayment-dialog__legend-icon resource_icon--megacredits"></i>
        </li>
      </ul>
    </div>

    <!-- Why it happens: a resource worth several M€ cannot hit the cost exactly; there is no change -->
    <p class="overpayment-dialog__reason" data-test="reason">{{ reason }}</p>

    <template #footer>
      <!-- Red = back out, green = go ahead (button_tones.less); the accept button repeats the excess, so the click says what it costs -->
      <button type="button" class="btn btn-tone-danger" data-test="dismiss" @click="emit('dismiss')" v-i18n>No, adjust</button>
      <button type="button" class="btn btn-tone-success overpayment-dialog__accept" data-test="accept" @click="emit('accept')">
        <span v-i18n>Yes, pay anyway</span>
        <span class="overpayment-dialog__accept-excess" data-test="accept-excess">+{{ excess }}<i class="resource_icon resource_icon--megacredits"></i></span>
      </button>
    </template>
  </DialogFrame>
</template>

<script setup lang="ts">
// Confirmation before overpaying (PaymentForm.vue): replaces the browser confirm() and shows
// which resources make up the payment, where the cost ends and how much of it is lost.
import {computed} from 'vue';
import DialogFrame from '@/client/components/DialogFrame.vue';
import {Payment} from '@/common/inputs/Payment';
import {SpendableResource} from '@/common/inputs/Spendable';
import {Ledger} from '@/client/components/PaymentLedger';
import {paymentIconClass} from '@/client/components/paymentIcon';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

const props = defineProps<{
  cost: number;
  payment: Payment;
  // Display order of the currencies, same as in the payment form
  order: ReadonlyArray<SpendableResource>;
  ledger: Ledger;
  // Names of the resources for the reason sentence (PaymentForm.vue DESCRIPTIONS)
  descriptions: Record<SpendableResource, string>;
  // What is being paid for (card name); without it only the amount is shown
  itemName?: string;
}>();

const emit = defineEmits<{
  (event: 'accept'): void;
  (event: 'dismiss'): void;
}>();

type Part = {unit: SpendableResource, count: number, rate: number, value: number};

const parts = computed<Array<Part>>(() => props.order
  .filter((unit) => props.payment[unit] > 0)
  .map((unit) => {
    const rate = props.ledger[unit].rate;
    return {unit, count: props.payment[unit], rate, value: props.payment[unit] * rate};
  }));

const total = computed(() => parts.value.reduce((sum, part) => sum + part.value, 0));
const excess = computed(() => total.value - props.cost);
const costPercent = computed(() => total.value === 0 ? 100 : props.cost / total.value * 100);

// The most valuable resource used is the one that overshoots (PaymentForm only asks when no
// currency could be reduced by one unit without falling short)
const reason = computed(() => {
  const coarsest = parts.value.filter((part) => part.rate > 1).sort((a, b) => b.rate - a.rate)[0];
  if (coarsest === undefined) {
    return translateText('The excess is not refunded.');
  }
  return translateTextWithParams('${0} is worth ${1} M€ each, so the cost cannot be met exactly. The excess is not refunded.',
    [translateText(props.descriptions[coarsest.unit]), String(coarsest.rate)]);
});

function iconClass(unit: SpendableResource): string {
  return paymentIconClass(unit);
}
</script>
