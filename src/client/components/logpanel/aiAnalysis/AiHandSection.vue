<template>
  <section class="ai-hand-section">
    <h3 class="hand-cards-panel__title">
      <span v-i18n>AI hand cards</span> <small v-if="!hand.hidden">{{ hand.cards.length }}</small>
    </h3>
    <!-- Hidden while the reader still buys his own cards: the hand already holds what the AI bought -->
    <p v-if="hand.hidden" class="ai-hand-section__hint" v-i18n>Visible once you have bought your cards</p>
    <p v-else-if="hand.cards.length === 0" class="ai-hand-section__hint" v-i18n>No cards in hand</p>
    <div v-else class="other-player-cards ai-hand-section__cards">
      <div v-for="card in hand.cards" :key="card.name" class="cardbox">
        <Card :card="card"/>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Card from '@/client/components/card/Card.vue';
import {AiHandModel} from '@/common/models/PlayerModel';

defineProps<{
  hand: AiHandModel;
}>();
</script>
