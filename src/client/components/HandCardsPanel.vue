<template>
  <!-- Content of the hand cards tab: at the top the own active (blue) cards with live counters and
       action cubes, below them the sortable hand cards, at the end the claimed underground tokens (Underworld; mobile
       shows those on the Mars screen). Headings only when more than one section exists. -->
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
      <!-- Head of the hand cards: heading (only with active cards above), filter and sorting in one row
           across the whole box, separated by lines from the content above and below -->
      <CardFilterBar v-if="handCards.length > 1" :cards="handCards" :filter="handCardFilter" :context="filterContext">
        <template #lead>
          <h3 v-if="hasOtherSections" class="hand-cards-panel__title">{{ $t('Cards In Hand') }} <small>{{ handCards.length }}</small></h3>
        </template>
        <template #sort="{compact}">
          <HandSortControl :playerView="playerView" :compact="compact" :allowManual="true"/>
        </template>
      </CardFilterBar>
      <div v-else-if="hasOtherSections" class="hand-cards-panel__header">
        <h3 class="hand-cards-panel__title">{{ $t('Cards In Hand') }} <small>{{ handCards.length }}</small></h3>
      </div>
      <CardFilterEmptyHint v-if="nothingShown" @reset="resetCardFilter(handCardFilter)"/>
      <SortableCards :playerId="playerView.id" :cards="handCards" :visibility="visibility"/>
    </section>
    <section v-if="undergroundTokens" class="hand-cards-panel__section hand-cards-panel__section--underground">
      <h3 class="hand-cards-panel__title">{{ $t('Claimed Underground Resource Tokens') }} <small>{{ thisPlayer.underworldData.tokens.length }}</small></h3>
      <UndergroundTokens :underworldData="thisPlayer.underworldData"/>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import Card from '@/client/components/card/Card.vue';
import UndergroundTokens from '@/client/components/underworld/UndergroundTokens.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import HandSortControl from '@/client/components/HandSortControl.vue';
import CardFilterBar from '@/client/components/cardfilter/CardFilterBar.vue';
import CardFilterEmptyHint from '@/client/components/cardfilter/CardFilterEmptyHint.vue';
import {CardModel} from '@/common/models/CardModel';
import {CardFilterContext, resetCardFilter} from '@/client/utils/cardFilter';
import {cardVisibility, CardVisibility, handCardFilter, unmatchedCards} from '@/client/utils/cardFilterState';
import {playableProjectCards} from '@/client/utils/playableCards';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {allCardsInHand} from '@/client/utils/handCards';
import {ownActiveCards} from '@/client/utils/ownActiveCards';
import {isCardActivated} from '@/client/utils/CardUtils';

const props = defineProps<{
  playerView: PlayerViewModel;
  // Mobile shows the claimed underground tokens on the Mars screen instead
  hideUndergroundTokens?: boolean;
}>();

const thisPlayer = computed(() => props.playerView.thisPlayer);
const activeCards = computed(() => ownActiveCards(props.playerView));
const handCards = computed(() => allCardsInHand(props.playerView));
const undergroundTokens = computed(() => !props.hideUndergroundTokens && thisPlayer.value.underworldData.tokens.length > 0);
// The hand cards get their heading as soon as another section shares the box
const hasOtherSections = computed(() => activeCards.value.length > 0 || undergroundTokens.value);
// "Playable now" only while the player can play a project card
const filterContext = computed((): CardFilterContext => ({playable: playableProjectCards(props.playerView), withCost: true}));

function visibility(card: CardModel): CardVisibility {
  return cardVisibility(card, handCardFilter, filterContext.value);
}

const nothingShown = computed(() => unmatchedCards.value === 'hide' && handCards.value.length > 1 &&
  handCards.value.every((card) => visibility(card) !== 'shown'));
</script>
