<template>
  <!-- A player as a small chip in their colour (panels of the Dune tab) -->
  <span :class="['dune-player-chip', 'player_bg_color_' + color]">{{ name }}</span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

export default defineComponent({
  name: 'PlayerChip',
  props: {
    color: {
      type: String as PropType<Color>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
  },
  computed: {
    name(): string {
      return this.players.find((player) => player.color === this.color)?.name ?? this.color;
    },
  },
});
</script>
