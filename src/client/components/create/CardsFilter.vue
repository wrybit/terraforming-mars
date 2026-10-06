<template>
    <div class="cards-filter">
        <div class="create-game-card-head">
            <h2 v-i18n>{{ title }}</h2>
            <span v-if="selected.length" class="create-game-count">{{ selected.length }}</span>
        </div>
        <div class="cards-filter-input">
            <input ref="filter" class="create-game-text-input" :placeholder="$t(hint)" v-model="searchTerm"
                @keydown.down.prevent="moveActive(1)" @keydown.up.prevent="moveActive(-1)" @keydown.enter.prevent="addActive">
            <!-- Matches as cards in one row; click or Enter adds, arrow keys move the highlight -->
            <CardPreviewGrid v-if="searchMatches.length" class="cards-filter-suggest" :names="searchMatches" row selectable
                :activeName="activeCard" @hover="activeIndex = searchMatches.indexOf($event)" @select="addCard"/>
        </div>
        <CardPreviewGrid v-if="selected.length" class="cards-filter-selected" :names="selected" removable @remove="removeCard"/>
    </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {CardName} from '@/common/cards/CardName';
import CardPreviewGrid from './CardPreviewGrid.vue';
import {byType, getCards} from '@/client/cards/ClientCardManifest';
import {CardType} from '@/common/cards/CardType';
import {inplaceRemove, toName} from '@/common/utils/utils';

const ALL_CARDS: Array<CardName> = [
  ...getCards(byType(CardType.AUTOMATED)),
  ...getCards(byType(CardType.ACTIVE)),
  ...getCards(byType(CardType.EVENT)),
  ...getCards(byType(CardType.CEO)),
].map(toName)
  .sort((a, b) => a.localeCompare(b));


type CardsFilterModel = {
  selected: Array<CardName>;
  searchMatches: Array<CardName>;
  searchTerm: string;
  // Highlighted match: added with Enter and shown as the preview
  activeIndex: number;
}

type Refs = {
  filter: HTMLInputElement;
};

export default defineComponent({
  name: 'CardsFilter',
  props: {
    title: {
      type: String,
      required: true,
    },
    hint: {
      type: String,
      required: true,
    },
  },
  data(): CardsFilterModel {
    return {
      selected: [],
      searchMatches: [],
      searchTerm: '',
      activeIndex: 0,
    };
  },
  components: {
    CardPreviewGrid,
  },
  computed: {
    typedRefs(): Refs {
      return this.$refs as unknown as Refs;
    },
    activeCard(): CardName | undefined {
      return this.searchMatches[this.activeIndex];
    },
  },
  methods: {
    moveActive(step: number) {
      const count = this.searchMatches.length;
      if (count > 0) {
        this.activeIndex = (this.activeIndex + step + count) % count;
      }
    },
    addActive() {
      if (this.activeCard !== undefined) {
        this.addCard(this.activeCard);
      }
    },
    removeCard(cardName: CardName) {
      inplaceRemove(this.selected, cardName);
    },
    addCard(cardName: CardName) {
      if (this.selected.includes(cardName)) {
        return;
      }
      this.selected.push(cardName);
      this.selected.sort();
      this.searchTerm = '';
      this.typedRefs.filter.focus();
    },
  },
  watch: {
    selected: {
      handler(value) {
        this.$emit('cards-list-changed', value);
      },
      deep: true,
    },
    searchTerm(value: string) {
      this.searchMatches = [];
      this.activeIndex = 0;

      // Allows multiple simultaneous entries
      // This is case sensitive, as opposed to the standard search
      if (value.indexOf(',') !== -1) {
        const cardNames = new Set(value.split(',').map((c) => c.trim()));
        for (const item of ALL_CARDS) {
          if (cardNames.has(item)) {
            this.addCard(item);
          }
        }
        return;
      }

      if (value === '') {
        return;
      }

      const searchTermLowercase = value.toLowerCase();
      for (const candidate of ALL_CARDS) {
        if (candidate.toLowerCase().indexOf(searchTermLowercase) >= 0) {
          this.searchMatches.push(candidate);
        }
        if (this.searchMatches.length === 8) {
          return;
        }
      }
    },
  },
  mounted() {
    this.typedRefs.filter.focus();
  },
});
</script>
