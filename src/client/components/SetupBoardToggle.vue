<template>
  <!-- Ein einziger Umschalter für den Spielplan in der Startphase: eingeklappt haben die Auswahlspalten die volle Breite -->
  <button type="button" class="setup-board-toggle" :aria-pressed="collapsed" @click="toggleSetupBoard">
    <span class="setup-board-toggle-icon" aria-hidden="true">{{ collapsed ? '⇤' : '⇥' }}</span>
    <span>{{ $t(collapsed ? 'Show board' : 'Hide board') }}</span>
  </button>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {setupBoardCollapsed, toggleSetupBoard} from '@/client/components/setupBoardCollapsed';

const collapsed = computed(() => setupBoardCollapsed.value);
</script>
