<template>
  <!-- Erklärung oben in einer Tab-Box (tabIntro.ts): Plättchen- oder Ressourcenbild, Frage und Hinweis.
       Genutzt vom Aktionsmenü (OrOptions) und von einzelnen Eingaben (WaitingForTabs). -->
  <div :class="['or-tab-intro', {'card-intro': card !== undefined}]">
    <!-- Löst eine Karte das aus (z. B. Stadt legen durch Kartenwirkung): Karte vorn, ihr Name über der Frage -->
    <SourceCardThumbnail v-if="card !== undefined" :card="card"/>
    <div v-if="intro.tile !== undefined" class="or-tab-intro-tile">
      <img class="or-tab-intro-tile-base" :src="intro.tile.base" alt="">
      <img v-if="intro.tile.symbol !== undefined" class="or-tab-intro-tile-symbol" :src="intro.tile.symbol" alt="">
    </div>
    <i v-if="intro.resourceIcon !== undefined" :class="'resource_icon or-tab-intro-resource resource_icon--' + intro.resourceIcon"></i>
    <div>
      <div v-if="card !== undefined" class="or-tab-intro-title card-intro-name">{{ $t(card) }}</div>
      <div class="or-tab-intro-title">{{ $t(title) }}</div>
      <div v-if="intro.hint === 'click-space'" class="or-tab-intro-hint" v-i18n>Click a highlighted space on Mars</div>
      <div v-for="(fact, idx) in introFacts(intro, playerView)" :key="idx" class="or-tab-intro-hint">{{ $t(fact) }}</div>
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
  // Karte, deren Wirkung die Eingabe auslöst (inputSourceCard.ts); ohne Karte wie bisher nur Bild und Frage
  card?: CardName;
}>();
</script>
