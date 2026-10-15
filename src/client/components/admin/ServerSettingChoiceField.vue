<template>
  <!-- Choice setting: a drop-down like a select, but with a picture per value (a native select shows no pictures) -->
  <div ref="root" class="server-setting-choice" :class="{'server-setting-choice--open': open, 'server-setting-choice--up': opensUp}">
    <button :id="inputId" ref="button" type="button" class="server-setting-choice-button"
      aria-haspopup="listbox" :aria-expanded="open" @click="toggle" @keydown.down.prevent="openAt(selectedIndex)">
      <img v-if="image(selected.value) !== ''" :src="image(selected.value)" alt="" width="24" height="24">
      <span v-i18n>{{ selected.label }}</span>
    </button>
    <ul v-if="open" class="server-setting-choice-list" role="listbox" :aria-labelledby="inputId" @keydown="onListKey">
      <li v-for="choice in choices" :key="choice.value" ref="options" role="option" tabindex="-1"
        :aria-selected="choice.value === value"
        :class="['server-setting-choice-option', {'server-setting-choice-option--selected': choice.value === value}]"
        @click="choose(choice.value)">
        <img v-if="image(choice.value) !== ''" :src="image(choice.value)" alt="" width="24" height="24">
        <span v-i18n>{{ choice.label }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ServerSettingChoice} from '@/common/admin/serverSettings';

// Height of the open list (max-height in admin_settings.less) plus the sticky save bar below it
const LIST_ROOM = 320 + 110;

export default defineComponent({
  name: 'ServerSettingChoiceField',
  props: {
    inputId: {type: String, required: true},
    value: {type: String, required: true},
    choices: {type: Array as PropType<ReadonlyArray<ServerSettingChoice>>, required: true},
    // Picture of a value; '' shows none
    image: {type: Function as PropType<(value: string) => string>, required: true},
  },
  emits: ['update'],
  data() {
    return {open: false, opensUp: false};
  },
  computed: {
    selectedIndex(): number {
      return Math.max(0, this.choices.findIndex((choice) => choice.value === this.value));
    },
    // A value from a hand-edited .env that is not in the list: the server uses the default (first choice)
    selected(): ServerSettingChoice {
      return this.choices[this.selectedIndex];
    },
  },
  beforeUnmount() {
    document.removeEventListener('pointerdown', this.onOutside);
  },
  methods: {
    toggle(): void {
      if (this.open) {
        this.close(false);
      } else {
        this.openAt(this.selectedIndex);
      }
    },
    openAt(index: number): void {
      // Not enough room below (the save bar sticks to the bottom of the screen): the list opens upwards
      const button = (this.$refs.button as HTMLElement).getBoundingClientRect();
      this.opensUp = window.innerHeight - button.bottom < LIST_ROOM && button.top > window.innerHeight - button.bottom;
      this.open = true;
      document.addEventListener('pointerdown', this.onOutside);
      void this.$nextTick(() => this.focusOption(index));
    },
    close(focusButton: boolean): void {
      this.open = false;
      document.removeEventListener('pointerdown', this.onOutside);
      if (focusButton) {
        (this.$refs.button as HTMLButtonElement | undefined)?.focus();
      }
    },
    choose(value: string): void {
      this.$emit('update', value);
      this.close(true);
    },
    focusOption(index: number): void {
      const options = this.$refs.options as Array<HTMLElement> | undefined;
      options?.[Math.min(Math.max(index, 0), this.choices.length - 1)]?.focus();
    },
    // Keys like a native select: arrows move, Enter or Space choose, Escape closes without a change
    onListKey(event: KeyboardEvent): void {
      const options = (this.$refs.options as Array<HTMLElement> | undefined) ?? [];
      const current = options.indexOf(document.activeElement as HTMLElement);
      const moves: Record<string, number> = {ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: options.length - 1};
      if (event.key in moves) {
        event.preventDefault();
        this.focusOption(moves[event.key]);
      } else if ((event.key === 'Enter' || event.key === ' ') && current >= 0) {
        event.preventDefault();
        this.choose(this.choices[current].value);
      } else if (event.key === 'Escape' || event.key === 'Tab') {
        this.close(event.key === 'Escape');
      }
    },
    onOutside(event: PointerEvent): void {
      if (!(this.$refs.root as HTMLElement).contains(event.target as Node)) {
        this.close(false);
      }
    },
  },
});
</script>
