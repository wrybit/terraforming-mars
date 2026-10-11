<template>
  <div class="card-list-cards">
    <!-- Only cards near the visible area are built (LazyMount.vue); the others keep their place as an empty card shape -->
    <LazyMount class="cardbox" v-for="card in names" :key="card" v-memo="[card, tallCards]" @shown="$emit('cardsShown')">
      <Card :card="{'name': card}" :autoTall="tallCards"/>
      <template #placeholder>
        <div class="card-list-placeholder" :style="placeholderStyle"></div>
      </template>
    </LazyMount>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {CardName} from '@/common/cards/CardName';
import Card from '@/client/components/card/Card.vue';
import LazyMount from '@/client/components/common/LazyMount.vue';
import {CardBoxSize} from '@/client/components/cardlist/cardListOptions';

// Room above every card for the cost coin and tags that stick out (card_list.less .card-list-cards .card-container)
const CARD_TOP_MARGIN = 15;

// Card grid of one card list section. Its own component so v-memo sits directly on the card loop:
// that way, when typing in the search, only newly added cards are rendered, not all of them.
export default defineComponent({
  name: 'CardListCardGrid',
  components: {Card, LazyMount},
  props: {
    names: {type: Array as PropType<ReadonlyArray<CardName>>, required: true},
    tallCards: {type: Boolean, required: true},
    // Size of one card box in this section, so the empty shapes take exactly the cards' place
    boxSize: {type: Object as PropType<CardBoxSize>, required: true},
  },
  // cardsShown: cards came into view and were built (the list then highlights search hits in them)
  emits: ['cardsShown'],
  computed: {
    placeholderStyle(): Record<string, string> {
      return {width: this.boxSize.width + 'px', height: (this.boxSize.height - CARD_TOP_MARGIN) + 'px'};
    },
  },
});

</script>
