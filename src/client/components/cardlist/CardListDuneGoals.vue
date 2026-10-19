<template>
  <!-- Dune theme: milestones or awards as on the goals page of the mockup: the rules of the kind as chips,
       then the goal cards in an even grid (every card the same width) -->
  <div class="card-list-dune-goals">
    <ul class="card-list-dune-goals__rules">
      <li v-for="rule in rules" :key="rule.text">{{ ruleText(rule) }}</li>
    </ul>
    <div class="card-list-dune-goals__grid">
      <DuneGoalCard v-for="name in names" :key="name" :kind="kind" :name="name"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import DuneGoalCard from '@/client/components/DuneGoalCard.vue';
import {MilestoneAwardKind} from '@/client/components/milestoneAwardChoice';
import {translateTextWithParams} from '@/client/directives/i18n';
import {DUNE_GOAL_RULES, GoalRule} from '@/client/components/cardlist/cardListTheme';

const props = defineProps<{
  kind: MilestoneAwardKind;
  names: ReadonlyArray<string>;
}>();

const rules = computed((): ReadonlyArray<GoalRule> => DUNE_GOAL_RULES[props.kind]);

function ruleText(rule: GoalRule): string {
  return translateTextWithParams(rule.text, rule.params);
}
</script>
