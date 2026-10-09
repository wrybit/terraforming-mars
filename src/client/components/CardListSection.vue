<template>
  <!-- Draft: cards already kept in this round, as a second section below the new cards to choose from
       (same structure as the hand cards tab, HandCardsPanel.vue) -->
  <section class="hand-cards-panel__section drafted-cards-section">
    <h3 class="hand-cards-panel__title">{{ $t('Drafted cards') }} <small>{{ cards.length }}</small></h3>
    <div class="drafted-cards-section__cards">
      <div v-for="card in cards" :key="card.name" class="cardbox">
        <Card :card="card"/>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Card from '@/client/components/card/Card.vue';
import {CardModel} from '@/common/models/CardModel';

defineProps<{
  cards: ReadonlyArray<CardModel>;
}>();
</script>
