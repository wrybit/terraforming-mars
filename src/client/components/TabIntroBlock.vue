<template>
  <!-- Explanation at the top of a tab box (tabIntro.ts): tile or resource image, question and hint.
       Used by the action menu (OrOptions) and by individual inputs (WaitingForTabs). -->
  <div :class="['or-tab-intro', {'card-intro': card !== undefined}]">
    <!-- If a card triggers this (e.g. place city via card effect): card in front, its name above the question -->
    <SourceCardThumbnail v-if="card !== undefined" :card="card"/>
    <div v-if="intro.tile !== undefined" class="or-tab-intro-tile">
      <img class="or-tab-intro-tile-base" :src="intro.tile.base" alt="">
      <img v-if="intro.tile.symbol !== undefined" class="or-tab-intro-tile-symbol" :src="intro.tile.symbol" alt="">
    </div>
    <i v-if="intro.resourceIcon !== undefined" :class="'resource_icon or-tab-intro-resource resource_icon--' + intro.resourceIcon"></i>
    <div>
      <div v-if="card !== undefined" class="or-tab-intro-title card-intro-name">{{ $t(card) }}</div>
      <!-- Final greenery: make clear that the game is in its last step -->
      <div v-if="intro.finale === true" class="or-tab-intro-finale" v-i18n>Mars is terraformed</div>
      <div class="or-tab-intro-title">{{ $t(title) }}</div>
      <!-- Game state first, the instruction last: it leads straight into the click -->
      <div v-for="(fact, idx) in introFacts(intro, playerView)" :key="idx" class="or-tab-intro-hint">{{ $t(fact) }}</div>
      <div v-if="intro.hint === 'click-space'" class="or-tab-intro-hint" v-i18n>Click a highlighted space on Mars</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {Message} from '@/common/logs/Message';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardName} from '@/common/cards/CardName';
import {introFacts, TabIntro} from '@/client/components/tabIntro';
import SourceCardThumbnail from '@/client/components/SourceCardThumbnail.vue';

defineProps<{
  intro: TabIntro;
  title: string | Message;
  playerView: PlayerViewModel;
  // Card whose effect triggers the input (inputSourceCard.ts); without a card only image and question as before
  card?: CardName;
}>();
</script>
