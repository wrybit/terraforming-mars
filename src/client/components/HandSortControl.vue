<template>
  <!-- Sortierung der Handkarten: "Manuell" (Drag & Drop) oder eine der Upstream-Sortierungen.
       Nutzt dieselbe SegmentedControl wie Kartenliste und "Spiel erstellen". Hand-Tab und Auswahl-Dialoge
       (z. B. Verkaufen) teilen sich die Sortierung (handSort.ts). -->
  <div class="hand-sort-control" :class="{'hand-sort-control--reversed': sortOrder?.reversed === true}">
    <span class="hand-sort-control__label" v-i18n>Sort by:</span>
    <SegmentedControl :options="options" :modelValue="selectedValue" @update:modelValue="select"/>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import {SegmentOption} from '@/client/components/create/createGameChoices';
import {SortKey, SORT_OPTIONS, sortOrderClicked} from '@/client/utils/SortOrder';
import {handSortOrder, sortHand} from '@/client/utils/handSort';
import {allCardsInHand} from '@/client/utils/handCards';
import {PlayerViewModel} from '@/common/models/PlayerModel';

// Eigener Wert für die Handsortierung; kollidiert nicht mit den SortKeys aus Upstream.
const MANUAL = 'manual';

const props = defineProps<{
  playerView: PlayerViewModel;
}>();

const options: ReadonlyArray<SegmentOption> = [
  {value: MANUAL, label: 'Manual'},
  ...SORT_OPTIONS.map((option) => ({value: option.key, label: option.label})),
];

const sortOrder = computed(() => handSortOrder());
// Ohne gewählte Sortierung gilt die eigene Reihenfolge – also "Manuell".
const selectedValue = computed(() => sortOrder.value?.key ?? MANUAL);

function select(value: string | number): void {
  // Immer die ganze Hand sortieren, auch wenn ein Dialog nur einen Teil zeigt – sonst ginge deren Reihenfolge verloren
  const cards = allCardsInHand(props.playerView);
  if (value === MANUAL) {
    // Erneutes Antippen von "Manuell" ändert nichts
    if (sortOrder.value !== undefined) {
      sortHand(props.playerView.id, cards, undefined);
    }
    return;
  }
  // Erneutes Antippen derselben Sortierung dreht die Richtung (Upstream-Verhalten)
  sortHand(props.playerView.id, cards, sortOrderClicked(sortOrder.value, value as SortKey));
}
</script>
