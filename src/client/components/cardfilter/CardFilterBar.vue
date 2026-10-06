<template>
  <!-- The one row above a card list: on the left the lead (heading or "Select all"), the filter button and the
       active filters as removable chips; on the right the match count and the sorting (slot).
       Narrow row (phone): icon buttons only, the active filters stay in the filter sheet, × next to the button clears them.
       The row sits at the top of its box with a separator line (card_filter_bar.less). -->
  <div ref="root" class="card-filter-bar" :class="{'card-filter-bar--compact': compact, 'card-filter-bar--open': menuOpen && !useSheet}">
    <slot name="lead"></slot>
    <!-- Section labels as in the mockup: Filter · Zoom · Sort (not in the narrow row) -->
    <span v-if="!compact" class="card-filter-bar__label">{{ $t('Filtering') }}</span>
    <div class="card-filter-bar__filter">
      <button type="button" class="card-bar-pill" :class="{'card-bar-pill--on': activeCount > 0, 'card-bar-pill--open': menuOpen}"
        :aria-expanded="menuOpen" :title="compact ? $t('Filter') : undefined" @click="menuOpen = !menuOpen">
        <svg class="card-sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
          stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/></svg>
        <span v-if="!compact" v-i18n>Filter</span>
        <b v-if="activeCount > 0" class="card-bar-pill__badge">{{ activeCount }}</b>
        <svg v-else class="card-bar-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <button v-if="compact && activeCount > 0" type="button" class="card-bar-pill card-bar-pill--clear"
        :title="$t('Reset filters')" :aria-label="$t('Reset filters')" @click="reset">×</button>
      <div v-if="menuOpen && !useSheet" class="card-bar-menu card-filter-menu">
        <CardFilterOptions :cards="cards" :filter="filter" :context="context"/>
        <div class="card-filter-menu__foot">
          <span>{{ shownText }}</span>
          <button v-if="activeCount > 0" type="button" class="card-filter-link" @click="reset" v-i18n>Reset filters</button>
        </div>
      </div>
    </div>
    <div class="card-filter-bar__chips">
      <template v-if="!compact">
        <button v-for="chip in activeChips" :key="chip.key" type="button" class="card-filter-chip card-filter-chip--on card-filter-chip--active"
          :class="{'card-filter-chip--icon': chip.iconClass !== undefined}" :title="chip.title" @click="chip.remove()">
          <span v-if="chip.dotClass !== undefined" class="card-filter-chip__dot" :class="chip.dotClass"></span>
          <span v-if="chip.iconClass !== undefined" class="card-filter-icon" :class="chip.iconClass"></span>
          <span v-if="chip.text !== undefined">{{ chip.text }}</span>
          <i v-if="chip.megacredits" class="resource_icon resource_icon--megacredits"></i>
          <span class="card-filter-chip__remove" aria-hidden="true">×</span>
        </button>
      </template>
    </div>
    <span class="card-filter-bar__count" :class="{'card-filter-bar__count--idle': activeCount === 0}"><b>{{ shownCount }}</b>/{{ cards.length }}</span>
    <!-- Card size left of the sorting: not on the phone (cards are fitted there) -->
    <CardZoomSlider v-if="!compact && !isMobile"/>
    <span v-if="!compact && $slots.sort !== undefined" class="card-filter-bar__label card-filter-bar__label--sort">{{ $t('Sort') }}</span>
    <slot name="sort" :compact="compact"></slot>
    <!-- Phone: the filters as a bottom sheet over the screen; background only darkened, not blurred -->
    <Teleport v-if="menuOpen && useSheet" to="body">
      <div class="card-filter-sheet-backdrop" @click="menuOpen = false"></div>
      <div ref="sheet" class="card-filter-sheet" role="dialog">
        <div class="card-filter-sheet__grip"></div>
        <div class="card-filter-sheet__head">
          <h3 v-i18n>Filter</h3>
          <button v-if="activeCount > 0" type="button" class="card-filter-link" @click="reset" v-i18n>Reset filters</button>
        </div>
        <div class="card-filter-sheet__body">
          <CardFilterOptions :cards="cards" :filter="filter" :context="context"/>
        </div>
        <div class="card-filter-sheet__foot">
          <AppButton type="submit" :title="showButtonText" @click="menuOpen = false"/>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {CardModel} from '@/common/models/CardModel';
