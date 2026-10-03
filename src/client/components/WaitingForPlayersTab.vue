<template>
  <!-- Red status tab next to the hand cards while others are acting (not clickable):
       in turn order "X is taking their turn", in parallel phases (draft, research) "Waiting for other players: X, Y" -->
  <div v-if="players.length > 0" class="or-tab or-tab--status" role="status">
    <span aria-hidden="true">⌛</span>
    <span v-if="parallel">{{ $t('Waiting for other players') }}</span>
    <span v-for="player in players" :key="player.color" class="log-player" :class="'player_bg_color_' + player.color">{{ player.name }}</span>
    <span v-if="!parallel">{{ $t(players.length === 1 ? 'is taking their turn' : 'are taking their turn') }}</span>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {ViewModel} from '@/common/models/PlayerModel';
import {playersToWaitFor, waitsInParallel} from '@/client/utils/playersToWaitFor';

const props = defineProps<{
  playerView: ViewModel;
}>();

const players = computed(() => playersToWaitFor(props.playerView));
const parallel = computed(() => waitsInParallel(props.playerView));
</script>
