<template>
  <!-- Key facts of the AI at the decision: stock and production per resource, TR, VP, hand -->
  <section class="ai-decision-dialog__section" data-test="ai-decision-state">
    <!-- Values before the decision; the production the row changed is shown with an arrow (otherwise the +1
         production of the row and the +0 here look like a contradiction). Stock changes stay out: the row
         does not list the paid costs, an arrow there would be wrong. -->
    <h3 class="ai-decision-dialog__heading" v-i18n>Situation of the AI before the decision</h3>
    <div class="ai-decision-state">
      <div v-for="resource in resources" :key="resource.icon" class="ai-decision-state__resource" :title="$t(resource.label)">
        <!-- Stock next to its icon, production below -->
        <span class="ai-decision-state__stock-line">
          <i :class="['log-effect-icon', 'log-effect-resource--' + resource.icon]"></i>
          <b class="ai-decision-state__stock">{{ resource.stock }}</b>
        </span>
        <!-- Production on the brown area, as in the log -->
        <span class="log-effect log-effect--production ai-decision-state__production"><b>{{ signed(resource.production) }}</b><b v-if="resource.productionChange !== 0" class="ai-decision-state__after">→ {{ signed(resource.production + resource.productionChange) }}</b></span>
      </div>
    </div>
    <!-- Tags the AI had at the decision, in the order of the player board -->
    <div v-if="tags.length > 0" class="ai-decision-state__tags" data-test="ai-decision-tags">
      <span v-for="entry in tags" :key="entry.tag" class="ai-decision-state__tag">
        <TagIcon :tag="entry.tag" size="small"/><b class="ai-decision-state__tag-count">{{ entry.count }}</b>
      </span>
    </div>
    <div class="ai-decision-state__totals">
      <span class="ai-decision-state__total"><i class="log-effect-icon log-effect-resource--tr"></i><span v-i18n>Terraform Rating</span> <b>{{ state.terraformRating }}</b></span>
      <span class="ai-decision-state__total"><span v-i18n>Victory Points</span> <b>{{ state.victoryPoints }}</b></span>
      <span class="ai-decision-state__total"><i class="log-effect-icon log-effect-resource--card"></i><span v-i18n>Cards in hand</span> <b>{{ state.hand.length }}</b></span>
    </div>
    <ul v-if="state.hand.length > 0" class="ai-decision-state__hand">
      <li v-for="(card, index) in state.hand" :key="index" class="ai-decision-state__card"><AiCardHover :card="card">{{ cardName(card) }}</AiCardHover></li>
    </ul>
    <!-- After a pass: what the action menu still offered (playable cards, standard projects, card actions …) -->
    <template v-if="passed && state.possibleActions !== undefined">
      <h4 class="ai-decision-dialog__group-title ai-decision-state__possible-title" v-i18n>Still possible, but not done</h4>
      <ul v-if="leftOut.length > 0" class="ai-decision-state__possible" data-test="ai-decision-possible">
        <li v-for="(action, index) in leftOut" :key="index" class="ai-decision-state__action">
          <span class="ai-decision-state__action-title">{{ actionTitle(action) }}</span>
          <span v-for="(card, cardIndex) in action.cards ?? []" :key="cardIndex" class="ai-decision-state__card"><AiCardHover :card="card">{{ cardName(card) }}</AiCardHover></span>
        </li>
      </ul>
      <p v-else class="ai-decision-dialog__hint" v-i18n>Nothing else was possible.</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {AiDecisionState, AiPossibleAction} from '@/common/ai/AiDecisionSummary';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {LogEffect} from '@/client/components/logpanel/logActions';
import AiCardHover from './AiCardHover.vue';
import TagIcon from '@/client/components/Tag.vue';
import {Tag} from '@/common/cards/Tag';

// Situation of the AI when it decided (analysis games): next to a pass it shows what the AI still had
const props = defineProps<{
  state: AiDecisionState;
  // The decision was a pass: list what the menu still offered
  passed?: boolean;
  // Own effects of the decision's log row (stock and production changes)
  effects?: ReadonlyArray<LogEffect>;
}>();

// Sum of the row's production changes of one resource
function productionChangeOf(icon: string): number {
  return (props.effects ?? [])
    .filter((effect) => effect.resource === icon && effect.card === undefined && effect.production === true)
    .reduce((sum, effect) => sum + effect.amount, 0);
}

const tags = computed(() => {
  const counts = props.state.tags ?? {};
  return Object.values(Tag)
    .filter((tag) => (counts[tag] ?? 0) > 0)
    .map((tag) => ({tag, count: counts[tag]}));
});

// Ending the turn is no alternative to passing
const TURN_ENDINGS = ['Pass for this generation', 'End Turn'];

// An action whose card choice is empty (e.g. standard projects without money) was not really possible
const leftOut = computed(() => (props.state.possibleActions ?? [])
  .filter((action) => !TURN_ENDINGS.includes(action.title) && (action.cards === undefined || action.cards.length > 0)));

function actionTitle(action: AiPossibleAction): string {
  return action.params === undefined || action.params.length === 0 ? translateText(action.title) : translateTextWithParams(action.title, action.params);
}

const resources = computed(() => {
  const state = props.state;
  const production = state.production;
  return [
    {icon: 'megacredit', label: 'Megacredits', stock: state.megaCredits, production: production.megacredits, productionChange: productionChangeOf('megacredit')},
    {icon: 'steel', label: 'Steel', stock: state.steel, production: production.steel, productionChange: productionChangeOf('steel')},
    {icon: 'titanium', label: 'Titanium', stock: state.titanium, production: production.titanium, productionChange: productionChangeOf('titanium')},
    {icon: 'plant', label: 'Plants', stock: state.plants, production: production.plants, productionChange: productionChangeOf('plant')},
    {icon: 'power', label: 'Energy', stock: state.energy, production: production.energy, productionChange: productionChangeOf('power')},
    {icon: 'heat', label: 'Heat', stock: state.heat, production: production.heat, productionChange: productionChangeOf('heat')},
  ];
});

function signed(amount: number): string {
  return amount < 0 ? '−' + Math.abs(amount) : '+' + amount;
}

// Card names may carry a suffix (standard projects); the log shows them without
function cardName(name: string): string {
  return translateText(name.split(':')[0]);
}
</script>
