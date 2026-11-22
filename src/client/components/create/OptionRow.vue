<template>
  <div class="create-game-option" :class="{'create-game-option--sub': sub}" @click="toggleSwitch">
    <span class="create-game-option-name">
      <span v-if="iconClass" :class="'create-game-expansion-icon ' + iconClass"></span>
      <span v-i18n>{{ label }}</span>
      <AiCanMark v-if="aiCan" />
      <InfoLink v-if="href" :href="href" />
    </span>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import InfoLink from './InfoLink.vue';
import AiCanMark from './AiCanMark.vue';

// One setting: name (with icon and info link) on the left, control on the right
export default defineComponent({
  name: 'OptionRow',
  components: {InfoLink, AiCanMark},
  props: {
    label: {
      type: String,
      required: true,
    },
    href: {
      type: String,
      required: false,
    },
    iconClass: {
      type: String,
      required: false,
    },
    // True: the AI can play this (robot behind the name)
    aiCan: {
      type: Boolean,
      default: false,
    },
    // Sub-option of another setting: indented
    sub: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    // Larger target (Fitts): a click anywhere on a row with a switch toggles it;
    // clicks on the switch itself, links or other controls keep their own behavior
    toggleSwitch(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.closest('input, button, a, select, label') !== null) {
        return;
      }
      (this.$el as HTMLElement).querySelector<HTMLInputElement>('.create-game-switch')?.click();
    },
  },
});
</script>
