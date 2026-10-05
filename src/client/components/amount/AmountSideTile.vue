<template>
  <!-- One side of an amount conversion (AmountConverter.vue): label, icon and value before → after, change below.
       Three rows, so label, values and change line up with the slider in the middle (subgrid, amount_slider.less) -->
  <div class="amount-side">
    <div class="amount-side__label">{{ $t(label) }}</div>
    <div class="amount-side__main">
      <span :class="['amount-side__icon', {'amount-side__icon--production': side.kind === 'production'}]"><i :class="iconClass"></i></span>
      <span class="amount-side__values">
        <span>{{ format(before) }}</span>
        <span class="amount-side__arrow">→</span>
        <span :class="'amount-side__after--' + direction">{{ format(after) }}</span>
      </span>
    </div>
    <span :class="['amount-side__change', 'amount-side__change--' + direction]">{{ (direction === 'loss' ? '−' : '+') + change }}</span>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {AmountSide} from '@/client/components/amount/amountConversion';
import {cardResourceCSS} from '@/client/components/common/cardResources';

const props = defineProps<{
  side: AmountSide;
  before: number;
  after: number;
  change: number;
  direction: 'loss' | 'gain';
}>();

const label = computed(() => {
  switch (props.side.kind) {
  case 'production': return 'Production';
  case 'card': return 'On card';
  default: return 'Stock';
  }
});

const iconClass = computed(() => props.side.kind === 'card' ?
  ['card-resource', cardResourceCSS[props.side.resource]] :
  ['resource_icon', 'resource_icon--' + props.side.resource]);

// Production with sign as in the players table (+2, 0, -1)
function format(value: number): string {
  return props.side.kind === 'production' && value > 0 ? '+' + value : String(value);
}
</script>
