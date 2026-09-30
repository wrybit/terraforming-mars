<template>
  <span class="create-game-stepper">
    <button type="button" :disabled="value <= min" @click="change(-step)" aria-label="-">−</button>
    <span class="create-game-stepper-value">{{ value }}</span>
    <button type="button" :disabled="value >= max" @click="change(step)" aria-label="+">+</button>
  </span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// Zahl mit −/+ statt Zahlenfeld: auf Touch-Geräten ohne Tastatur bedienbar und schmal
export default defineComponent({
  name: 'NumberStepper',
  emits: ['update:modelValue'],
  props: {
    // Alte gespeicherte Einstellungen können den Wert noch als Text enthalten (früher Zahlenfeld)
    modelValue: {
      type: [Number, String],
      required: true,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 10,
    },
    step: {
      type: Number,
      default: 1,
    },
  },
  computed: {
    value(): number {
      return Number(this.modelValue);
    },
  },
  methods: {
    change(delta: number) {
      this.$emit('update:modelValue', Math.min(this.max, Math.max(this.min, this.value + delta)));
    },
  },
});
</script>
