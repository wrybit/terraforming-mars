<template>
  <!-- Hand card sorting: "Manual" (drag & drop) or one of the upstream sortings.
       Uses the same SegmentedControl as the card list and "Spiel erstellen". Hand tab and selection dialogs
       (e.g. selling) share the sorting (handSort.ts). -->
  <div class="hand-sort-control" :class="{'hand-sort-control--reversed': sortOrder?.reversed === true}">
    <span class="hand-sort-control__label" v-i18n>Sort by:</span>
    <SegmentedControl :options="options" :modelValue="selectedValue" @update:modelValue="select"/>
    <!-- Mobile: select list instead of segment bar (too wide for phones); direction as a separate entry -->
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

// Own value for hand sorting; doesn't collide with the upstream SortKeys.
const MANUAL = 'manual';

const props = defineProps<{
  playerView: PlayerViewModel;
}>();

const options: ReadonlyArray<SegmentOption> = [
  {value: MANUAL, label: 'Manual'},
  ...SORT_OPTIONS.map((option) => ({value: option.key, label: option.label})),
];

// Select list: each sorting ascending (▼, like the segment bar) and reversed (▲)
const REVERSED_SUFFIX = ':reversed';
const listOptions = computed(() => [
  {value: MANUAL, label: translateText('Manual')},
  ...SORT_OPTIONS.flatMap((option) => [
    {value: option.key, label: translateText(option.label) + ' ▼'},
    {value: option.key + REVERSED_SUFFIX, label: translateText(option.label) + ' ▲'},
  ]),
]);

const sortOrder = computed(() => handSortOrder());
// Without a chosen sorting the own order applies – i.e. "Manual".
const selectedValue = computed(() => sortOrder.value?.key ?? MANUAL);
const listValue = computed(() => sortOrder.value === undefined ? MANUAL : sortOrder.value.key + (sortOrder.value.reversed ? REVERSED_SUFFIX : ''));

function select(value: string | number): void {
  // Always sort the whole hand, even if a dialog shows only part of it – otherwise its order would be lost
  const cards = allCardsInHand(props.playerView);
  if (value === MANUAL) {
    // Tapping "Manual" again changes nothing
    if (sortOrder.value !== undefined) {
      sortHand(props.playerView.id, cards, undefined);
    }
    return;
  }
  // Tapping the same sorting again flips the direction (upstream behavior)
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
