<template>
  <div
    role="button"
    tabindex="0"
    class="create-game-chip"
    :class="{'create-game-chip--selected': selected, 'create-game-chip--locked': locked}"
    :aria-pressed="selected"
    :aria-disabled="locked"
    :title="tooltip ?? translatedLabel"
    @click="select()"
    @keydown.enter.prevent="select()"
    @keydown.space.prevent="select()">
    <slot name="icon"><span v-if="iconClass" :class="'create-game-expansion-icon ' + iconClass"></span></slot>
    <!-- With a detail line (expansions: what they add) name and detail stack, tight together -->
    <span v-if="$slots.detail" class="create-game-chip-text">
      <span class="create-game-chip-label" :class="{capitalized}">{{ translatedLabel }}</span>
      <span class="create-game-chip-detail"><slot name="detail"></slot></span>
    </span>
    <span v-else class="create-game-chip-label" :class="{capitalized}">{{ translatedLabel }}</span>
    <slot></slot>
    <InfoLink v-if="href" :href="href"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {translateText} from '@/client/directives/i18n';
import InfoLink from './InfoLink.vue';

// Selectable tile (expansion, game board, filter). Not a <button>, because it may contain an info link
export default defineComponent({
  name: 'ChoiceChip',
  components: {InfoLink},
  emits: ['select'],
  props: {
    label: {
      type: String,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    iconClass: {
      type: String,
      required: false,
    },
    href: {
      type: String,
      required: false,
    },
    // Fixed choice (base game): shown, but clicking does nothing
    locked: {
      type: Boolean,
      default: false,
    },
    // Hover text instead of the label, e.g. why the tile was selected along with another one
    tooltip: {
      type: String,
      required: false,
    },
    // Game board names come lowercase from the enum
    capitalized: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    select() {
      if (!this.locked) {
        this.$emit('select');
      }
    },
  },
  computed: {
    translatedLabel(): string {
      return translateText(this.label);
    },
  },
});
</script>
