<template>
  <!-- One side of an amount conversion (AmountConverter.vue): label, icon with the change large (−4 / +2), the stock
       before → after small below – the change is what the slider moves (Jens, 19 Oct 2026).
       Three rows, so label, change and stock line up with the slider in the middle (subgrid, amount_slider.less) -->
  <div class="amount-side">
    <div class="amount-side__label">{{ $t(label) }}</div>
    <div class="amount-side__main">
      <span :class="['amount-side__icon', {'amount-side__icon--production': side.kind === 'production'}]">
        <img v-if="side.kind === 'figure'" class="amount-side__figure" :src="side.icon" alt="">
        <i v-else :class="iconClass"></i>
      </span>
      <span :class="['amount-side__values', 'amount-side__after--' + direction]">{{ (direction === 'loss' ? '−' : '+') + change }}</span>
    </div>
    <span class="amount-side__change">
      {{ format(before) }}<span class="amount-side__arrow">→</span><span :class="'amount-side__change--' + direction">{{ format(after) }}</span>
    </span>
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
  case 'figure': return props.side.label;
  case 'production': return 'Production';
  case 'card': return 'On card';
  default: return 'Stock';
  }
});

const iconClass = computed(() => {
  const side = props.side;
  if (side.kind === 'figure') {
    return [];
  }
  return side.kind === 'card' ? ['card-resource', cardResourceCSS[side.resource]] : ['resource_icon', 'resource_icon--' + side.resource];
});

// Production with sign as in the players table (+2, 0, -1)
function format(value: number): string {
  return props.side.kind === 'production' && value > 0 ? '+' + value : String(value);
}
</script>
