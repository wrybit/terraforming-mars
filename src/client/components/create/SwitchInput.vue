<template>
  <input type="checkbox" class="create-game-switch" :checked="modelValue" :aria-label="ariaLabel" @change="onChange">
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// On/off switch; remains a real checkbox (keyboard, screen reader) and is just drawn differently
export default defineComponent({
  name: 'SwitchInput',
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    ariaLabel: {
      type: String,
      required: false,
    },
  },
  methods: {
    onChange(event: Event) {
      this.$emit('update:modelValue', (event.target as HTMLInputElement).checked);
    },
  },
});
</script>
