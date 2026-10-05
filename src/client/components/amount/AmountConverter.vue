<template>
  <!-- Amount as a conversion: source on the left, target on the right (before → after), slider in between.
       Desktop/tablet one horizontal axis, narrow boxes stacked (container query, amount_slider.less) -->
  <div class="amount-converter">
    <AmountSideTile class="amount-converter__from" :side="conversion.from"
      :before="fromBefore" :after="fromBefore - modelValue * conversion.from.perStep"
      :change="modelValue * conversion.from.perStep" direction="loss"/>
    <div class="amount-converter__middle">
      <div class="amount-rate">
        {{ conversion.from.perStep }} <i :class="iconClass(conversion.from)"></i>
        <span class="amount-rate__arrow">→</span>
        {{ conversion.to.perStep }} <i :class="iconClass(conversion.to)"></i>
      </div>
      <AmountSlider :modelValue="modelValue" :min="min" :max="max" @update:modelValue="$emit('update:modelValue', $event)"/>
    </div>
    <AmountSideTile class="amount-converter__to" :side="conversion.to"
      :before="toBefore" :after="toBefore + modelValue * conversion.to.perStep"
      :change="modelValue * conversion.to.perStep" direction="gain"/>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {CardName} from '@/common/cards/CardName';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {AmountConversion, AmountSide, amountSideValue} from '@/client/components/amount/amountConversion';
import {cardResourceCSS} from '@/client/components/common/cardResources';
import AmountSideTile from '@/client/components/amount/AmountSideTile.vue';
import AmountSlider from '@/client/components/amount/AmountSlider.vue';

const props = defineProps<{
  conversion: AmountConversion;
  modelValue: number;
  min: number;
  max: number;
  player: PublicPlayerModel;
  sourceCard?: CardName;
}>();

defineEmits<{
  (event: 'update:modelValue', value: number): void;
}>();

const fromBefore = computed(() => amountSideValue(props.conversion.from, props.player, props.sourceCard));
const toBefore = computed(() => amountSideValue(props.conversion.to, props.player, props.sourceCard));

function iconClass(side: AmountSide): Array<string> {
  return side.kind === 'card' ?
    ['amount-rate__icon', 'card-resource', cardResourceCSS[side.resource]] :
    ['amount-rate__icon', 'resource_icon', 'resource_icon--' + side.resource];
}
</script>
