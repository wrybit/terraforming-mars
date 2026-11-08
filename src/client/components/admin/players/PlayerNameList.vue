<template>
  <!-- Every row can be dragged and is a drop target at once. On touch screens drag and drop does not work:
       there the first tap selects the name that goes, the second tap the name that stays. -->
  <div class="admin-players-list-wrap">
    <div v-if="selected !== undefined" class="admin-players-hint" role="status">
      <span><b>{{ selected }}</b> <span v-i18n>selected – now tap the name that stays.</span></span>
      <button type="button" class="btn btn-sm btn-tone-quiet" @click="selected = undefined" v-i18n>Cancel</button>
    </div>
    <div class="admin-players-toolbar">
      <input v-model="query" type="search" class="admin-players-search" :placeholder="$t('Search name…')">
      <div class="admin-players-sort" role="group">
        <button v-for="option in SORT_OPTIONS" :key="option.key" type="button" :aria-pressed="sort === option.key" @click="sort = option.key" v-i18n>{{ option.label }}</button>
      </div>
    </div>
    <ul class="admin-players-list">
      <li v-for="player in shown" :key="player.name" draggable="true" class="admin-players-row"
        :class="{
          'admin-players-row--dragging': dragged === player.name,
          'admin-players-row--target': dropTarget === player.name,
          'admin-players-row--selected': selected === player.name,
          'admin-players-row--can-drop': selected !== undefined && selected !== player.name,
        }"
        @dragstart="onDragStart($event, player.name)" @dragend="dragged = undefined; dropTarget = undefined"
        @dragover="onDragOver($event, player.name)" @dragleave="dropTarget = undefined" @drop.prevent="onDrop(player.name)"
        @click="onTap(player.name)">
        <span class="admin-players-grip" aria-hidden="true">⋮⋮</span>
        <span class="admin-players-swatch" :class="`player_bg_color_${player.color}`" aria-hidden="true"></span>
        <span class="admin-players-who">
          <span class="admin-players-name-line">
            <b>{{ player.name }}</b>
            <span v-if="defaultNames.includes(player.name)" class="admin-players-default-tag" v-i18n>default name</span>
          </span>
          <span v-if="player.oldNames.length > 0" class="admin-players-old"><span v-i18n>also counts:</span> {{ player.oldNames.join(', ') }}</span>
        </span>
        <span class="admin-players-meta">
          <span><b>{{ player.games }}</b><span v-i18n>games</span></span>
          <span><b>{{ formatPercent(player.wins / player.games) }}</b><span v-i18n>wins</span></span>
          <span class="admin-players-meta-last"><b>{{ formatDate(player.lastTimeMs) }}</b><span v-i18n>last game</span></span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {PlayerNameStats} from './playerNameStats';
import {formatDate, formatPercent} from '@/client/components/stats/statsLabels';

type SortKey = 'games' | 'name' | 'last';
const SORT_OPTIONS: ReadonlyArray<{key: SortKey, label: string}> = [
  {key: 'games', label: 'Games'},
  {key: 'name', label: 'Name'},
  {key: 'last', label: 'Latest'},
];

const props = defineProps<{
  players: ReadonlyArray<PlayerNameStats>,
  defaultNames: ReadonlyArray<string>,
}>();

const emit = defineEmits<{
  (event: 'merge', pair: {from: string, to: string}): void;
}>();

const query = ref('');
const sort = ref<SortKey>('games');
const dragged = ref<string | undefined>(undefined);
const dropTarget = ref<string | undefined>(undefined);
const selected = ref<string | undefined>(undefined);

const shown = computed(() => {
  const needle = query.value.trim().toLowerCase();
  const list = props.players.filter((player) => player.name.toLowerCase().includes(needle));
  if (sort.value === 'name') {
    return [...list].sort((first, second) => first.name.localeCompare(second.name));
  }
  if (sort.value === 'last') {
    return [...list].sort((first, second) => second.lastTimeMs - first.lastTimeMs);
  }
  return list;
});


function onDragStart(event: DragEvent, name: string): void {
  dragged.value = name;
  selected.value = undefined;
  // Firefox only starts dragging with data set
  event.dataTransfer?.setData('text/plain', name);
}

function onDragOver(event: DragEvent, name: string): void {
  if (dragged.value !== undefined && dragged.value !== name) {
    event.preventDefault();
    dropTarget.value = name;
  }
}

function onDrop(name: string): void {
  const from = dragged.value;
  dragged.value = undefined;
  dropTarget.value = undefined;
  if (from !== undefined && from !== name) {
    emit('merge', {from, to: name});
  }
}

function onTap(name: string): void {
  if (selected.value === undefined || selected.value === name) {
    selected.value = selected.value === name ? undefined : name;
    return;
  }
  emit('merge', {from: selected.value, to: name});
  selected.value = undefined;
}

// Escape drops a selection, as with every other selection on the page
function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    selected.value = undefined;
  }
}
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>
