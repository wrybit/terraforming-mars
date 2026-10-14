<template>
  <!-- Cards of a draft pick, purchase or start selection as real cards (50 %), in one row to scroll sideways -->
  <div class="ai-decision-cards" data-test="ai-decision-cards">
    <div v-for="option in cardOptions" :key="option.index ?? option.label"
      :class="['ai-decision-cards__item', {'ai-decision-cards__item--chosen': option.chosen === true}]">
      <div class="ai-decision-cards__card">
        <Card :card="cardModel(option.card)"/>
      </div>
      <span class="ai-decision-cards__value">{{ option.chosen === true ? '✓ ' : '' }}{{ formatValue(option.value) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {AiDecisionOption, AiDecisionSummary} from '@/common/ai/AiDecisionSummary';
import {logCardModel} from '@/client/components/logpanel/logCardModel';
import {formatValue, optionGroups} from './aiDecisionOptions';

const props = defineProps<{
  decision: AiDecisionSummary;
  players: ReadonlyArray<PublicPlayerModel>;
}>();

// Card options in the order of the list below (start selection: corporations, preludes, project cards)
const cardOptions = computed(() => optionGroups(props.decision).flatMap((group) => group.options)
  .filter((option): option is AiDecisionOption & {card: string} => option.card !== undefined));

function cardModel(name: string): CardModel {
  return logCardModel(name as CardName, props.players);
}
</script>
