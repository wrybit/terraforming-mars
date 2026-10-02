<template>
  <button type="button" class="mb-top">
    <!-- Fixed header of the mobile view: generation and global parameters; optionally own money on the right (slot).
         Comment inside so the root stays a single element (click and aria-label are passed through) -->
    <span class="mb-top-gen">{{ $t('GEN') }} <b>{{ game.generation }}</b></span>
    <span class="mb-top-globals">
      <span class="mb-top-global"><img src="assets/global-parameters/oxygen.png" alt="">{{ game.oxygenLevel }} %</span>
      <span class="mb-top-global"><img src="assets/global-parameters/temperature.png" alt="">{{ game.temperature }} °C</span>
      <span class="mb-top-global"><img src="assets/tiles/ocean.png" alt="">{{ game.oceans }}/{{ MAX_OCEAN_TILES }}</span>
      <span v-if="game.gameOptions.expansions.venus" class="mb-top-global"><img src="assets/global-parameters/venus.png" alt="">{{ game.venusScaleLevel }} %</span>
    </span>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import {MAX_OCEAN_TILES} from '@/common/constants';
import {GameModel} from '@/common/models/GameModel';

defineProps<{
  game: GameModel;
}>();
</script>
