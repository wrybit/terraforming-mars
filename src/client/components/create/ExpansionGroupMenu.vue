<template>
  <!-- Grouping of the expansion tiles: the button names the current grouping, the menu lists all as one column -->
  <div ref="root" class="card-sort expansion-group-menu">
    <button type="button" class="card-bar-pill card-sort__more"
      :class="{'card-bar-pill--on': modelValue !== 'source', 'card-bar-pill--open': open}"
      :aria-expanded="open" :title="$t('Group by') + ': ' + $t(GROUPING_LABELS[modelValue])" @click="open = !open">
      <svg class="card-sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h10M4 12h7M4 18h4M17 4v16M14 17l3 3 3-3"/></svg>
      <span class="expansion-group-menu__label">{{ $t(GROUPING_LABELS[modelValue]) }}</span>
      <svg class="card-bar-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div v-if="open" class="card-bar-menu expansion-group-menu__list" role="listbox">
      <div class="expansion-group-menu__heading" v-i18n>Group by</div>
      <button v-for="grouping in EXPANSION_GROUPINGS" :key="grouping" type="button" role="option"
        class="card-sort-menu__manual" :class="{'card-sort-menu__manual--on': grouping === modelValue}"
        :aria-selected="grouping === modelValue" @click="choose(grouping)">{{ $t(GROUPING_LABELS[grouping]) }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, ref, watch} from 'vue';
import {EXPANSION_GROUPINGS, ExpansionGrouping, GROUPING_LABELS} from './expansionGrouping';

defineProps<{
  modelValue: ExpansionGrouping;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: ExpansionGrouping];
}>();

const root = ref<HTMLElement>();
const open = ref(false);

function choose(grouping: ExpansionGrouping): void {
  open.value = false;
  emit('update:modelValue', grouping);
}

// A click outside the control closes the menu
function closeOutside(event: PointerEvent): void {
  if (root.value !== undefined && !root.value.contains(event.target as Node)) {
    open.value = false;
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('pointerdown', closeOutside);
  } else {
    document.removeEventListener('pointerdown', closeOutside);
  }
});

onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside));

defineExpose({open});
</script>
