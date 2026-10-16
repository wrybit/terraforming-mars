<template>
  <!-- Keyboard shortcuts in the help (every page): the drawn keyboard and the list of the shortcut dialog ('?'), with
       the player's own keys; hovering a key highlights its rows and the other way round. Changing them happens in
       the dialog in the game. -->
  <div class="help-shortcuts">
    <section class="help-overlay-section help-shortcuts__section">
      <p class="help-overlay-section-lead" v-i18n>Press ? in the game to see these keys and change them.</p>
      <HotkeyKeyboard :language="language" :editing="false" :highlighted="highlighted" :pressed="NO_KEYS" :modArmed="false"
        @hover="hoveredKey = $event"/>
      <HotkeyList :highlighted="highlighted" @hover="hoveredRow = $event"/>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import HotkeyKeyboard from '@/client/components/hotkeys/HotkeyKeyboard.vue';
import HotkeyList from '@/client/components/hotkeys/HotkeyList.vue';
import {KeyboardKey} from '@/client/hotkeys/hotkeyKeyboardLayouts';
import {keyUses} from '@/client/hotkeys/hotkeyKeyUses';
import {getPreferences} from '@/client/utils/PreferencesManager';

const NO_KEYS: ReadonlySet<string> = new Set();

const language = computed(() => getPreferences().lang);
const hoveredRow = ref<string | undefined>(undefined);
const hoveredKey = ref<KeyboardKey | undefined>(undefined);

const highlighted = computed(() => {
  const ids = new Set<string>();
  if (hoveredRow.value !== undefined) {
    ids.add(hoveredRow.value);
  }
  if (hoveredKey.value !== undefined) {
    keyUses(hoveredKey.value).forEach((use) => ids.add(use.id));
  }
  return ids;
});
</script>
