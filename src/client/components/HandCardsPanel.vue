<template>
  <!-- Content of the "All cards" tab: at the top the own active (blue) cards with live counters and
       action cubes, below them the sortable hand cards, then the claimed underground tokens (Underworld; mobile
       shows those on the Mars screen), at the very end the other played cards (corporation, automated, events …)
       with the filter and sorting of the played cards. Headings only when more than one section exists. -->
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
    <section v-if="playedCards.length > 0" class="hand-cards-panel__section hand-cards-panel__section--played">
      <CardFilterBar v-if="playedCards.length > 1" :cards="playedCards" :filter="playedCardFilter" :context="playedFilterContext">
        <template #lead>
          <h3 class="hand-cards-panel__title">{{ $t('Played Cards') }} <small>{{ playedCards.length }}</small></h3>
        </template>
        <template #sort="{compact}">
          <CardSortMenu :modelValue="playedCardsSortOrder" :compact="compact" @update:modelValue="setPlayedSortOrder"/>
        </template>
      </CardFilterBar>
      <div v-else class="hand-cards-panel__header">
        <h3 class="hand-cards-panel__title">{{ $t('Played Cards') }} <small>{{ playedCards.length }}</small></h3>
      </div>
      <CardFilterEmptyHint v-if="nothingPlayedShown" @reset="resetCardFilter(playedCardFilter)"/>
      <PlayedCardsGroups class="hand-cards-panel__cards" :player="thisPlayer" :visibility="playedVisibility" withoutActiveCards/>
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
import CardSortMenu from '@/client/components/cardfilter/CardSortMenu.vue';
import PlayedCardsGroups from '@/client/components/PlayedCardsGroups.vue';
import {CardModel} from '@/common/models/CardModel';
import {SortOrder} from '@/client/utils/SortOrder';
import {CardFilterContext, resetCardFilter} from '@/client/utils/cardFilter';
import {cardVisibility, CardVisibility, handCardFilter, playedCardFilter, playedCardsSortOrder, unmatchedCards} from '@/client/utils/cardFilterState';
import {playableProjectCards} from '@/client/utils/playableCards';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {allCardsInHand} from '@/client/utils/handCards';
import {ownActiveCards} from '@/client/utils/ownActiveCards';
import {isCardActivated} from '@/client/utils/CardUtils';
import {ownPlayedCardsWithoutActive} from '@/client/utils/ownPlayedCards';

const props = defineProps<{
  playerView: PlayerViewModel;
  // Mobile shows the claimed underground tokens on the Mars screen instead
  hideUndergroundTokens?: boolean;
}>();

const thisPlayer = computed(() => props.playerView.thisPlayer);
const activeCards = computed(() => ownActiveCards(props.playerView));
const handCards = computed(() => allCardsInHand(props.playerView));
const undergroundTokens = computed(() => !props.hideUndergroundTokens && thisPlayer.value.underworldData.tokens.length > 0);
// Played cards except the active ones, which have their own section at the top
const playedCards = computed(() => ownPlayedCardsWithoutActive(props.playerView));
// The hand cards get their heading as soon as another section shares the box
const hasOtherSections = computed(() => activeCards.value.length > 0 || undergroundTokens.value || playedCards.value.length > 0);
// "Playable now" only while the player can play a project card
const filterContext = computed((): CardFilterContext => ({playable: playableProjectCards(props.playerView), withCost: true}));

function visibility(card: CardModel): CardVisibility {
  return cardVisibility(card, handCardFilter, filterContext.value);
}

const nothingShown = computed(() => unmatchedCards.value === 'hide' && handCards.value.length > 1 &&
  handCards.value.every((card) => visibility(card) !== 'shown'));

// Played cards: their own filter without cost (like the players' card view, OtherPlayer.vue)
const playedFilterContext: CardFilterContext = {withCost: false};

function playedVisibility(card: CardModel): CardVisibility {
  return cardVisibility(card, playedCardFilter, playedFilterContext);
}

function setPlayedSortOrder(value: SortOrder | undefined): void {
  playedCardsSortOrder.value = value;
}

const nothingPlayedShown = computed(() => unmatchedCards.value === 'hide' && playedCards.value.length > 1 &&
  playedCards.value.every((card) => playedVisibility(card) !== 'shown'));
</script>