import {activeFilterCount, CardFilter, CardFilterContext, matchesCardFilter, resetCardFilter, setMaxCost, toggleInSet,
  togglePlayableOnly, toggleVictoryPoints} from '@/client/utils/cardFilter';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import CardFilterOptions from '@/client/components/cardfilter/CardFilterOptions.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import CardZoomSlider from '@/client/components/cardfilter/CardZoomSlider.vue';
import {mobileLayout} from '@/client/utils/mobileLayout';
import {resourceIconClass, tagIconClass, typeColorClass, typeOptionLabel} from '@/client/components/cardfilter/cardFilterLabels';

const props = defineProps<{
  // All cards of the list (unfiltered): the menu offers what occurs in them
  cards: ReadonlyArray<CardModel>;
  // Shared reactive filter state (cardFilterState.ts), changed in place
  filter: CardFilter;
  context: CardFilterContext;
}>();

// Mobile view only: below this row width the row switches to icon buttons and a bottom sheet.
// Outside the mobile view the labels always stay.
const COMPACT_BELOW_PX = 560;

const root = ref<HTMLElement>();
const sheet = ref<HTMLElement>();
const menuOpen = ref(false);
const compact = ref(false);
let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
  if (root.value === undefined || typeof ResizeObserver === 'undefined') {
    return;
  }
  resizeObserver = new ResizeObserver(([entry]) => {
    const width = entry.contentRect.width;
    // Hidden tabs report 0: keep the last layout
    if (width > 0) {
      compact.value = isMobileView() && width < COMPACT_BELOW_PX;
    }
  });
  resizeObserver.observe(root.value);
});

function isMobileView(): boolean {
  return document.documentElement.classList.contains('tm-mobile');
}

// Narrow rows only exist in the mobile view: they open the filters as a bottom sheet
const useSheet = computed(() => compact.value);
const isMobile = computed(() => mobileLayout.value);

const activeCount = computed(() => activeFilterCount(props.filter, props.context));
const shownCount = computed(() => props.cards.filter((card) => matchesCardFilter(card, props.filter, props.context)).length);
const shownText = computed(() => translateTextWithParams('${0} of ${1} cards', [String(shownCount.value), String(props.cards.length)]));
const showButtonText = computed(() => translateTextWithParams('Show ${0} cards', [String(shownCount.value)]));

type ActiveChip = {key: string, title: string, text?: string, iconClass?: string, dotClass?: string, megacredits?: boolean, remove: () => void};

// The active filters as chips in the row; a click on a chip removes it
const activeChips = computed((): Array<ActiveChip> => {
  const filter = props.filter;
  const chips: Array<ActiveChip> = [
    ...[...filter.types].map((type) => ({
      key: 'type-' + type, title: translateText(typeOptionLabel(type)), text: translateText(typeOptionLabel(type)),
      dotClass: typeColorClass(type), remove: () => toggleInSet(filter.types, type)})),
    ...[...filter.tags].map((tag) => ({key: 'tag-' + tag, title: translateText(tag), iconClass: tagIconClass(tag), remove: () => toggleInSet(filter.tags, tag)})),
    ...[...filter.resources].map((resource) => ({
      key: 'resource-' + resource, title: translateText(resource), iconClass: resourceIconClass(resource), remove: () => toggleInSet(filter.resources, resource)})),
  ];
  if (filter.victoryPoints) {
    chips.push({key: 'vp', title: translateText('with VP'), text: translateText('with VP'), remove: () => toggleVictoryPoints(filter)});
  }
  if (props.context.withCost && filter.maxCost !== undefined) {
    chips.push({key: 'cost', title: translateText('Cost up to'), text: '≤ ' + filter.maxCost, megacredits: true, remove: () => setMaxCost(filter, undefined)});
  }
  if (filter.playableOnly && props.context.playable !== undefined) {
    chips.push({key: 'playable', title: translateText('Playable now'), text: translateText('Playable now'), remove: () => togglePlayableOnly(filter)});
  }
  return chips;
});

function reset(): void {
  resetCardFilter(props.filter);
}

// A click outside the row and the sheet closes the menu
function closeOutside(event: PointerEvent): void {
  const target = event.target as Node;
  if (root.value?.contains(target) || sheet.value?.contains(target)) {
    return;
  }
  menuOpen.value = false;
}

watch(menuOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('pointerdown', closeOutside);
  } else {
    document.removeEventListener('pointerdown', closeOutside);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  document.removeEventListener('pointerdown', closeOutside);
});
</script>
