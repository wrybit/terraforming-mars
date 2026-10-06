<template>
  <!-- Content of the "All cards" tab: ONE filter and sorting row at the top for the whole content, below it
       the own active (blue) cards with live counters and action cubes, the sortable hand cards, the claimed
       underground tokens (Underworld; mobile shows those on the Mars screen) and at the very end the other played
       cards (corporation, CEO, automated, preludes, events). A section the filter empties completely disappears;
       headings only when more than one section is shown. -->
  <div class="hand-cards-panel">
    <CardFilterBar v-if="allCards.length > 1" :cards="allCards" :filter="handCardFilter" :context="filterContext">
      <template #sort="{compact}">
        <HandSortControl :playerView="playerView" :compact="compact" :allowManual="true"/>
      </template>
    </CardFilterBar>
    <CardFilterEmptyHint v-if="nothingShown" @reset="resetCardFilter(handCardFilter)"/>
    <section v-if="shownActiveCount > 0" class="hand-cards-panel__section hand-cards-panel__section--active">
      <h3 v-if="hasSeveralSections" class="hand-cards-panel__title">{{ $t('Active cards') }} <small>{{ shownActiveCount }}</small></h3>
      <div class="hand-cards-panel__cards">
        <div v-for="card in activeCards" :key="card.name" class="cardbox" :class="visibilityClass(card)">
          <Card :card="card" :actionUsed="isCardActivated(card, thisPlayer)" :cubeColor="thisPlayer.color"/>
        </div>
      </div>
    </section>
    <section v-if="shownHandCount > 0" class="hand-cards-panel__section hand-cards-panel__section--hand">
      <div v-if="hasSeveralSections" class="hand-cards-panel__header">
        <h3 class="hand-cards-panel__title">{{ $t('Cards In Hand') }} <small>{{ shownHandCount }}</small></h3>
      </div>
      <SortableCards :playerId="playerView.id" :cards="handCards" :visibility="visibility"/>
    </section>
    <section v-if="undergroundTokens" class="hand-cards-panel__section hand-cards-panel__section--underground">
      <h3 class="hand-cards-panel__title">{{ $t('Claimed Underground Resource Tokens') }} <small>{{ thisPlayer.underworldData.tokens.length }}</small></h3>
      <UndergroundTokens :underworldData="thisPlayer.underworldData"/>
    </section>
    <section v-if="shownPlayedCount > 0" class="hand-cards-panel__section hand-cards-panel__section--played">
      <div v-if="hasSeveralSections" class="hand-cards-panel__header">
        <h3 class="hand-cards-panel__title">{{ $t('Played Cards') }} <small>{{ shownPlayedCount }}</small></h3>
      </div>
      <PlayedCardsGroups class="hand-cards-panel__cards" :player="thisPlayer" :visibility="visibility" :sortOrder="handSortOrder()" withoutActiveCards/>
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
import PlayedCardsGroups from '@/client/components/PlayedCardsGroups.vue';
import {CardModel} from '@/common/models/CardModel';
import {CardFilterContext, resetCardFilter} from '@/client/utils/cardFilter';
import {cardVisibility, CardVisibility, handCardFilter} from '@/client/utils/cardFilterState';
import {playableProjectCards} from '@/client/utils/playableCards';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {allCardsInHand} from '@/client/utils/handCards';
import {handSortOrder} from '@/client/utils/handSort';
import {ownActiveCards} from '@/client/utils/ownActiveCards';
import {ownPlayedCardsWithoutActive} from '@/client/utils/ownPlayedCards';
import {isCardActivated} from '@/client/utils/CardUtils';

const props = defineProps<{
  playerView: PlayerViewModel;
  // Mobile shows the claimed underground tokens on the Mars screen instead
  hideUndergroundTokens?: boolean;
}>();

const thisPlayer = computed(() => props.playerView.thisPlayer);
const activeCards = computed(() => ownActiveCards(props.playerView));
const handCards = computed(() => allCardsInHand(props.playerView));
// Played cards except the active ones, which have their own section at the top
const playedCards = computed(() => ownPlayedCardsWithoutActive(props.playerView));
// Everything the one filter row works on (option counts in the filter menu)
const allCards = computed(() => [...activeCards.value, ...handCards.value, ...playedCards.value]);
const undergroundTokens = computed(() => !props.hideUndergroundTokens && thisPlayer.value.underworldData.tokens.length > 0);
// "Playable now" only while the player can play a project card (played cards never are)
const filterContext = computed((): CardFilterContext => ({playable: playableProjectCards(props.playerView), withCost: true}));

function visibility(card: CardModel): CardVisibility {
  return cardVisibility(card, handCardFilter, filterContext.value);
}

function visibilityClass(card: CardModel): string | undefined {
  const cardState = visibility(card);
  return cardState === 'shown' ? undefined : 'card-filter-' + cardState;
}

// Cards a section still shows (dimmed ones count, hidden ones don't): an emptied section disappears
function shownCount(cards: ReadonlyArray<CardModel>): number {
  return cards.filter((card) => visibility(card) !== 'hidden').length;
}

const shownActiveCount = computed(() => shownCount(activeCards.value));
const shownHandCount = computed(() => shownCount(handCards.value));
const shownPlayedCount = computed(() => shownCount(playedCards.value));
// Headings as soon as more than one section shares the box
const hasSeveralSections = computed(() =>
  [shownActiveCount.value > 0, shownHandCount.value > 0, undergroundTokens.value, shownPlayedCount.value > 0].filter(Boolean).length > 1);

const nothingShown = computed(() => allCards.value.length > 1 && shownCount(allCards.value) === 0);
</script>
