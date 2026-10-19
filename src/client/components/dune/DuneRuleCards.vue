<template>
  <!-- Rules of a Dune module as small cards (picture + one line) instead of a block of text, so they read at a glance.
       A rule shows either a Dune picture (duneGraphic) or one of the drawn signs below. -->
  <ul class="dune-rules" data-test="dune-rules">
    <li v-for="rule in rules" :key="rule.text" class="dune-rules__card">
      <span class="dune-rules__icon">
        <img v-if="rule.picture !== undefined" :src="graphic(rule.picture)" alt="">
        <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path :d="SIGNS[rule.sign ?? 'tap']"/></svg>
      </span>
      <span class="dune-rules__text">{{ $t(rule.text) }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import {duneGraphic} from './duneGraphic';
import {DuneRule, DuneRuleSign} from './duneRules';

defineProps<{
  rules: ReadonlyArray<DuneRule>;
}>();

const graphic = duneGraphic;

// Simple line signs, drawn with the stroke of the card (dune_rules.less)
const SIGNS: Record<DuneRuleSign, string> = {
  // New in from the left: arrow into a box
  enter: 'M2 12h10M8 8l4 4-4 4M14 5h6v14h-6',
  // Sliding right: two arrows
  slide: 'M3 8h12M11 4l4 4-4 4M9 16h12M17 12l4 4-4 4',
  // Out on the right and gone: box with arrow leaving
  leave: 'M4 5h6v14H4M10 12h10M16 8l4 4-4 4',
  // An action: a finger tapping
  tap: 'M9 11V5a2 2 0 0 1 4 0v6M13 9a2 2 0 0 1 4 0v2M17 11a2 2 0 0 1 4 0v3a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-3-5a2 2 0 0 1 3-2l2 2',
  // Pays out: check mark in a circle
  payout: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M8 12l3 3 5-6',
};
</script>
