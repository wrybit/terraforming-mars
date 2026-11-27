<template>
  <!-- The game at a glance, like the game list of the statistics: players as chips in their colour, then board,
       expansions and settings as the same chips (gameSetupChips.ts). Two rows of the details list. -->
  <dt v-i18n>Players</dt>
  <dd>
    <!-- Same chips as the settings, just in the player's colour -->
    <div class="create-game-summary create-game-summary--compact">
      <span v-for="player in view.players" :key="player.color" :class="['create-game-summary-chip', 'feedback-game__player', `feedback-game__player--${player.color}`]">
        {{ player.name }}
      </span>
    </div>
  </dd>
  <dt v-i18n>Settings</dt>
  <dd><GameSetupChips :chips="chips" compact /></dd>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {ViewModel} from '@/common/models/PlayerModel';
import GameSetupChips from '@/client/components/common/GameSetupChips.vue';
import {viewSetupChips} from '@/client/components/common/viewSetupChips';

const props = defineProps<{
  view: ViewModel;
}>();

const chips = computed(() => viewSetupChips(props.view));
</script>
