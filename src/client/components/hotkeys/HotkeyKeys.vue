<template>
  <!-- Key caps of a shortcut, "set into" the surface (hotkeys.less). Only visible while shortcuts are available and
       shown (class tm-hotkeys on <html>), unless always is set (help dialog). Screen readers skip them. -->
  <span v-if="keys.length > 0" :class="['hotkey-keys', {'hotkey-keys--always': always}]" aria-hidden="true">
    <kbd v-for="(key, index) in keys" :key="index" :class="['hotkey-key', {'hotkey-key--icon': iconOf(key) !== undefined}]">
      <svg v-if="iconOf(key) !== undefined" class="hotkey-key__icon" viewBox="0 0 16 16"><path v-for="path in iconOf(key)" :key="path" :d="path"/></svg>
      <template v-else>{{ capLabel(key) }}</template>
    </kbd>
  </span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {HotkeyKeys} from '@/client/hotkeys/hotkeyActions';
import {keysOf} from '@/client/hotkeys/hotkeyStore';
import {keyCapLabel} from '@/client/hotkeys/hotkeyEvents';
import {translateText} from '@/client/directives/i18n';

const props = defineProps<{
  /** Action id from hotkeyActions.ts … */
  action?: string;
  /** … or fixed keys */
  fixed?: HotkeyKeys;
  always?: boolean;
}>();

const keys = computed(() => props.fixed ?? (props.action !== undefined ? keysOf(props.action) : []));

// Symbols as drawn icons: characters like ↵, ␣ or ^ sit too high or too low depending on the font; icons are always
// centered and as heavy as the letters next to them
const ICONS: Readonly<Record<string, ReadonlyArray<string>>> = {
  '↵': ['M13 3v5a2 2 0 0 1-2 2H3', 'M6 7l-3 3 3 3'],
  '␣': ['M2.5 7.5v3.5h11V7.5'],
  '^': ['M4 10l4-4.5 4 4.5'],
  '⌘': ['M6 6h4v4H6z', 'M6 6V4.5A1.5 1.5 0 1 0 4.5 6H6M10 6V4.5A1.5 1.5 0 1 1 11.5 6H10M6 10v1.5A1.5 1.5 0 1 1 4.5 10H6M10 10v1.5a1.5 1.5 0 1 0 1.5-1.5H10'],
  '←': ['M13 8H3', 'M7 4L3 8l4 4'],
  '→': ['M3 8h10', 'M9 4l4 4-4 4'],
  '↑': ['M8 13V3', 'M4 7l4-4 4 4'],
  '↓': ['M8 3v10', 'M4 9l4 4 4-4'],
};

function iconOf(key: string): ReadonlyArray<string> | undefined {
  return ICONS[keyCapLabel(key)];
}

function capLabel(key: string): string {
  const label = keyCapLabel(key);
  // "Ctrl" is "Strg" on German keyboards; translated like every text
  return label === 'Ctrl' ? translateText('Ctrl') : label;
}
</script>
