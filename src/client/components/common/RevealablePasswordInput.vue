<template>
  <!-- Password field with an eye button: revealing and hiding crossfades character by character -->
  <div class="revealable-password" :class="{'revealable-password--shown': shown}">
    <input ref="input" :value="displayed" :type="inputType" :readonly="animating" :class="inputClass"
      :placeholder="placeholder" :aria-label="ariaLabel" autocomplete="current-password" :autofocus="autofocus"
      @input="onInput">
    <button type="button" class="revealable-password-eye" :aria-pressed="shown" :aria-label="$t(shown ? 'Hide password' : 'Show password')" :title="$t(shown ? 'Hide password' : 'Show password')" @click="toggle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <template v-if="shown">
          <path d="M3 3l18 18"/>
          <path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c6.5 0 10 7 10 7a15.9 15.9 0 0 1-3.4 4.1M6.5 6.6A15.8 15.8 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.3-1"/>
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
        </template>
        <template v-else>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
          <circle cx="12" cy="12" r="3"/>
        </template>
      </svg>
    </button>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

const MASK = '•';
// Whole crossfade, however long the password: quick, but still visible as a movement
export const REVEAL_DURATION_MS = 300;

/** The first |count| characters readable, the rest masked */
export function partlyRevealed(text: string, count: number): string {
  return Array.from(text, (character, index) => index < count ? character : MASK).join('');
}

type DataModel = {
  shown: boolean,
  animating: boolean,
  displayed: string,
  frame: number | undefined,
};

export default defineComponent({
  name: 'RevealablePasswordInput',
  props: {
    modelValue: {type: String, required: true},
    placeholder: {type: String, default: ''},
    ariaLabel: {type: String, default: ''},
    inputClass: {type: String, default: ''},
    autofocus: {type: Boolean, default: false},
  },
  emits: ['update:modelValue'],
  data(): DataModel {
    return {shown: false, animating: false, displayed: this.modelValue, frame: undefined};
  },
  computed: {
    // At rest the browser's own field (hidden or plain text), so typing and password managers work as usual;
    // only during the animation a text field shows the mix of real characters and dots
    inputType(): string {
      return this.shown || this.animating ? 'text' : 'password';
    },
  },
  watch: {
    modelValue(value: string) {
      if (!this.animating) {
        this.displayed = value;
      }
    },
  },
  beforeUnmount() {
    window.cancelAnimationFrame(this.frame ?? 0);
  },
  methods: {
    onInput(event: Event): void {
      this.displayed = (event.target as HTMLInputElement).value;
      this.$emit('update:modelValue', this.displayed);
    },
    toggle(): void {
      if (this.animating) {
        return;
      }
      const show = !this.shown;
      this.shown = show;
      const text = this.modelValue;
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
      if (text.length === 0 || reducedMotion) {
        this.settle();
        return;
      }
      // Characters revealed (or masked again) in proportion to the elapsed time, one frame at a time
      this.animating = true;
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / REVEAL_DURATION_MS);
        const count = Math.round((show ? progress : 1 - progress) * text.length);
        this.displayed = partlyRevealed(text, count);
        if (progress < 1) {
          this.frame = window.requestAnimationFrame(step);
        } else {
          this.settle();
        }
      };
      this.displayed = partlyRevealed(text, show ? 0 : text.length);
      this.frame = window.requestAnimationFrame(step);
    },
    settle(): void {
      window.cancelAnimationFrame(this.frame ?? 0);
      this.frame = undefined;
      this.animating = false;
      this.displayed = this.modelValue;
      (this.$refs.input as HTMLInputElement | undefined)?.focus();
    },
  },
});
</script>
