<template>
  <ModuleItemFilter
    title="Preludes"
    :groups="GROUPS"
    :itemsByGroup="ALL_CARDS_BY_MODULE"
    :selected="initialSelected"
    :embedded="embedded"
    @update:selected="$emit('prelude-list-changed', $event)"
    @close="$emit('close')"
  >
    <template #item="{ itemName, icon }">
      <span v-i18n>{{ itemName }}</span>
      <div v-for="m in compatibility(itemName)" :key="m" :class="icon(m)"></div>
    </template>
  </ModuleItemFilter>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import ModuleItemFilter from './ModuleItemFilter.vue';
import {CardName} from '@/common/cards/CardName';
import {Expansion, GameModule, GAME_MODULES, MODULE_NAMES} from '@/common/cards/GameModule';
import {getCard} from '@/client/cards/ClientCardManifest';
import {customListCardsByModule, defaultCustomList} from './customCardListDefaults';

const ALL_CARDS_BY_MODULE = customListCardsByModule('preludes');
const GROUPS = GAME_MODULES.map((module) => ({key: module, label: MODULE_NAMES[module]}));

export default defineComponent({
  name: 'PreludesFilter',
  components: {ModuleItemFilter},
  emits: ['prelude-list-changed', 'close'],
  props: {
    expansions: {type: Object as () => Record<Expansion, boolean>, required: true},
    selected: {type: Array as () => Array<CardName>, required: true},
    // Inside a card of the form instead of a popup
    embedded: {type: Boolean, default: false},
  },
  data() {
    const initialSelected: Array<CardName> = this.selected.length > 0 ? [...this.selected] : defaultCustomList('preludes', this.expansions);
    return {initialSelected};
  },
  computed: {
    GROUPS(): typeof GROUPS {
      return GROUPS;
    },
    ALL_CARDS_BY_MODULE(): typeof ALL_CARDS_BY_MODULE {
      return ALL_CARDS_BY_MODULE;
    },
  },
  methods: {
    compatibility(name: CardName): Array<GameModule> {
      return getCard(name)?.compatibility ?? [];
    },
  },
});
</script>
