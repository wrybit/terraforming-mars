<template>
  <!-- Sorting of a card list: the sortings in a drop-down menu, each ascending (↑) or descending (↓).
       "Manual" only where cards can be rearranged by drag & drop (hand tab); elsewhere choosing the active
       direction again returns to the original order.
       Narrow row (phone): one icon button showing the chosen sorting, "Manual" moves into the menu. -->
  <div ref="root" class="card-sort" :class="{'card-sort--compact': compact}">
    <button v-if="!compact && allowManual" type="button" class="card-bar-pill card-sort__manual" :class="{'card-bar-pill--on': modelValue === undefined}"
      @click="choose(undefined)" v-i18n>Manual</button>
    <button type="button" class="card-bar-pill card-sort__more"
      :class="{'card-bar-pill--on': modelValue !== undefined, 'card-bar-pill--open': open}"
      :aria-expanded="open" :title="buttonTitle" @click="open = !open">
      <CardSortIcon v-if="modelValue !== undefined || (compact && allowManual)" :sortKey="modelValue?.key ?? 'manual'"/>
      <svg v-else class="card-sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/></svg>
      <span v-if="!compact">{{ modelValue === undefined ? $t('Sort') : $t(labelOf(modelValue.key)) + ' ' + arrow(modelValue.reversed) }}</span>
      <span v-else-if="modelValue !== undefined">{{ arrow(modelValue.reversed) }}</span>
      <svg class="card-bar-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div v-if="open" class="card-bar-menu card-sort-menu">
      <button v-if="compact && allowManual" type="button" class="card-sort-menu__manual" :class="{'card-sort-menu__manual--on': modelValue === undefined}"
        @click="choose(undefined)">
        <CardSortIcon sortKey="manual"/><span v-i18n>Manual</span>
      </button>
      <div v-for="option in SORT_OPTIONS" :key="option.key" class="card-sort-menu__row"
        :class="{'card-sort-menu__row--on': modelValue?.key === option.key}">
        <span class="card-sort-menu__label"><CardSortIcon :sortKey="option.key"/><span v-i18n>{{ option.label }}</span></span>
        <button type="button" :class="{'card-sort-menu__direction--on': isChosen(option.key, false)}" :title="$t('ascending')"
          @click="chooseDirection(option.key, false)">↑</button>
        <button type="button" :class="{'card-sort-menu__direction--on': isChosen(option.key, true)}" :title="$t('descending')"
          @click="chooseDirection(option.key, true)">↓</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, ref, watch} from 'vue';
import {SORT_OPTIONS, SortKey, SortOrder} from '@/client/utils/SortOrder';
import {translateText} from '@/client/directives/i18n';
import CardSortIcon from '@/client/components/cardfilter/CardSortIcon.vue';

const props = defineProps<{
  // undefined = manual (hand) or original order
  modelValue: SortOrder | undefined;
  compact: boolean;
  // Offer "Manual" – only where cards can be rearranged by drag & drop
  allowManual?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: SortOrder | undefined];
}>();

const root = ref<HTMLElement>();
const open = ref(false);

function labelOf(key: SortKey): string {
  return SORT_OPTIONS.find((option) => option.key === key)?.label ?? key;
}

function arrow(reversed: boolean): string {
  return reversed ? '↓' : '↑';
}

const buttonTitle = computed(() => {
  if (props.modelValue === undefined) {
    return props.allowManual ? translateText('Sort by:') + ' ' + translateText('Manual') : translateText('Sort');
  }
  return translateText('Sort by:') + ' ' + translateText(labelOf(props.modelValue.key));
});

function isChosen(key: SortKey, reversed: boolean): boolean {
  return props.modelValue?.key === key && props.modelValue.reversed === reversed;
}

// Without "Manual": choosing the active direction again goes back to the original order
function chooseDirection(key: SortKey, reversed: boolean): void {
  choose(!props.allowManual && isChosen(key, reversed) ? undefined : {key, reversed});
}

function choose(value: SortOrder | undefined): void {
  open.value = false;
  emit('update:modelValue', value);
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
</script>
