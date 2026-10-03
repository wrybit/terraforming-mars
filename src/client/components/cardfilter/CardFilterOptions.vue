<template>
  <!-- All filter groups of a card list (filter menu on wide rows, bottom sheet on the phone).
       Only options that occur in the list; the number on a chip shows how many cards match it. -->
  <div class="card-filter-options">
    <div v-if="options.types.length > 0" class="card-filter-options__group">
      <span class="card-filter-options__label" v-i18n>Type</span>
      <div class="card-filter-options__chips">
        <button v-for="option in options.types" :key="option.value" type="button" class="card-filter-chip"
          :class="{'card-filter-chip--on': filter.types.has(option.value)}" :aria-pressed="filter.types.has(option.value)"
          @click="toggleInSet(filter.types, option.value)">
          <span class="card-filter-chip__dot" :class="typeColorClass(option.value)"></span>
          <span v-i18n>{{ typeOptionLabel(option.value) }}</span>
          <small>{{ option.count }}</small>
        </button>
      </div>
    </div>
    <div v-if="options.victoryPoints !== undefined" class="card-filter-options__group">
      <span class="card-filter-options__label" v-i18n>Scoring</span>
      <div class="card-filter-options__chips">
        <button type="button" class="card-filter-chip" :class="{'card-filter-chip--on': filter.victoryPoints}"
          :aria-pressed="filter.victoryPoints" @click="toggleVictoryPoints(filter)">
          <span class="card-filter-vp" v-i18n>VP</span>
          <span v-i18n>with VP</span>
          <small>{{ options.victoryPoints }}</small>
        </button>
      </div>
    </div>
    <div v-if="options.playable !== undefined" class="card-filter-options__group">
      <span class="card-filter-options__label" v-i18n>Status</span>
      <div class="card-filter-options__chips">
        <button type="button" class="card-filter-chip" :class="{'card-filter-chip--on': filter.playableOnly}"
          :aria-pressed="filter.playableOnly" @click="togglePlayableOnly(filter)">
          <span class="card-filter-check" aria-hidden="true"></span>
          <span v-i18n>Playable now</span>
          <small>{{ options.playable }}</small>
        </button>
      </div>
    </div>
    <div v-if="options.highestCost !== undefined" class="card-filter-options__group">
      <span class="card-filter-options__label" v-i18n>Cost up to</span>
      <label class="card-filter-cost" :class="{'card-filter-cost--on': filter.maxCost !== undefined}">
        <input type="range" min="0" :max="options.highestCost" :value="filter.maxCost ?? options.highestCost"
          :aria-label="$t('Cost up to')" @input="changeMaxCost">
        <output>
          <template v-if="filter.maxCost === undefined">{{ $t('any') }}</template>
          <template v-else>≤ {{ filter.maxCost }}</template>
          <i class="resource_icon resource_icon--megacredits"></i>
        </output>
      </label>
    </div>
    <div v-if="options.tags.length > 0" class="card-filter-options__group">
      <span class="card-filter-options__label" v-i18n>Tags</span>
      <div class="card-filter-options__chips">
        <button v-for="option in options.tags" :key="option.value" type="button" class="card-filter-chip card-filter-chip--icon"
          :class="{'card-filter-chip--on': filter.tags.has(option.value)}" :aria-pressed="filter.tags.has(option.value)"
          :title="$t(option.value)" @click="toggleInSet(filter.tags, option.value)">
          <span class="card-filter-icon" :class="tagIconClass(option.value)"></span>
          <small>{{ option.count }}</small>
        </button>
      </div>
    </div>
    <div v-if="options.resources.length > 0" class="card-filter-options__group">
      <span class="card-filter-options__label" v-i18n>Collects</span>
      <div class="card-filter-options__chips">
        <button v-for="option in options.resources" :key="option.value" type="button" class="card-filter-chip card-filter-chip--icon"
          :class="{'card-filter-chip--on': filter.resources.has(option.value)}" :aria-pressed="filter.resources.has(option.value)"
          :title="$t(option.value)" @click="toggleInSet(filter.resources, option.value)">
          <span class="card-filter-icon" :class="resourceIconClass(option.value)"></span>
          <small>{{ option.count }}</small>
        </button>
      </div>
    </div>
    <!-- Display of non-matching cards: own group below the filters, separated by a line -->
    <div class="card-filter-options__group card-filter-options__group--display">
      <span class="card-filter-options__label" v-i18n>Non-matching cards</span>
      <div class="card-filter-toggle" role="radiogroup">
        <button v-for="choice in UNMATCHED_CHOICES" :key="choice.value" type="button" role="radio"
          :aria-checked="unmatchedCards === choice.value" :class="{'card-filter-toggle--on': unmatchedCards === choice.value}"
          @click="setUnmatchedCards(choice.value)" v-i18n>{{ choice.label }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {CardModel} from '@/common/models/CardModel';
import {CardFilter, CardFilterContext, cardFilterOptions, setMaxCost, toggleInSet, togglePlayableOnly, toggleVictoryPoints} from '@/client/utils/cardFilter';
import {setUnmatchedCards, unmatchedCards, UnmatchedCards} from '@/client/utils/cardFilterState';
import {resourceIconClass, tagIconClass, typeColorClass, typeOptionLabel} from '@/client/components/cardfilter/cardFilterLabels';

const props = defineProps<{
  cards: ReadonlyArray<CardModel>;
  // Shared reactive filter state (cardFilterState.ts), changed in place
  filter: CardFilter;
  context: CardFilterContext;
}>();

const UNMATCHED_CHOICES: ReadonlyArray<{value: UnmatchedCards, label: string}> = [
  {value: 'hide', label: 'Hidden'},
  {value: 'dim', label: 'Dimmed'},
];

const options = computed(() => cardFilterOptions(props.cards, props.context));

// Slider all the way to the right = no limit
function changeMaxCost(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  const highest = options.value.highestCost ?? value;
  setMaxCost(props.filter, value >= highest ? undefined : value);
}
</script>
