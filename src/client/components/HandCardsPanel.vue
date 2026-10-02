<template>
  <!-- Content of the hand cards tab: at the top the own active (blue) cards with live counters and
       action cubes, below them the sortable hand cards. Headings only when both sections exist. -->
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
      <!-- Header row: heading on the left, sorting (manual or upstream sortings) on the right; without heading only the buttons -->
      <div v-if="activeCards.length > 0 || handCards.length > 1" class="hand-cards-panel__header">
        <h3 v-if="activeCards.length > 0" class="hand-cards-panel__title">{{ $t('Cards In Hand') }} <small>{{ handCards.length }}</small></h3>
        <HandSortControl v-if="handCards.length > 1" :playerView="playerView" class="hand-cards-panel__sort"/>
      </div>
      <SortableCards :playerId="playerView.id" :cards="handCards"/>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import Card from '@/client/components/card/Card.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import HandSortControl from '@/client/components/HandSortControl.vue';
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
