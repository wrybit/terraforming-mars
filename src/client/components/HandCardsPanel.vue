<template>
  <!-- Inhalt des Handkarten-Tabs: oben die eigenen aktiven (blauen) Karten mit live Zählern und
       Aktions-Würfel, darunter die sortierbaren Handkarten. Überschriften nur, wenn es beide Abschnitte gibt. -->
  <div class="hand-cards-panel">
    <section v-if="activeCards.length > 0" class="hand-cards-panel__section hand-cards-panel__section--active">
      <h3 class="hand-cards-panel__title">{{ $t('Active cards') }} <small>{{ activeCards.length }}</small></h3>
      <div class="hand-cards-panel__cards">
        <div v-for="card in activeCards" :key="card.name" class="cardbox">
          <Card :card="card" :actionUsed="isCardActivated(card, thisPlayer)" :cubeColor="thisPlayer.color"/>
        </div>
      </div>
    </section>
    <section v-if="handCards.length > 0" class="hand-cards-panel__section">
      <h3 v-if="activeCards.length > 0" class="hand-cards-panel__title">{{ $t('Cards In Hand') }} <small>{{ handCards.length }}</small></h3>
      <SortableCards :playerId="playerView.id" :cards="handCards"/>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import Card from '@/client/components/card/Card.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {allCardsInHand} from '@/client/utils/handCards';
import {ownActiveCards} from '@/client/utils/ownActiveCards';
import {isCardActivated} from '@/client/utils/CardUtils';

const props = defineProps<{
  playerView: PlayerViewModel;
}>();

const thisPlayer = computed(() => props.playerView.thisPlayer);
const activeCards = computed(() => ownActiveCards(props.playerView));
const handCards = computed(() => allCardsInHand(props.playerView));
</script>
