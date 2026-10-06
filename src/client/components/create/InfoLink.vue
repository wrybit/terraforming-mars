<template>
  <!-- Wiki link: opens a short info box at the bottom of its card; other links open in a new tab as before -->
  <button v-if="wikiTarget !== undefined" ref="button" type="button" class="create-game-info"
    :class="{'create-game-info--open': isOpen}" :aria-expanded="isOpen" :aria-label="$t('Info')" :title="$t('Info')" @click.stop="toggle" @keydown.enter.stop @keydown.space.stop>&#9432;</button>
  <a v-else :href="href" class="tooltip create-game-info" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank" @click.stop>&#9432;</a>
  <Teleport v-if="isOpen && container !== undefined" :to="container">
    <InfoBox :href="href" :target="wikiTarget!" :anchor="$refs.button as HTMLElement"/>
  </Teleport>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import InfoBox from './InfoBox.vue';
import {openInfoHref} from './infoBoxState';
import {parseWikiUrl, WikiTarget} from './wikiContent';

// Row the info box opens below (between this row and the next)
const ROW_SELECTOR = '.create-game-option, .create-game-card-head, .create-game-subhead, .create-game-player-extra';

// click.stop so a click on it doesn't toggle the surrounding tile/option
export default defineComponent({
  name: 'InfoLink',
  components: {InfoBox},
  props: {
    href: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      // Slot inserted right after the row, the box is teleported into it
      container: undefined as HTMLElement | undefined,
    };
  },
  computed: {
    wikiTarget(): WikiTarget | undefined {
      return parseWikiUrl(this.href);
    },
    isOpen(): boolean {
      return openInfoHref.value === this.href;
    },
    openInfoHref: {
      get(): string | undefined {
        return openInfoHref.value;
      },
      set(value: string | undefined) {
        openInfoHref.value = value;
      },
    },
  },
  watch: {
    // Closed (also because another ⓘ opened): take the slot out of the row list again
    isOpen(open: boolean) {
      if (!open) {
        this.$nextTick(() => this.removeContainer());
      }
    },
  },
  beforeUnmount() {
    if (this.isOpen) {
      this.openInfoHref = undefined;
    }
    this.removeContainer();
  },
  methods: {
    removeContainer() {
      this.container?.remove();
      this.container = undefined;
    },
    toggle() {
      if (this.isOpen) {
        this.openInfoHref = undefined;
        return;
      }
      const button = this.$refs.button as HTMLElement;
      this.removeContainer();
      const container = document.createElement('div');
      container.className = 'create-game-info-slot';
      // Tile in a grid: right below the tile's visual row (after its last tile), across the whole grid
      const chip = button.closest<HTMLElement>('.create-game-chip');
      if (chip !== null && chip.parentElement?.classList.contains('create-game-chip-grid')) {
        const sameRow = Array.from(chip.parentElement.children).filter((tile) => (tile as HTMLElement).offsetTop === chip.offsetTop);
        container.classList.add('create-game-info-slot--grid');
        sameRow[sameRow.length - 1].insertAdjacentElement('afterend', container);
      } else {
        const row = button.closest<HTMLElement>(ROW_SELECTOR) ?? button.parentElement;
        row?.insertAdjacentElement('afterend', container);
      }
      this.container = container.isConnected ? container : undefined;
      this.openInfoHref = this.href;
    },
  },
});
</script>
