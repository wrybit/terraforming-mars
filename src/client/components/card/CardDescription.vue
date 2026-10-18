<template>
  <!-- Split variant is already translated: tm-has-i18n keeps a v-i18n of a parent from translating (and trimming) it again -->
  <div v-if="split === undefined" class="card-description" :class="alignClasses">(<span v-i18n>{{ description }}</span>)</div>
  <div v-else class="card-description card-description-split" :class="alignClasses" tm-has-i18n="true">
    <div v-if="split.main !== ''">({{ split.main }})</div>
    <div v-if="split.note !== undefined" class="card-asterisk-note">
      <span class="card-asterisk-note-star">*</span>
      <span><template v-for="(segment, index) in split.note" :key="index"><mark v-if="segment.emphasis">{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template></span>
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent, PropType} from 'vue';
import {isDescription} from '@/common/cards/render/CardRenderDescription';
import {translateText} from '@/client/directives/i18n';
import {ASTERISK_NOTES} from '@/client/cards/asteriskNotes';
import {SplitDescription, splitAsteriskNote} from '@/client/cards/splitAsteriskNote';

export default defineComponent({
  name: 'CardDescription',
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
    // Texts with a "*" rule: main text and highlighted note, already translated
    split(): SplitDescription | undefined {
      const restructured = ASTERISK_NOTES[this.description.replace(/\s+/g, ' ').trim()];
      return restructured === undefined ? undefined : splitAsteriskNote(translateText(restructured));
    },
  },
});

</script>
