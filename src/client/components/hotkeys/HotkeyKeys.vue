<template>
  <!-- Key caps of a shortcut, "set into" the surface (hotkeys.less). Only visible while shortcuts are available and
       shown (class tm-hotkeys on <html>), unless always is set (help dialog). Screen readers skip them. -->
  <span v-if="keys.length > 0" :class="['hotkey-keys', {'hotkey-keys--always': always}]" aria-hidden="true">
    <kbd v-for="(key, index) in keys" :key="index" class="hotkey-key">{{ capLabel(key) }}</kbd>
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

function capLabel(key: string): string {
  const label = keyCapLabel(key);
  // "Ctrl" is "Strg" on German keyboards; translated like every text
  return label === 'Ctrl' ? translateText('Ctrl') : label;
}
</script>
