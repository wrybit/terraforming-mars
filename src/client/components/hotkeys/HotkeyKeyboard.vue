<template>
  <!-- Laptop keyboard of the shortcut dialog: keys with a shortcut are colored by group (like the group titles of the
       list) and carry a short label; hovering a key highlights its rows and the other way round. In edit mode the keys can be clicked to assign
       them; ⌘ / Ctrl is a toggle for combinations. -->
  <div :class="['hotkey-keyboard', {'hotkey-keyboard--editing': editing}]" aria-hidden="true">
    <div v-for="(row, rowIndex) in rows" :key="rowIndex" :class="['hotkey-keyboard__row', {'hotkey-keyboard__row--function': rowIndex === 0}]">
      <template v-for="(slot, slotIndex) in row" :key="slotIndex">
        <span v-if="isStack(slot)" class="hotkey-keyboard__stack">
          <span v-for="key in slot.stack" :key="key.id" :data-key="key.id" :class="keyClass(key)"
            @mouseenter="$emit('hover', key)" @mouseleave="$emit('hover', undefined)" @click="$emit('press', key)">{{ keyLabel(key) }}</span>
        </span>
        <span v-else :data-key="slot.id" :class="keyClass(slot)" :style="{flexGrow: slot.width ?? 1}"
          @mouseenter="$emit('hover', slot)" @mouseleave="$emit('hover', undefined)" @click="$emit('press', slot)">
          <small v-if="slot.shiftLabel !== undefined">{{ slot.shiftLabel }}</small>{{ keyLabel(slot) }}
          <em v-if="useLabel(slot) !== ''" class="hotkey-keyboard__use">{{ useLabel(slot) }}</em>
        </span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {KeyboardKey, isStack, keyboardLayout} from '@/client/hotkeys/hotkeyKeyboardLayouts';
import {KeyUse, allKeyUses, keyUses} from '@/client/hotkeys/hotkeyKeyUses';
import {isMac} from '@/client/hotkeys/hotkeyEvents';
import {hotkeyState} from '@/client/hotkeys/hotkeyStore';
import {translateText} from '@/client/directives/i18n';

const props = defineProps<{
  language: string;
  editing: boolean;
  /** Expansions of the game: keys of other expansions' tabs stay blank (undefined: all) */
  expansions?: ReadonlyArray<string>;
  /** Rows the player points at: their keys light up */
  highlighted: ReadonlySet<string>;
  /** Keys pressed right now (physical keyboard or click), by id */
  pressed: ReadonlySet<string>;
  /** ⌘ / Ctrl switched on for the next key in edit mode */
  modArmed: boolean;
}>();

defineEmits<{
  (event: 'hover', key: KeyboardKey | undefined): void;
  (event: 'press', key: KeyboardKey): void;
}>();

const rows = computed(() => keyboardLayout(props.language, isMac()));

// Recomputed with every binding change (hotkeyState is reactive), so the colors follow the edits live
const highlightedUsesMod = computed(() => {
  // Touch the reactive bindings so this updates while editing
  void hotkeyState.bindings;
  return allKeyUses(props.expansions).some((use) => props.highlighted.has(use.id) && use.usesMod);
});

// Windows keyboards in German say "Strg" instead of "Ctrl" – the same word as in the key caps of the list
function keyLabel(key: KeyboardKey): string {
  return key.label === 'Ctrl' ? translateText('Ctrl') : key.label;
}

// Shortcuts that name and color a key: the key alone before ⌘ / Ctrl combinations (Z is "sell", ⌘Z only undo), the
// help on ß / ? only where nothing else lies
function mainUses(key: KeyboardKey): Array<KeyUse> {
  const uses = keyUses(key, props.expansions);
  const plain = uses.filter((use) => !use.usesMod && use.id !== 'help');
  const own = uses.filter((use) => use.id !== 'help');
  return plain.length > 0 ? plain : own.length > 0 ? own : uses;
}

// Short label under the character; half keys have no room, the lower part of Enter repeats nothing
function useLabel(key: KeyboardKey): string {
  void hotkeyState.bindings;
  if (key.half === true || key.mod === true || key.id === 'EnterLower') {
    return '';
  }
  return Array.from(new Set(mainUses(key).map((use) => translateText(use.short)))).join(' / ');
}

function keyClass(key: KeyboardKey): Array<string | Record<string, boolean>> {
  void hotkeyState.bindings;
  const uses = keyUses(key, props.expansions);
  const group = mainUses(key)[0]?.color;
  const lit = uses.some((use) => props.highlighted.has(use.id)) || (key.mod === true && highlightedUsesMod.value);
  return ['hotkey-keyboard__key', group !== undefined ? 'hotkey-keyboard__key--' + group : '', {
    'hotkey-keyboard__key--half': key.half === true,
    'hotkey-keyboard__key--mod': key.mod === true,
    'hotkey-keyboard__key--lit': lit,
    'hotkey-keyboard__key--pressed': props.pressed.has(key.id) || (key.mod === true && props.modArmed),
    'hotkey-keyboard__key--clickable': props.editing && key.value !== undefined,
  }];
}
</script>
