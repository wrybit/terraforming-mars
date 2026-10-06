<template>
  <!-- Short info from the wiki below the row of its ⓘ; the nose points at it, a second click on the ⓘ closes it -->
  <div class="create-game-info-box" :style="{'--nose-x': noseX + 'px'}">
    <!-- Button at the bottom right, the text flows around it (spacer float in create_game_form.less) -->
    <div class="create-game-info-box-text">
      <span class="create-game-info-box-anchor">
        <button type="button" class="create-game-small-button create-game-info-box-more" @click="overlayOpen = true">
          <span v-i18n>Full info</span>
          <!-- Opens a page (as an overlay) -->
          <svg class="create-game-info-box-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>
        </button>
        <WikiOverlay :open="overlayOpen" :href="href" :target="target" @close="overlayOpen = false"/>
      </span>
      <span v-if="excerpt !== undefined">{{ excerpt }}</span>
      <span v-else-if="failed" v-i18n>The info could not be loaded.</span>
      <span v-else class="create-game-info-box-loading">…</span>
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
  props: {
    href: {type: String, required: true},
    target: {type: Object as PropType<WikiTarget>, required: true},
    // The ⓘ that opened the box: the nose always points at its center
    anchor: {type: Object as PropType<HTMLElement>, required: true},
  },
  data() {
    return {
      excerpt: undefined as string | undefined,
      failed: false,
      overlayOpen: false,
      // Center of the ⓘ, measured from the box's left edge
      noseX: 0,
      resizeObserver: undefined as ResizeObserver | undefined,
    };
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.placeNose);
  },
  methods: {
    // Measured again whenever the box or the page changes size, so the nose never points beside the ⓘ
    placeNose() {
      const anchorRect = this.anchor.getBoundingClientRect();
      this.noseX = anchorRect.left + anchorRect.width / 2 - (this.$el as HTMLElement).getBoundingClientRect().left;
    },
  },
  async mounted() {
    this.placeNose();
    window.addEventListener('resize', this.placeNose);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.placeNose());
      this.resizeObserver.observe(this.$el as HTMLElement);
      this.resizeObserver.observe(this.anchor);
    }
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
