<template>
  <!-- Split variant is already translated: tm-has-i18n keeps a v-i18n of a parent from translating (and trimming) it again -->
  <div v-if="split === undefined" class="card-description" :class="alignClasses">(<span v-i18n>{{ description }}</span>)</div>
  <div v-else class="card-description card-description-split" :class="[alignClasses, compactClass]" tm-has-i18n="true">
    <div v-if="split.main !== ''">({{ split.main }})</div>
    <div v-if="split.note !== undefined" class="card-asterisk-note">
      <span class="card-asterisk-note-star">*</span>
      <span><template v-for="(segment, index) in split.note" :key="index"><mark v-if="segment.emphasis">{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template></span>
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent, nextTick, PropType} from 'vue';
import {isDescription} from '@/common/cards/render/CardRenderDescription';
import {translateText} from '@/client/directives/i18n';
import {ASTERISK_NOTES} from '@/client/cards/asteriskNotes';
import {SplitDescription, splitAsteriskNote} from '@/client/cards/splitAsteriskNote';

// Steps of a smaller type when main text and note do not fit into the card (dense cards in long languages)
const COMPACT_CLASSES = ['', 'card-description-compact', 'card-description-compact-more'];

export default defineComponent({
  name: 'CardDescription',
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
      if (this.split === undefined) {
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
      const cardBottom = card.getBoundingClientRect().bottom;
      // The lowest content counts, not only this text: a note in an effect box pushes the rows below it down
      const contentBottom = Math.max(...Array.from(card.querySelectorAll('.card-content .card-description, .card-content .card-row'))
        .map((content) => content.getBoundingClientRect().bottom));
      // Hidden cards measure 0: nothing to fit
      return cardBottom > 0 && contentBottom > cardBottom - 4;
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
    // Texts with a "*" rule: main text and highlighted note, already translated
    split(): SplitDescription | undefined {
      const restructured = ASTERISK_NOTES[this.description.replace(/\s+/g, ' ').trim()];
      return restructured === undefined ? undefined : splitAsteriskNote(translateText(restructured));
    },
  },
});

</script>
