<template>
  <!-- Sortierung der Handkarten: "Manuell" (Drag & Drop) oder eine der Upstream-Sortierungen.
       Nutzt dieselbe SegmentedControl wie Kartenliste und "Spiel erstellen". -->
  <div class="hand-sort-control" :class="{'hand-sort-control--reversed': sortOrder?.reversed === true}">
    <span class="hand-sort-control__label" v-i18n>Sort by:</span>
    <SegmentedControl :options="options" :modelValue="selectedValue" @update:modelValue="select"/>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import {SegmentOption} from '@/client/components/create/createGameChoices';
import {SortKey, SortOrder, SORT_OPTIONS, sortOrderClicked} from '@/client/utils/SortOrder';

// Eigener Wert für die Handsortierung; kollidiert nicht mit den SortKeys aus Upstream.
const MANUAL = 'manual';

const props = defineProps<{
  sortOrder?: SortOrder;
}>();

const emit = defineEmits<{
  (event: 'update:sortOrder', sortOrder: SortOrder | undefined): void;
}>();

const options: ReadonlyArray<SegmentOption> = [
  {value: MANUAL, label: 'Manual'},
  ...SORT_OPTIONS.map((option) => ({value: option.key, label: option.label})),
];

// Ohne gewählte Sortierung gilt die eigene Reihenfolge – also "Manuell".
const selectedValue = computed(() => props.sortOrder?.key ?? MANUAL);

function select(value: string | number): void {
  if (value === MANUAL) {
    // Erneutes Antippen von "Manuell" ändert nichts
    if (props.sortOrder !== undefined) {
      emit('update:sortOrder', undefined);
    }
    return;
  }
  // Erneutes Antippen derselben Sortierung dreht die Richtung (Upstream-Verhalten)
  emit('update:sortOrder', sortOrderClicked(props.sortOrder, value as SortKey));
}
</script>
