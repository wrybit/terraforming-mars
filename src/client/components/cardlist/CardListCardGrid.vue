<template>
  <div class="card-list-cards">
    <div class="cardbox" v-for="card in names" :key="card" v-memo="[card, tallCards]">
      <Card :card="{'name': card}" :autoTall="tallCards"/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {CardName} from '@/common/cards/CardName';
import Card from '@/client/components/card/Card.vue';

// Kartenraster eines Abschnitts der Kartenliste. Eigene Komponente, damit v-memo direkt an der Kartenschleife sitzt:
// beim Tippen in der Suche werden so nur neu hinzukommende Karten gerendert, nicht alle.
export default defineComponent({
  name: 'CardListCardGrid',
  components: {Card},
  props: {
    names: {type: Array as PropType<ReadonlyArray<CardName>>, required: true},
    tallCards: {type: Boolean, required: true},
  },
});
</script>
