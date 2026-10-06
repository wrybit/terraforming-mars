<template>
  <section class="create-game--block create-game-custom-list">
    <div class="create-game-card-head">
      <h2 v-i18n>{{ title }}</h2>
      <span v-if="selected.length" class="create-game-count">{{ selected.length }}</span>
      <SegmentedControl class="create-game-custom-list-mode" v-model="mode" :options="MODE_OPTIONS"/>
    </div>
    <!-- View: only what differs from the default pool, as real cards -->
    <template v-if="mode === 'view'">
      <div v-if="unchanged" class="create-game-note" v-i18n>Same as the default selection</div>
      <template v-for="section in sections" :key="section.tone">
        <div v-if="section.names.length" class="create-game-subhead">
          <span v-i18n>{{ section.label }}</span>
          <span class="create-game-count">{{ section.names.length }}</span>
        </div>
        <CardPreviewGrid v-if="section.names.length" :names="section.names" :tone="section.tone"/>
      </template>
    </template>
    <!-- Edit: the full list with checkboxes (was a popup before) -->
    <component v-else :is="EDITORS[kind]" embedded :expansions="expansions" :selected="selected"
      @corporation-list-changed="onChange" @prelude-list-changed="onChange" @ceo-list-changed="onChange"/>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {CardName} from '@/common/cards/CardName';
import {Expansion} from '@/common/cards/GameModule';
import SegmentedControl from './SegmentedControl.vue';
import CardPreviewGrid from './CardPreviewGrid.vue';
import CorporationsFilter from './CorporationsFilter.vue';
import PreludesFilter from './PreludesFilter.vue';
import CeosFilter from './CeosFilter.vue';
import {CustomCardListKind, customListDelta} from './customCardListDefaults';
import {SegmentOption} from './createGameChoices';

type Mode = 'view' | 'edit';

const MODE_OPTIONS: ReadonlyArray<SegmentOption> = [
  {value: 'view', label: 'Show'},
  {value: 'edit', label: 'Edit'},
];

const EDITORS = {
  corporations: CorporationsFilter,
  preludes: PreludesFilter,
  ceos: CeosFilter,
} as const;

// Custom corporation/prelude/CEO list as its own card of the form with two modes
export default defineComponent({
  name: 'CustomCardListCard',
  components: {SegmentedControl, CardPreviewGrid},
  emits: ['list-changed'],
  props: {
    kind: {type: String as PropType<CustomCardListKind>, required: true},
    title: {type: String, required: true},
    expansions: {type: Object as () => Record<Expansion, boolean>, required: true},
    selected: {type: Array as PropType<Array<CardName>>, required: true},
  },
  data(): {mode: Mode} {
    // Nothing to show without a custom list yet: start in the editor
    return {mode: this.selected.length > 0 ? 'view' : 'edit'};
  },
  computed: {
    MODE_OPTIONS(): ReadonlyArray<SegmentOption> {
      return MODE_OPTIONS;
    },
    EDITORS(): typeof EDITORS {
      return EDITORS;
    },
    delta() {
      return customListDelta(this.kind, this.expansions, this.selected);
    },
    unchanged(): boolean {
      return this.delta.added.length === 0 && this.delta.removed.length === 0;
    },
    sections(): Array<{tone: 'removed' | 'added', label: string, names: Array<CardName>}> {
      return [
        {tone: 'removed', label: 'Removed', names: this.delta.removed},
        {tone: 'added', label: 'Added', names: this.delta.added},
      ];
    },
  },
  methods: {
    onChange(list: Array<CardName>) {
      this.$emit('list-changed', list);
    },
  },
});
</script>
