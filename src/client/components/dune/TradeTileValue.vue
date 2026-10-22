<template>
  <!-- Value under a tile of the smuggling trade (exchangeValue.ts): Solari as the coin, another good as a pill with
       the number and that good's symbol -->
  <span v-if="value.currency === undefined" class="button-count button-count--megacredits">{{ value.amount }}</span>
  <span v-else class="trade-tile-value" data-test="trade-tile-value">{{ text }}<i :class="'resource_icon resource_icon--' + value.currency"></i></span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {formatValue, TileValue} from './exchangeValue';

const props = defineProps<{
  value: TileValue,
}>();

const text = computed(() => formatValue(props.value.amount, getPreferences().lang));
</script>
