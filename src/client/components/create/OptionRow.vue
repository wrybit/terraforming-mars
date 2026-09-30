<template>
  <div class="create-game-option" :class="{'create-game-option--sub': sub}">
    <span class="create-game-option-name">
      <span v-if="iconClass" :class="'create-game-expansion-icon ' + iconClass"></span>
      <span v-i18n>{{ label }}</span>
      <InfoLink v-if="href" :href="href"/>
    </span>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import InfoLink from './InfoLink.vue';

// Eine Einstellung: Name (mit Icon und Info-Link) links, Bedienelement rechts
export default defineComponent({
  name: 'OptionRow',
  components: {InfoLink},
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
    // Unteroption einer anderen Einstellung: eingerückt
    sub: {
      type: Boolean,
      default: false,
    },
  },
});
</script>
