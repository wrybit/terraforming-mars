<template>
  <!-- A section of view-only cards below a tab's selection (same structure as the hand cards tab, HandCardsPanel.vue):
       the kept cards in the draft, hand cards that can't be played right now, actions already used or not usable.
       Disappears when the filter of the selection above hides all its cards. Inside a card
       grid the same sections are rendered by the selection itself (cardSections.ts). -->
  <section v-if="shownCount > 0" class="hand-cards-panel__section card-list-section">
    <h3 class="hand-cards-panel__title choice-section-title">{{ $t(title) }} <small>{{ shownCount }}</small></h3>
    <div class="hand-cards-panel__cards">
      <div v-for="card in cards" :key="card.name" class="cardbox" :class="visibilityClass(card)">
        <Card :card="unavailable ? {...card, isDisabled: true} : card" :actionUsed="actionUsed" :cubeColor="cubeColor"/>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardModel} from '@/common/models/CardModel';
import {Color} from '@/common/Color';
import {CardVisibility} from '@/client/utils/cardFilterState';

const props = defineProps<{
  title: string;
  cards: ReadonlyArray<CardModel>;
  // Cards that can't be chosen: grey and half transparent (cards.less .card-unavailable)
  unavailable?: boolean;
  // Actions used this generation: the player cube on the card (Card.vue)
  actionUsed?: boolean;
  cubeColor?: Color;
  // Filter of the selection above (cardFilterState.ts), so the whole tab follows the one filter row
  visibility?: (card: CardModel) => CardVisibility;
}>();

function visibilityOf(card: CardModel): CardVisibility {
  return props.visibility?.(card) ?? 'shown';
}

function visibilityClass(card: CardModel): string | undefined {
  const visibility = visibilityOf(card);
  return visibility === 'shown' ? undefined : 'card-filter-' + visibility;
}

const shownCount = computed(() => props.cards.filter((card) => visibilityOf(card) !== 'hidden').length);
</script>
