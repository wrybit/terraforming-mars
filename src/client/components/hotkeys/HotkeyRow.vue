<template>
  <!-- One shortcut: key caps, then the label. Editable rows are buttons in edit mode; fixed ones are dimmed there -->
  <button v-if="editing && row.locked !== true" type="button"
    :class="['hotkey-row', 'hotkey-row--editable', {'hotkey-row--capturing': capturing, 'hotkey-row--duplicate': duplicate, 'hotkey-row--highlighted': highlighted}]"
    @click="$emit('capture')" @mouseenter="$emit('hover', true)" @mouseleave="$emit('hover', false)">
    <span class="hotkey-row__keys">
      <kbd v-if="capturing" class="hotkey-key">…</kbd>
      <HotkeyKeys v-else-if="hasKeys" :action="row.id" always/>
      <kbd v-else class="hotkey-key hotkey-key--empty">–</kbd>
    </span>
    <span :class="labelClass">{{ capturing ? $t('Press a key …') : $t(row.label) }}<span v-if="row.detail !== undefined && !capturing" class="hotkey-row__detail">{{ $t(row.detail) }}</span></span>
  </button>
  <div v-else :class="['hotkey-row', {'hotkey-row--locked': editing && row.locked === true, 'hotkey-row--highlighted': highlighted}]"
    @mouseenter="$emit('hover', true)" @mouseleave="$emit('hover', false)">
    <span class="hotkey-row__keys">
      <HotkeyKeys v-if="row.locked === true" :fixed="row.keys" always/>
      <HotkeyKeys v-else-if="hasKeys" :action="row.id" always/>
      <kbd v-else class="hotkey-key hotkey-key--empty">–</kbd>
    </span>
    <span :class="labelClass">{{ $t(row.label) }}<span v-if="row.detail !== undefined" class="hotkey-row__detail">{{ $t(row.detail) }}</span></span>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {HotkeyAction} from '@/client/hotkeys/hotkeyActions';
import {keysOf} from '@/client/hotkeys/hotkeyStore';
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';

const props = defineProps<{
  row: HotkeyAction;
  editing: boolean;
  capturing: boolean;
  duplicate: boolean;
  highlighted?: boolean;
}>();

defineEmits<{
  (event: 'capture'): void;
  (event: 'hover', inside: boolean): void;
}>();

const hasKeys = computed(() => keysOf(props.row.id).length > 0);
const labelClass = computed(() => ['hotkey-row__label', props.row.tone !== undefined ? 'hotkey-row__label--' + props.row.tone : '']);
</script>
