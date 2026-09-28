<template>
  <!-- Roter Status-Tab neben den Handkarten, solange ein anderer Spieler am Zug ist (nicht klickbar) -->
  <div v-if="players.length > 0" class="or-tab or-tab--status" role="status">
    <span aria-hidden="true">⌛</span>
    <span v-for="player in players" :key="player.color" class="log-player" :class="'player_bg_color_' + player.color">{{ player.name }}</span>
    <span>{{ $t(players.length === 1 ? 'is taking their turn' : 'are taking their turn') }}</span>
  </div>
</template>

<script setup lang="ts">
import {PublicPlayerModel} from '@/common/models/PlayerModel';

defineProps<{
  players: ReadonlyArray<PublicPlayerModel>;
}>();
</script>
