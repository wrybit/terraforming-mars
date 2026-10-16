<template>
  <!-- Laptop keyboard of the shortcut dialog: keys with a shortcut are colored by group (general, selection, tabs),
       hovering a key highlights its rows and the other way round. In edit mode the keys can be clicked to assign
       them; ⌘ / Ctrl is a toggle for combinations. -->
  <div :class="['hotkey-keyboard', {'hotkey-keyboard--editing': editing}]" aria-hidden="true">
    <div v-for="(row, rowIndex) in rows" :key="rowIndex" :class="['hotkey-keyboard__row', {'hotkey-keyboard__row--function': rowIndex === 0}]">
      <template v-for="(slot, slotIndex) in row" :key="slotIndex">
        <span v-if="isStack(slot)" class="hotkey-keyboard__stack">
          <span v-for="key in slot.stack" :key="key.id" :class="keyClass(key)"
            @mouseenter="$emit('hover', key)" @mouseleave="$emit('hover', undefined)" @click="$emit('press', key)">{{ key.label }}</span>
        </span>
        <span v-else :class="keyClass(slot)" :style="{flexGrow: slot.width ?? 1}"
          @mouseenter="$emit('hover', slot)" @mouseleave="$emit('hover', undefined)" @click="$emit('press', slot)">
          <small v-if="slot.shiftLabel !== undefined">{{ slot.shiftLabel }}</small>{{ slot.label }}
        </span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {KeyboardKey, isStack, keyboardLayout} from '@/client/hotkeys/hotkeyKeyboardLayouts';
import {allKeyUses, keyUses} from '@/client/hotkeys/hotkeyKeyUses';
import {isMac} from '@/client/hotkeys/hotkeyEvents';
import {hotkeyState} from '@/client/hotkeys/hotkeyStore';

const props = defineProps<{
  language: string;
  editing: boolean;
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
  return allKeyUses().some((use) => props.highlighted.has(use.id) && use.usesMod);
});

function keyClass(key: KeyboardKey): Array<string | Record<string, boolean>> {
  void hotkeyState.bindings;
  const uses = keyUses(key);
  const group = uses[0]?.group;
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
