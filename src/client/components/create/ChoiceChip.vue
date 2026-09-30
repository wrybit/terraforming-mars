<template>
  <div
    role="button"
    tabindex="0"
    class="create-game-chip"
    :class="{'create-game-chip--selected': selected}"
    :aria-pressed="selected"
    :title="translatedLabel"
    @click="$emit('select')"
    @keydown.enter.prevent="$emit('select')"
    @keydown.space.prevent="$emit('select')">
    <slot name="icon"><span v-if="iconClass" :class="'create-game-expansion-icon ' + iconClass"></span></slot>
    <span class="create-game-chip-label" :class="{capitalized}">{{ translatedLabel }}</span>
    <slot></slot>
    <InfoLink v-if="href" :href="href"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {translateText} from '@/client/directives/i18n';
import InfoLink from './InfoLink.vue';

// Wählbare Kachel (Erweiterung, Spielbrett, Filter). Kein <button>, weil darin ein Info-Link stecken darf
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
    // Spielbrett-Namen kommen klein geschrieben aus dem Enum
    capitalized: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    translatedLabel(): string {
      return translateText(this.label);
    },
  },
});
</script>
