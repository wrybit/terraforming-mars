<template>
  <!-- All shortcuts in two columns: general and selection on the left, the tabs on the right in the groups of the tab
       bar (always there, ending the turn | depending on the situation, expansions of this game). Group titles carry
       the colors of the drawn keyboard. Read-only by default (help overlay); in edit mode every editable row is a
       button that waits for a new key. -->
  <div class="hotkey-list">
    <div class="hotkey-list__column">
      <section v-for="group in leftGroups" :key="group.title" class="hotkey-list__group">
        <h3 :class="['hotkey-list__title', 'hotkey-list__title--' + group.color]"><i class="hotkey-list__swatch" aria-hidden="true"></i><span v-i18n>{{ group.title }}</span></h3>
        <HotkeyRow v-for="row in group.rows" :key="row.id" :row="row" :editing="editing" :capturing="capturing === row.id"
          :duplicate="duplicates.has(row.id)" :highlighted="highlighted.has(row.id)"
          @capture="$emit('capture', row.id)" @hover="$emit('hover', $event ? row.id : undefined)"/>
      </section>
    </div>
    <section class="hotkey-list__group">
      <h3 class="hotkey-list__title hotkey-list__title--tabs-default" v-i18n>Tabs</h3>
      <HotkeyRow v-for="row in rowsOf('tabs')" :key="row.id" :row="row" :editing="editing" :capturing="capturing === row.id"
        :duplicate="duplicates.has(row.id)" :highlighted="highlighted.has(row.id)"
        @capture="$emit('capture', row.id)" @hover="$emit('hover', $event ? row.id : undefined)"/>
      <div class="hotkey-list__tabs">
        <div v-for="(column, columnIndex) in tabColumns" :key="columnIndex" class="hotkey-list__tab-column">
          <template v-for="group in column" :key="group.title">
            <h4 :class="['hotkey-list__subtitle', 'hotkey-list__title--' + group.color]"><i class="hotkey-list__swatch" aria-hidden="true"></i><span v-i18n>{{ group.title }}</span></h4>
            <HotkeyRow v-for="row in group.rows" :key="row.id" :row="row" :editing="editing" :capturing="capturing === row.id"
              :duplicate="duplicates.has(row.id)" :highlighted="highlighted.has(row.id)"
              @capture="$emit('capture', row.id)" @hover="$emit('hover', $event ? row.id : undefined)"/>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {HOTKEY_ACTIONS, HotkeyAction, HotkeyGroup, isActionShown} from '@/client/hotkeys/hotkeyActions';
import {CLIENT_EXTENSIONS} from '@/genfiles/extensionsClient';
import HotkeyRow from '@/client/components/hotkeys/HotkeyRow.vue';

const props = withDefaults(defineProps<{
  editing?: boolean;
  /** Expansions of the game: tabs of other expansions are left out (undefined: all) */
  expansions?: ReadonlyArray<string>;
  capturing?: string;
  duplicates?: Set<string>;
  highlighted?: ReadonlySet<string>;
}>(), {
  editing: false,
  expansions: undefined,
  capturing: undefined,
  duplicates: () => new Set<string>(),
  highlighted: () => new Set<string>(),
});

defineEmits<{
  (event: 'capture', id: string): void;
  (event: 'hover', id: string | undefined): void;
}>();

// Keys of installed extensions (e.g. B for feedback) are listed as fixed general shortcuts
const extensionRows = computed<Array<HotkeyAction>>(() => CLIENT_EXTENSIONS.flatMap((extension) => (extension.shortcuts ?? []).map((shortcut) => ({
  id: 'extension-' + extension.name + '-' + shortcut.key,
  group: 'general' as HotkeyGroup,
  label: shortcut.label,
  keys: [shortcut.key],
  locked: true,
}))));

function rowsOf(group: HotkeyGroup): Array<HotkeyAction> {
  return HOTKEY_ACTIONS.filter((action) => action.group === group && isActionShown(action, props.expansions));
}

type ListGroup = {title: string, color: string, rows: Array<HotkeyAction>};

const leftGroups = computed<Array<ListGroup>>(() => [
  {title: 'General shortcuts', color: 'general', rows: [...rowsOf('general'), ...extensionRows.value]},
  {title: 'Selection', color: 'selection', rows: rowsOf('selection')},
]);

// Groups without a row (no expansion tab in this game) are left out
const tabColumns = computed<Array<Array<ListGroup>>>(() => [
  [
    {title: 'Always there', color: 'tabs-default', rows: rowsOf('tabs-default')},
    {title: 'End the turn', color: 'tabs-turn-end', rows: rowsOf('tabs-turn-end')},
  ],
  [
    {title: 'Depending on the situation', color: 'tabs-context', rows: rowsOf('tabs-context')},
    {title: 'Expansions', color: 'tabs-expansion', rows: rowsOf('tabs-expansion')},
  ],
].map((column) => column.filter((group) => group.rows.length > 0)));
</script>
