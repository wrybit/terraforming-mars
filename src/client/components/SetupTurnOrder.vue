<template>
  <!-- Turn order in the setup phase (instead of the player bars, which only show zeros there):
       numbered names in player color, the starting player first -->
  <div class="setup-turn-order">
    <!-- Game menu before the title: the same place as later in the players table (game_menu.less) -->
    <div class="setup-turn-order-title-row">
      <GameMenu/>
      <h2 class="setup-turn-order-title" v-i18n>Turn order</h2>
    </div>
    <ol class="setup-turn-order-list">
      <li v-for="(player, index) in players" :key="player.color"
        :class="['setup-turn-order-player', playerColorClass(player.color, 'bg'), {'setup-turn-order-player--first': index === 0}]">
        <span class="setup-turn-order-number">{{ index + 1 }}.</span>
        <span>{{ player.name }}</span>
      </li>
    </ol>
    <!-- Room for controls at the top right of the box (e.g. collapse the board, PlayerHome.vue) -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {playerColorClass} from '@/common/utils/utils';
import GameMenu from '@/client/components/gameMenu/GameMenu.vue';

defineProps<{
  // In turn order (starting player first), as delivered by the server
  players: ReadonlyArray<PublicPlayerModel>;
}>();
</script>
