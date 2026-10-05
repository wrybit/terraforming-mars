<template>
  <div class="wf-component--select-card choice-block ceo-action-section" :style="choiceBlockStyle(cards.length)">
    <!-- CEO cards of the own tableau inside the "Actions" tab (ceoActions.ts): selectable like the action cards above
         (same card block as SelectCard) while the once-per-game action is offered; spent: grey and half transparent;
         otherwise toned down -->
    <label v-for="card in cards" :key="card.name"
      :class="['cardbox', 'ceo-action-card', 'ceo-action-card--' + stateOf(card)]">
      <input type="radio" :name="groupName" :value="card.name"
        :checked="selected === card.name"
        :disabled="stateOf(card) !== 'available'"
        @change="$emit('select', card.name)">
      <Card :card="displayedCard(card)"/>
    </label>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {SelectCardModel} from '@/common/models/PlayerInputModel';
import {CeoCardState, ceoCardState} from '@/client/utils/ceoActions';
import {choiceBlockStyle} from '@/client/components/choiceBlock';

export default defineComponent({
  name: 'CeoActionSection',
  components: {
    Card,
  },
  props: {
    // Own CEO cards (ownCeoCards)
    cards: {
      type: Array as PropType<ReadonlyArray<CardModel>>,
      required: true,
    },
    // The server's CEO action input; undefined when no CEO action is possible right now
    option: {
      type: Object as PropType<SelectCardModel | undefined>,
      default: undefined,
    },
    selected: {
      type: String as PropType<CardName | undefined>,
      default: undefined,
    },
    // Radio group of the CEO cards; exclusivity with the action cards above is handled by OrOptions
    groupName: {
      type: String,
      required: true,
    },
  },
  emits: ['select'],
  methods: {
    choiceBlockStyle,
    stateOf(card: CardModel): CeoCardState {
      return ceoCardState(card, this.option);
    },
    // Card from the input while offered (current values), otherwise from the tableau, marked as not selectable
    displayedCard(card: CardModel): CardModel {
      const offered = this.option?.cards.find((candidate) => candidate.name === card.name);
      if (this.stateOf(card) === 'available' && offered !== undefined) {
        return offered;
      }
      return {...card, isDisabled: true};
    },
  },
});
</script>
