<template>
  <!-- A single toggle for the board in the setup phase: when collapsed the selection columns take the full width -->
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
