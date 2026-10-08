<template>
  <div class="create-game-segmented" role="radiogroup">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :class="{'create-game-segmented--selected': option.value === modelValue}"
      :disabled="option.disabled"
      :aria-label="option.icon !== undefined ? $t(option.label) : undefined"
      @click="$emit('update:modelValue', option.value)">
      <!-- With a symbol the label only names the button for screen readers -->
      <SeatIcon v-if="option.icon !== undefined" :kind="option.icon" :size="20"/>
      <span v-else v-i18n>{{ option.label }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {SegmentOption} from './createGameChoices';
import SeatIcon from './SeatIcon.vue';

// Exactly one of a few options (player count, milestones, agendas)
export default defineComponent({
  name: 'SegmentedControl',
  components: {SeatIcon},
  emits: ['update:modelValue'],
  props: {
    options: {
      type: Array as PropType<ReadonlyArray<SegmentOption>>,
      required: true,
    },
    modelValue: {
      type: [String, Number],
      required: true,
    },
  },
});
</script>
