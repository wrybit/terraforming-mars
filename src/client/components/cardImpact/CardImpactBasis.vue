<template>
  <!-- Left part of an impact line: what the result is based on – mostly icons and numbers, little text -->
  <span class="card-impact-basis">
    <template v-if="basis.type === 'count'">
      <span v-if="basis.action">{{ $t('Action') }}:</span>
      <template v-if="basis.count.kind === 'tag'">
        <span v-if="hasParentheses">(</span>
        <span>{{ basis.count.own }}</span><i :class="tagClass(basis.count.tag)"></i>
        <template v-if="basis.count.wild > 0"><span>+ {{ basis.count.wild }}</span><i :class="tagClass(Tag.WILD)"></i></template>
        <span v-if="basis.count.self > 0">+ {{ $t('this card') }}</span>
        <span v-if="hasParentheses">)</span>
        <span v-if="basis.count.others" class="card-impact-muted">{{ $t('opponents') }}</span>
      </template>
      <template v-else-if="basis.count.kind === 'cities'">
        <span>{{ basis.count.count }}</span><i class="log-effect-icon log-effect-tile--city"></i>
        <span class="card-impact-muted">{{ $t(citiesLabel) }}</span>
      </template>
      <template v-else-if="basis.count.kind === 'greeneries'">
        <span>{{ basis.count.count }}</span><i class="log-effect-icon log-effect-tile--greenery"></i>
      </template>
      <template v-else-if="basis.count.kind === 'oceans'">
        <span>{{ basis.count.count }}</span><i class="log-effect-icon log-effect-tile--ocean"></i>
      </template>
      <template v-else-if="basis.count.kind === 'events'">
        <span>{{ basis.count.count }}</span><i :class="tagClass(Tag.EVENT)"></i>
        <span class="card-impact-muted">{{ $t('ever played') }}</span>
      </template>
      <span v-else>{{ basis.count.count }}</span>
      <span v-if="basis.each !== undefined">× {{ basis.each }}</span>
      <span v-if="basis.per !== undefined">÷ {{ basis.per }}</span>
    </template>

    <template v-else-if="basis.type === 'trackBonus'">
      <span class="card-impact-muted">{{ $t('Bonus at') }}</span>
      <i :class="['log-effect-icon', 'card-impact-icon--' + basis.parameter]"></i>
      <span>{{ trackValues }}</span>
    </template>

    <template v-else-if="basis.type === 'threshold'">
      <span>{{ basis.count }}</span><i :class="tagClass(basis.tag)"></i>
      <span>≥ {{ basis.needed }}</span>
      <span :class="basis.count >= basis.needed ? 'card-impact-met' : 'card-impact-unmet'">{{ basis.count >= basis.needed ? '✓' : '✗' }}</span>
    </template>

    <template v-else-if="basis.type === 'upTo'">
      <span>{{ maxText(basis.max) }}</span>
      <span :class="['log-effect', {'log-effect--production': basis.production}]"><i :class="iconClass(basis.resource)"></i></span>
    </template>

    <template v-else-if="basis.type === 'attack'">
      <span>{{ maxText(basis.max) }}</span><i :class="iconClass(basis.resource)"></i>
    </template>

    <template v-else-if="basis.type === 'card'">
      <span class="card-impact-card">{{ $t(basis.card) }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {CardImpactBasis, CardImpactResource} from '@/common/models/CardImpact';
import {Tag} from '@/common/cards/Tag';
import {impactIconClass} from '@/client/components/cardImpact/cardImpactIcons';
import {translateTextWithParams} from '@/client/directives/i18n';

const props = defineProps<{
  basis: CardImpactBasis;
}>();

const iconClass = (resource: CardImpactResource) => impactIconClass(resource);
const tagClass = (tag: Tag) => ['card-impact-tag', 'tag-' + tag];
const maxText = (max: number) => translateTextWithParams('max. ${0}', [String(max)]);

// Parentheses only where a sum is divided or multiplied: "(7 + this card) ÷ 2"
const hasParentheses = computed(() => {
  const basis = props.basis;
  if (basis.type !== 'count' || basis.count.kind !== 'tag') {
    return false;
  }
  const parts = (basis.count.wild > 0 ? 1 : 0) + (basis.count.self > 0 ? 1 : 0);
  return parts > 0 && (basis.per !== undefined || basis.each !== undefined);
});

const CITY_LABELS = {onmars: 'on Mars', offmars: 'off Mars', everywhere: 'in play'} as const;
const citiesLabel = computed(() => {
  const basis = props.basis;
  return basis.type === 'count' && basis.count.kind === 'cities' ? CITY_LABELS[basis.count.where] : '';
});

const TRACK_UNITS = {temperature: ' °C', oxygen: ' %', venus: ' %'} as const;
const trackValues = computed(() => {
  const basis = props.basis;
  return basis.type === 'trackBonus' ? basis.values.join(' · ') + TRACK_UNITS[basis.parameter] : '';
});
</script>
