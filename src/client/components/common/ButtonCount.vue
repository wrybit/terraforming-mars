<template>
  <!-- One counter inside a button (buttonCount.ts, button_count.less) -->
  <span v-if="part.word !== undefined" class="button-count__word">{{ $t(part.word) }}</span>
  <span v-if="part.gain === true" class="button-count__plus">+</span>
  <!-- Discount like on a project card (CardCost.vue, cards_v2.less): the printed price small and pale, the own price
       overlapping it on the right, the chevron over both edges (Jens 25 Oct 2026) -->
  <span v-if="showsDiscount" class="button-count-discount">
    <span class="button-count button-count--megacredits button-count-discount__printed">{{ part.printed }}</span>
    <span class="button-count button-count--megacredits button-count-discount__own">{{ part.value }}</span>
    <DiscountChevron class="button-count-discount__chevron"/>
  </span>
  <span v-else-if="part.kind === 'card' || part.kind === 'megacredits'" :class="['button-count', 'button-count--' + part.kind]">{{ part.value }}</span>
  <span v-else :class="['button-count', 'button-count--resource', 'button-count--' + part.kind]">
    <span class="button-count__value">{{ part.value }}</span><i class="button-count__icon"></i>
  </span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {ButtonCountPart} from '@/client/components/common/buttonCount';
import DiscountChevron from '@/client/components/common/DiscountChevron.vue';
import {getPreferences} from '@/client/utils/PreferencesManager';

const props = defineProps<{
  part: ButtonCountPart,
}>();

// Like the cards: only when there is a discount and the player did not hide discounts
const showsDiscount = computed(() => props.part.kind === 'megacredits' && props.part.printed !== undefined &&
  props.part.printed > props.part.value && !getPreferences().hide_discount_on_cards);
</script>
