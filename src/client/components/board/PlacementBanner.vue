<template>
  <div :class="['placement-banner', 'placement-banner--tone-' + tone, {'placement-banner--generic': description.tile === undefined}]">
    <!-- What is being placed, what the tile brings and where it may go – above the enlarged Mars/Moon -->
    <div v-if="description.tile !== undefined" :class="['placement-banner-icon', 'placement-banner-icon--' + description.tile]"></div>
    <div class="placement-banner-main">
      <div class="placement-banner-title">{{ $t(description.title) }}</div>
      <div v-if="description.gains.length > 0" class="placement-banner-gains">
        <span v-for="gain in description.gains" :key="gain.label" class="placement-gain">
          <i v-if="gain.icon !== undefined" :class="['placement-gain-icon', 'placement-gain-icon--' + gain.icon]"></i>
          <b v-if="gain.value !== ''">{{ gain.value }}</b>
          <span class="placement-gain-label">{{ gainLabel(gain) }}</span>
        </span>
      </div>
    </div>
    <ul v-if="description.rules.length > 0" class="placement-rules">
      <li v-for="(rule, index) in description.rules" :key="index" :class="['placement-rule', 'placement-rule--' + rule.kind]">
        <span class="placement-rule-mark" aria-hidden="true">{{ RULE_MARKS[rule.kind] }}</span>
        <span><span v-if="rule.kind === 'card'" class="placement-rule-card">{{ $t('Card') }}</span>{{ $t(rule.text) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {PlacementDescription, PlacementGain, PlacementRuleKind} from '@/client/components/board/placementDescription';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

const props = defineProps<{
  description: PlacementDescription;
}>();

// Hard rule, "if possible", bonus, card rule – the mark carries the kind, the color repeats it (placement_banner.less)
const RULE_MARKS: Readonly<Record<PlacementRuleKind, string>> = {required: '✕', soft: '!', bonus: '+', card: '★'};

// Colors like the tabs (or_tab_tones.less): Mars tiles in their own color, Moon tiles and unknown tiles grey
const tone = computed(() => {
  const tile = props.description.tile;
  return tile === 'greenery' || tile === 'city' || tile === 'ocean' ? tile : 'moon';
});

function gainLabel(gain: PlacementGain): string {
  return gain.labelParams === undefined ? translateText(gain.label) : translateTextWithParams(gain.label, [...gain.labelParams]);
}
</script>
