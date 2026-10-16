<template>
  <!-- All shortcuts in two columns: general and selection on the left, the tabs on the right (two sub-columns).
       Read-only by default (help overlay); in edit mode every editable row is a button that waits for a new key. -->
  <div class="hotkey-list">
    <div class="hotkey-list__column">
      <section v-for="group in leftGroups" :key="group.title" class="hotkey-list__group">
        <h3 class="hotkey-list__title" v-i18n>{{ group.title }}</h3>
        <HotkeyRow v-for="row in group.rows" :key="row.id" :row="row" :editing="editing" :capturing="capturing === row.id"
          :duplicate="duplicates.has(row.id)" :highlighted="highlighted.has(row.id)"
          @capture="$emit('capture', row.id)" @hover="$emit('hover', $event ? row.id : undefined)"/>
      </section>
    </div>
    <section class="hotkey-list__group">
      <h3 class="hotkey-list__title" v-i18n>Tabs</h3>
      <div class="hotkey-list__tabs">
        <HotkeyRow v-for="row in tabRows" :key="row.id" :row="row" :editing="editing" :capturing="capturing === row.id"
          :duplicate="duplicates.has(row.id)" :highlighted="highlighted.has(row.id)"
          @capture="$emit('capture', row.id)" @hover="$emit('hover', $event ? row.id : undefined)"/>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {HOTKEY_ACTIONS, HotkeyAction, HotkeyGroup} from '@/client/hotkeys/hotkeyActions';
import {CLIENT_EXTENSIONS} from '@/genfiles/extensionsClient';
import HotkeyRow from '@/client/components/hotkeys/HotkeyRow.vue';

withDefaults(defineProps<{
  editing?: boolean;
  capturing?: string;
  duplicates?: Set<string>;
  highlighted?: ReadonlySet<string>;
}>(), {
  editing: false,
  capturing: undefined,
  duplicates: () => new Set<string>(),
  highlighted: () => new Set<string>(),
});

defineEmits<{
  (event: 'capture', id: string): void;
  (event: 'hover', id: string | undefined): void;
}>();

// Keys of installed extensions (e.g. F for feedback) are listed as fixed general shortcuts
const extensionRows = computed<Array<HotkeyAction>>(() => CLIENT_EXTENSIONS.flatMap((extension) => (extension.shortcuts ?? []).map((shortcut) => ({
  id: 'extension-' + extension.name + '-' + shortcut.key,
  group: 'general' as HotkeyGroup,
  label: shortcut.label,
  keys: [shortcut.key],
  locked: true,
}))));

function rowsOf(group: HotkeyGroup): Array<HotkeyAction> {
  return HOTKEY_ACTIONS.filter((action) => action.group === group);
}

const leftGroups = computed(() => [
  {title: 'General shortcuts', rows: [...rowsOf('general'), ...extensionRows.value]},
  {title: 'Selection', rows: rowsOf('selection')},
]);
const tabRows = computed(() => rowsOf('tabs'));
</script>
