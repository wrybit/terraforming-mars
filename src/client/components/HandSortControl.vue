<template>
  <!-- Hand card sorting: one of the upstream sortings, ascending or descending; "Manual" (drag & drop) only in the hand tab.
       Hand tab and selection dialogs (play, sell) share the sorting (handSort.ts). -->
  <CardSortMenu :modelValue="sortOrder" :compact="compact" :allowManual="allowManual" @update:modelValue="select"/>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import CardSortMenu from '@/client/components/cardfilter/CardSortMenu.vue';
import {SortOrder} from '@/client/utils/SortOrder';
import {handSortOrder, sortHand} from '@/client/utils/handSort';
import {allCardsInHand} from '@/client/utils/handCards';
import {PlayerViewModel} from '@/common/models/PlayerModel';

const props = withDefaults(defineProps<{
  playerView: PlayerViewModel;
  // Narrow row (phone): icon button only
  compact?: boolean;
  // "Manual" only in the hand tab, where cards can be dragged; play/sell only show the hand order
  allowManual?: boolean;
}>(), {compact: false, allowManual: false});

const sortOrder = computed(() => handSortOrder());

function select(value: SortOrder | undefined): void {
  // Choosing "Manual" again changes nothing
  if (value === undefined && sortOrder.value === undefined) {
    return;
  }
  // Always sort the whole hand, even if a dialog shows only part of it – otherwise its order would be lost
  sortHand(props.playerView.id, allCardsInHand(props.playerView), value);
}
</script>
