<template>
  <!-- Wiki link: opens a short info box at the bottom of its card; other links open in a new tab as before -->
  <button v-if="wikiTarget !== undefined" ref="button" type="button" class="create-game-info"
    :class="{'create-game-info--open': isOpen}" :aria-expanded="isOpen" :aria-label="$t('Info')" :title="$t('Info')" @click.stop="toggle" @keydown.enter.stop @keydown.space.stop>&#9432;</button>
  <a v-else :href="href" class="tooltip create-game-info" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank" @click.stop>&#9432;</a>
  <Teleport v-if="isOpen && container !== undefined" :to="container">
    <InfoBox :href="href" :target="wikiTarget!" :noseX="noseX" @close="openInfoHref = undefined"/>
  </Teleport>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import InfoBox from './InfoBox.vue';
import {openInfoHref} from './infoBoxState';
import {parseWikiUrl, WikiTarget} from './wikiContent';

// Cards the info box is appended to (at their end, below all rows)
const CONTAINER_SELECTOR = '.create-game-card, .create-game-players, .create-game--block';

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
      container: undefined as HTMLElement | undefined,
      // Horizontal position of the button inside the card: the box's nose points at it
      noseX: 0,
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
  methods: {
    toggle() {
      if (this.isOpen) {
        this.openInfoHref = undefined;
        return;
      }
      const button = this.$refs.button as HTMLElement;
      const container = button.closest<HTMLElement>(CONTAINER_SELECTOR) ?? undefined;
      if (container !== undefined) {
        const buttonRect = button.getBoundingClientRect();
        this.noseX = buttonRect.left + buttonRect.width / 2 - container.getBoundingClientRect().left;
      }
      this.container = container;
      this.openInfoHref = this.href;
    },
  },
});
</script>
