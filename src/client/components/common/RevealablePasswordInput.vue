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
// Time per character: fast enough to feel like one smooth crossfade, slow enough to be seen
const STEP_MS = 42;

/** The first |count| characters readable, the rest masked */
export function partlyRevealed(text: string, count: number): string {
  return Array.from(text, (character, index) => index < count ? character : MASK).join('');
}

type DataModel = {
  shown: boolean,
  animating: boolean,
  displayed: string,
  timer: number | undefined,
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
    return {shown: false, animating: false, displayed: this.modelValue, timer: undefined};
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
    window.clearInterval(this.timer);
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
      // One more character revealed (or masked again) per step
      this.animating = true;
      let count = show ? 0 : text.length;
      this.displayed = partlyRevealed(text, count);
      this.timer = window.setInterval(() => {
        count += show ? 1 : -1;
        this.displayed = partlyRevealed(text, count);
        if ((show && count >= text.length) || (!show && count <= 0)) {
          this.settle();
        }
      }, STEP_MS);
    },
    settle(): void {
      window.clearInterval(this.timer);
      this.timer = undefined;
      this.animating = false;
      this.displayed = this.modelValue;
      (this.$refs.input as HTMLInputElement | undefined)?.focus();
    },
  },
});
</script>
