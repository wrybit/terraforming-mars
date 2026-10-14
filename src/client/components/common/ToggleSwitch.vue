<template>
  <!-- Generic on/off switch with a short label; the label is passed already translated -->
  <label class="toggle-switch">
    <span class="toggle-switch-label">{{ label }}</span>
    <input type="checkbox" role="switch" class="toggle-switch-input"
      :checked="modelValue" :aria-checked="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)">
    <span class="toggle-switch-track" aria-hidden="true"><span class="toggle-switch-thumb"></span></span>
  </label>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'ToggleSwitch',
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
});
</script>
