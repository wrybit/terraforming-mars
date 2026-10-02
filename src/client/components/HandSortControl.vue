<template>
  <!-- Sortierung der Handkarten: "Manuell" (Drag & Drop) oder eine der Upstream-Sortierungen.
       Nutzt dieselbe SegmentedControl wie Kartenliste und "Spiel erstellen". Hand-Tab und Auswahl-Dialoge
       (z. B. Verkaufen) teilen sich die Sortierung (handSort.ts). -->
  <div class="hand-sort-control" :class="{'hand-sort-control--reversed': sortOrder?.reversed === true}">
    <span class="hand-sort-control__label" v-i18n>Sort by:</span>
    <SegmentedControl :options="options" :modelValue="selectedValue" @update:modelValue="select"/>
    <!-- Mobil: Auswahlliste statt Segment-Leiste (zu breit fürs Handy); Richtung als eigener Eintrag -->
    <select class="hand-sort-control__select" :value="listValue" @change="selectFromList">
      <option v-for="option in listOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
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
import {translateText} from '@/client/directives/i18n';

// Eigener Wert für die Handsortierung; kollidiert nicht mit den SortKeys aus Upstream.
const MANUAL = 'manual';

const props = defineProps<{
  playerView: PlayerViewModel;
}>();

const options: ReadonlyArray<SegmentOption> = [
  {value: MANUAL, label: 'Manual'},
  ...SORT_OPTIONS.map((option) => ({value: option.key, label: option.label})),
];

// Auswahlliste: jede Sortierung aufsteigend (▼, wie die Segment-Leiste) und umgekehrt (▲)
const REVERSED_SUFFIX = ':reversed';
const listOptions = computed(() => [
  {value: MANUAL, label: translateText('Manual')},
  ...SORT_OPTIONS.flatMap((option) => [
    {value: option.key, label: translateText(option.label) + ' ▼'},
    {value: option.key + REVERSED_SUFFIX, label: translateText(option.label) + ' ▲'},
  ]),
]);

const sortOrder = computed(() => handSortOrder());
// Ohne gewählte Sortierung gilt die eigene Reihenfolge – also "Manuell".
const selectedValue = computed(() => sortOrder.value?.key ?? MANUAL);
const listValue = computed(() => sortOrder.value === undefined ? MANUAL : sortOrder.value.key + (sortOrder.value.reversed ? REVERSED_SUFFIX : ''));

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

function selectFromList(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  const cards = allCardsInHand(props.playerView);
  if (value === MANUAL) {
    sortHand(props.playerView.id, cards, undefined);
    return;
  }
  const reversed = value.endsWith(REVERSED_SUFFIX);
  const key = (reversed ? value.slice(0, -REVERSED_SUFFIX.length) : value) as SortKey;
  sortHand(props.playerView.id, cards, {key, reversed});
}
</script>
