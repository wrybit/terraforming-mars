<template>
  <!-- Short info from the wiki at the end of the card, its nose points at the ⓘ that opened it -->
  <div class="create-game-info-box" :style="{'--nose-x': noseX + 'px'}">
    <p class="create-game-info-box-text">
      <span v-if="excerpt !== undefined">{{ excerpt }}</span>
      <span v-else-if="failed" v-i18n>The info could not be loaded.</span>
      <span v-else class="create-game-info-box-loading">…</span>
    </p>
    <div class="create-game-info-box-actions">
      <span class="create-game-info-box-anchor">
        <button type="button" class="create-game-small-button create-game-info-box-more" @click="overlayOpen = true">
          <span v-i18n>Full info</span>
          <!-- Opens a page (as an overlay) -->
          <svg class="create-game-info-box-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>
        </button>
        <WikiOverlay :open="overlayOpen" :href="href" :target="target" @close="overlayOpen = false"/>
      </span>
      <button type="button" class="create-game-info-box-close" :aria-label="$t('Close')" @click="$emit('close')">✕</button>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import WikiOverlay from './WikiOverlay.vue';
import {fetchWikiPage, WikiTarget, wikiExcerpt, wikiSection} from './wikiContent';

export default defineComponent({
  name: 'InfoBox',
  components: {WikiOverlay},
  emits: ['close'],
  props: {
    href: {type: String, required: true},
    target: {type: Object as PropType<WikiTarget>, required: true},
    noseX: {type: Number, default: 0},
  },
  data() {
    return {
      excerpt: undefined as string | undefined,
      failed: false,
      overlayOpen: false,
    };
  },
  async mounted() {
    try {
      const markdown = await fetchWikiPage(this.target.page);
      this.excerpt = wikiExcerpt(wikiSection(markdown, this.target.anchor));
    } catch (error) {
      console.error(error);
      this.failed = true;
    }
  },
});
</script>
