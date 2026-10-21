<template>
  <!-- Marked-up variant is already translated: tm-has-i18n keeps a v-i18n of a parent from translating (and trimming) it again -->
  <div v-if="parts === undefined" class="card-description" :class="alignClasses">(<span v-i18n>{{ description }}</span>)</div>
  <div v-else class="card-description card-description-split" :class="[alignClasses, compactClass]" tm-has-i18n="true">
    <div v-if="parts.main.length > 0">(<CardTextSegments :segments="parts.main"/>)</div>
    <div v-if="parts.note !== undefined" class="card-asterisk-note">
      <span class="card-asterisk-note-star">*</span>
      <CardTextSegments :segments="parts.note"/>
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent, nextTick, PropType} from 'vue';
import {isDescription} from '@/common/cards/render/CardRenderDescription';
import {translateText} from '@/client/directives/i18n';
import {CARD_TEXT_MARKUP} from '@/client/cards/cardTextMarkup';
import {CardTextParts, parseCardTextMarkup} from '@/client/cards/parseCardTextMarkup';
import CardTextSegments from '@/client/components/card/CardTextSegments.vue';
import {contentOverflowsCard} from '@/client/components/card/cardFit';

// Steps of a smaller type when main text and note do not fit into the card (dense cards in long languages)
const COMPACT_CLASSES = ['', 'card-description-compact', 'card-description-compact-more'];

export default defineComponent({
  name: 'CardDescription',
  components: {
    CardTextSegments,
  },
  data() {
    return {
      compactLevel: 0,
    };
  },
  mounted() {
    this.fitIntoCard();
  },
  watch: {
    item() {
      this.fitIntoCard();
    },
  },
  methods: {
    // The note adds a little height; on cards that were already full this pushes the text out at the bottom.
    // Measured instead of guessed, because it depends on the language and the card.
    async fitIntoCard(): Promise<void> {
      this.compactLevel = 0;
      if (this.parts === undefined) {
        return;
      }
      await nextTick();
      while (this.compactLevel < COMPACT_CLASSES.length - 1 && this.overflowsCard()) {
        this.compactLevel++;
        await nextTick();
      }
    },
    overflowsCard(): boolean {
      const element = this.$el as HTMLElement | undefined;
      const card = element?.closest?.('.card-container');
      if (element === undefined || card === null || card === undefined) {
        return false;
      }
      return contentOverflowsCard(card);
    },
  },
  props: {
    item: {
      type: [String, Object] as PropType<unknown>,
      required: true,
    },
  },
  computed: {
    alignClasses() {
      const classes = [];
      if (isDescription(this.item)) {
        if (this.item.align !== 'center') {
          // we want to reduce size for aligned left of right to 60%
          classes.push('card-description-aligned');
        }
        classes.push('card-description-align--' + this.item.align);
      }
      return classes;
    },
    description(): string {
      return isDescription(this.item) ? this.item.text : String(this.item);
    },
    compactClass(): string {
      return COMPACT_CLASSES[this.compactLevel];
    },
    // Marked-up texts ("*" rule note, opponent words): segments, already translated
    parts(): CardTextParts | undefined {
      const markedUp = CARD_TEXT_MARKUP[this.description.replace(/\s+/g, ' ').trim()];
      return markedUp === undefined ? undefined : parseCardTextMarkup(translateText(markedUp));
    },
  },
});

</script>
