<template>
  <!-- GAME_QUOTA as rows "5 games per 10 minutes" instead of JSON; every row is one limit, all of them apply -->
  <div class="server-setting-quota">
    <p v-if="unreadable" class="server-setting-quota-note" v-i18n>The saved value could not be read; saving replaces it.</p>
    <p v-else-if="rows.length === 0" class="server-setting-quota-empty" v-i18n>Unlimited</p>
    <div v-for="(row, index) in rows" :key="index" class="server-setting-quota-row">
      <input :id="index === 0 ? inputId : undefined" type="number" min="0" step="1" inputmode="numeric"
        :value="row.games" :aria-invalid="!validGames(row)" :aria-label="$t('Number of games')"
        @input="edit(index, {games: numberOf($event)})">
      <span class="server-setting-quota-text" v-i18n>games per</span>
      <input type="number" min="1" step="1" inputmode="numeric"
        :value="row.amount" :aria-invalid="!validAmount(row)" :aria-label="$t('Time span')"
        @input="edit(index, {amount: numberOf($event)})">
      <select :value="row.unit" :aria-label="$t('Unit')" @change="edit(index, {unit: unitOf($event)})">
        <option v-for="unit in GAME_QUOTA_UNITS" :key="unit.unit" :value="unit.unit">{{ $t(unit.label) }}</option>
      </select>
      <button type="button" class="btn btn-sm btn-tone-quiet server-setting-quota-remove" :aria-label="$t('Remove limit')" @click="remove(index)">×</button>
    </div>
    <button type="button" class="btn btn-sm btn-tone-quiet server-setting-quota-add" @click="add" v-i18n>Add limit</button>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {formatGameQuota, GAME_QUOTA_UNITS, GameQuotaLimit, GameQuotaUnit, parseGameQuota} from '@/common/admin/gameQuota';

const props = defineProps<{inputId: string, value: string}>();
const emit = defineEmits<{update: [value: string]}>();

// A new limit starts with something sensible to adjust, not with zeros
const NEW_LIMIT: GameQuotaLimit = {games: 5, amount: 1, unit: 'h'};

const rows = ref<Array<GameQuotaLimit>>([]);
const unreadable = ref(false);
// What this field sent last: a value coming back unchanged must not reset rows being typed in
let lastEmitted: string | undefined;

function load(value: string): void {
  if (value === lastEmitted) {
    return;
  }
  const parsed = parseGameQuota(value);
  unreadable.value = parsed === undefined;
  rows.value = parsed ?? [];
}

watch(() => props.value, load, {immediate: true});

function send(): void {
  lastEmitted = formatGameQuota(rows.value);
  emit('update', lastEmitted);
}

function numberOf(event: Event): number {
  const text = (event.target as HTMLInputElement).value;
  return text === '' ? NaN : Number(text);
}

function unitOf(event: Event): GameQuotaUnit {
  return (event.target as HTMLSelectElement).value as GameQuotaUnit;
}

function validGames(row: GameQuotaLimit): boolean {
  return Number.isInteger(row.games) && row.games >= 0;
}

function validAmount(row: GameQuotaLimit): boolean {
  return Number.isInteger(row.amount) && row.amount >= 1;
}

function edit(index: number, change: Partial<GameQuotaLimit>): void {
  rows.value[index] = {...rows.value[index], ...change};
  send();
}

function add(): void {
  rows.value.push({...NEW_LIMIT});
  unreadable.value = false;
  send();
}

function remove(index: number): void {
  rows.value.splice(index, 1);
  send();
}
</script>
