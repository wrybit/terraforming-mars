<template>
  <div class="create-game-segmented" role="radiogroup">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :class="{'create-game-segmented--selected': option.value === modelValue}"
      @click="$emit('update:modelValue', option.value)"
      v-i18n>{{ option.label }}</button>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {SegmentOption} from './createGameChoices';

// Exactly one of a few options (player count, milestones, agendas)
export default defineComponent({
  name: 'SegmentedControl',
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
