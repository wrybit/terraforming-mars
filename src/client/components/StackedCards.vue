<template>
    <div class="cardbox">
        <div v-for="(card, index) in shownCards" :key="card.name"
          :class="{'cards-stack': index > 0, 'cards-stack-first': index === 0, 'card-filter-dimmed': visibilityOf(card) === 'dimmed'}">
            <Card :card="card" />
        </div>
    </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardModel} from '@/common/models/CardModel';
import {CardVisibility} from '@/client/utils/cardFilterState';

export default defineComponent({
  name: 'StackedCards',
  props: {
    cards: {
      type: Array as () => ReadonlyArray<CardModel>,
      required: true,
    },
    // Card filter (played cards): hidden cards drop out of the stack, dimmed ones stay in place
    visibility: {
      type: Function as unknown as () => (card: CardModel) => CardVisibility,
      required: false,
    },
  },
  computed: {
    shownCards(): ReadonlyArray<CardModel> {
      return this.cards.filter((card) => this.visibilityOf(card) !== 'hidden');
    },
  },
  methods: {
    visibilityOf(card: CardModel): CardVisibility {
      return this.visibility?.(card) ?? 'shown';
    },
  },
  components: {
    Card,
  },
});

</script>

