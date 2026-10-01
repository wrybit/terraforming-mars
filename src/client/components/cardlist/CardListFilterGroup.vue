<template>
  <section class="card-list-group">
    <header class="card-list-group-head">
      <h2 v-i18n>{{ title }}</h2>
      <button v-if="filtered" type="button" class="card-list-link" @click="$emit('reset')" v-i18n>Reset</button>
    </header>
    <div class="card-list-chips" :class="`card-list-chips--${variant}`">
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        class="card-list-chip"
        :class="{
          'card-list-chip--selected': marked(option.key),
          'card-list-chip--empty': countOf(option.key) === 0 && !marked(option.key),
        }"
        :aria-pressed="marked(option.key)"
        :title="$t(option.label)"
        @click="$emit('toggle', option.key)">
        <span v-if="option.iconClass" class="card-list-icon" :class="option.iconClass"></span>
        <span v-else-if="option.colorClass" class="card-list-dot" :class="option.colorClass"></span>
        <span v-if="variant === 'chips'" class="card-list-chip-label" v-i18n>{{ option.label }}</span>
        <span v-if="counts !== undefined" class="card-list-count">{{ countOf(option.key) }}</span>
      </button>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {FilterOption, optionKeys} from '@/client/components/cardlist/cardListOptions';
import {isMarked, isUnfiltered} from '@/client/components/cardlist/filterSelection';

// Eine Filtergruppe der Kartenliste (Kartentyp, Tags, Erweiterungen, Ressourcen): Kopf mit Zurücksetzen, darunter
// die Optionen als Kacheln (mit Text) oder als reine Symbole. Die Auswahl selbst ändert die Elternkomponente.
export default defineComponent({
  name: 'CardListFilterGroup',
  emits: ['toggle', 'reset'],
  props: {
    title: {type: String, required: true},
    options: {type: Array as PropType<ReadonlyArray<FilterOption>>, required: true},
    selection: {type: Object as PropType<Record<string, boolean>>, required: true},
    // Trefferzahl je Option; ohne Angabe keine Zahlen
    counts: {type: Object as PropType<Map<string, number>>, required: false},
    variant: {type: String as PropType<'chips' | 'icons'>, default: 'chips'},
  },
  computed: {
    keys(): Array<string> {
      return optionKeys(this.options);
    },
    filtered(): boolean {
      return !isUnfiltered(this.selection, this.keys);
    },
  },
  methods: {
    marked(key: string): boolean {
      return isMarked(this.selection, this.keys, key);
    },
    countOf(key: string): number | undefined {
      return this.counts === undefined ? undefined : this.counts.get(key) ?? 0;
    },
  },
});
</script>
