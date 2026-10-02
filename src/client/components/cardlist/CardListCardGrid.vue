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

// Card grid of one card list section. Its own component so v-memo sits directly on the card loop:
// that way, when typing in the search, only newly added cards are rendered, not all of them.
export default defineComponent({
  name: 'CardListCardGrid',
  components: {Card},
  props: {
    names: {type: Array as PropType<ReadonlyArray<CardName>>, required: true},
    tallCards: {type: Boolean, required: true},
  },
});
</script>
