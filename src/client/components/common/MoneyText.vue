<template>
  <!-- A translated label with its amounts of money as coins (moneyText.ts): "Award (14 M€)" → Award + coin 14 -->
  <template v-for="(part, index) in parts" :key="index">
    <template v-if="part.kind === 'text'">{{ part.text }}</template>
    <span v-else class="button-count button-count--megacredits money-text__coin">{{ part.value }}</span>
  </template>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {moneyParts} from '@/client/components/common/moneyText';

const props = defineProps<{
  // Already translated text
  text: string,
}>();

const parts = computed(() => moneyParts(props.text));
</script>
