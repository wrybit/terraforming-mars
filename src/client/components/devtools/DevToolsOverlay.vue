<template>
  <!-- Lies over the box of the action tabs while the DevTools tab is open: the open input below stays as it is -->
  <div v-if="devToolsState.enabled && devToolsState.open" class="devtools-overlay">
    <DevToolsPanel :game="playerView.game" :players="playerView.players"/>
  </div>
</template>

<script setup lang="ts">
import {defineAsyncComponent} from 'vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {devToolsState} from '@/client/devtools/devToolsState';

// Own chunk: normal players never load the DevTools code
const DevToolsPanel = defineAsyncComponent(() => import('./DevToolsPanel.vue'));

defineProps<{
  playerView: PlayerViewModel;
}>();
</script>
