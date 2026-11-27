<template>
  <!-- Generic on/off switch with a short label (passed already translated). Without a label the text sits elsewhere
       and points here with <label for="inputId">, e.g. a settings row of the admin page; "large" fits such rows -->
  <label :class="['toggle-switch', {'toggle-switch--large': size === 'large'}]">
    <span v-if="label !== ''" class="toggle-switch-label">{{ label }}</span>
    <input :id="inputId" type="checkbox" role="switch" name="toggle-switch" class="toggle-switch-input"
      :checked="modelValue" :aria-checked="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)">
    <span class="toggle-switch-track" aria-hidden="true"><span class="toggle-switch-thumb"></span></span>
  </label>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';

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
      default: '',
    },
    inputId: {
      type: String,
      default: undefined,
    },
    size: {
      type: String as PropType<'small' | 'large'>,
      default: 'small',
    },
  },
});
</script>
