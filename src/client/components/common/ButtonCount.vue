<template>
  <!-- One counter inside a button (buttonCount.ts, button_count.less) -->
  <span v-if="part.word !== undefined" class="button-count__word">{{ $t(part.word) }}</span>
  <span v-if="part.gain === true" class="button-count__plus">+</span>
  <span v-if="part.kind === 'card' || part.kind === 'megacredits'" :class="['button-count', 'button-count--' + part.kind]">{{ part.value }}</span>
  <span v-else :class="['button-count', 'button-count--resource', 'button-count--' + part.kind]">
    <span class="button-count__value">{{ part.value }}</span><i class="button-count__icon"></i>
  </span>
</template>

<script setup lang="ts">
import {ButtonCountPart} from '@/client/components/common/buttonCount';

defineProps<{
  part: ButtonCountPart,
}>();
</script>
