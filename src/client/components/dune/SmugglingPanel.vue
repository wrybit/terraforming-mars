<template>
  <!-- Smuggling & suspicion (Dune module E): the suspicion track 0–5 with every player's marker -->
  <div class="dune-smuggling" data-test="dune-smuggling">
    <ol class="dune-smuggling__track">
      <li v-for="level in LEVELS" :key="level" :class="['dune-smuggling__step', {'dune-smuggling__step--penalty': penalty(level) > 0}]">
        <span class="dune-smuggling__level">{{ level }}</span>
        <span class="dune-smuggling__penalty">{{ penalty(level) > 0 ? '−' + penalty(level) : '' }}</span>
        <span class="dune-smuggling__markers">
          <span v-for="entry in at(level)" :key="entry.color" :class="['dune-smuggling__marker', 'player_bg_color_' + entry.color]" :title="name(entry.color)"></span>
        </span>
      </li>
    </ol>
    <p class="dune-board__hint">{{ $t('Move spice: up to 5 titanium for 5 M€ each. Black market: 2 for 1. Each raises suspicion by 1; a bribe (10 M€, Industrial Center owner 7) lowers it. End of generation: from 3 on, TR is lost.') }}</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {SmugglingModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';

const LEVELS = [0, 1, 2, 3, 4, 5];

export default defineComponent({
  name: 'SmugglingPanel',
  props: {
    smuggling: {
      type: Object as PropType<SmugglingModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
  },
  computed: {
    LEVELS(): typeof LEVELS {
      return LEVELS;
    },
  },
  methods: {
    // Same rule as server/dune/Smuggling.ts suspicionPenalty
    penalty(level: number): number {
      return Math.max(0, level - 2);
    },
    at(level: number) {
      return this.smuggling.suspicion.filter((entry) => entry.level === level);
    },
    name(color: Color): string {
      return this.players.find((player) => player.color === color)?.name ?? color;
    },
  },
});
</script>
