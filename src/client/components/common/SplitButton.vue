<template>
  <!-- Main action on the left, rarer ones behind the arrow on the right; without options a plain button.
       The menu hangs at the body: dialogs and cards clip whatever sticks out of them (floatingPanel.ts) -->
  <span class="split-button" :class="{'split-button--single': options.length === 0}">
    <button type="button" :class="[buttonClass, 'split-button-main']" @click="emit('click')"><slot></slot></button>
    <button v-if="options.length > 0" ref="anchor" type="button" :class="[buttonClass, 'split-button-toggle']" :aria-expanded="open" :aria-label="$t(menuLabel)" :title="$t(menuLabel)" @click="toggle">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    <Teleport to="body">
      <div v-if="open" ref="panel" class="card-bar-menu split-button-menu" role="menu" :style="position" @keydown.esc.stop="close">
        <a v-for="option in options" :key="option.label" class="card-sort-menu__manual" role="menuitem" :href="option.href" @click="close">{{ $t(option.label) }}</a>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useFloatingPanel} from './floatingPanel';

export type SplitButtonOption = {label: string, href: string};

defineProps<{
  /** Look of both halves, e.g. create-game-small-button */
  buttonClass: string;
  /** Rarer actions, as links */
  options: ReadonlyArray<SplitButtonOption>;
  /** Name of the arrow button (screen readers, tooltip) */
  menuLabel: string;
}>();

const emit = defineEmits<{
  (event: 'click'): void;
}>();

const anchor = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const {open, position, toggle, close} = useFloatingPanel(anchor, panel, {align: 'right'});
</script>
