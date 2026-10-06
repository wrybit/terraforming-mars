<template>
  <div class="delta-board" :style="{'--delta-rows': players.length}">
    <!-- --delta-rows: the rows share the box height, so more players make every row thinner (track_bonus.less) -->
    <!-- Delta board tab: one row per player in its colour (own row outlined) – position on the shared track,
         the reward of every space as a chip, and whether the next space is reachable now (energy, tag) -->
    <BoardTrackRow v-for="player in players" :key="player.color" :name="player.name" :cells="cells(player)" :bonuses="lane(player)"
      :class="['delta-board__row', 'player_translucent_bg_color_' + player.color, {'delta-board__row--self': player.color === viewerColor}]"
      :data-test="'delta-row-' + player.color">
      <template #image><span class="board-track-row__picture"><PlayerCube :color="player.color" view="slight" :size="22"/></span></template>
      <template #value>
        <template v-if="next(player) !== undefined">
          <img v-if="next(player)!.space.tag !== undefined" :src="'assets/tags/' + next(player)!.space.tag + '.png'" alt="">
          <span v-else class="track-bonus-chip__vp">{{ next(player)!.space.victoryPoints }}</span>
        </template>
      </template>
      <template #sub>
        <template v-if="next(player) !== undefined">
          <span class="delta-board__next"><span class="delta-board__next-label">{{ $t('Next reward') }}:</span> <b>{{ $t(next(player)!.space.label ?? '') }}</b></span>
          <span class="delta-board__state">
            <span :class="next(player)!.blocker === undefined ? 'delta-board__ok' : 'delta-board__blocked'">{{ $t(stateText(player)) }}</span>
            · <img class="delta-board__energy" src="assets/resources/power.png" alt=""> <b>{{ player.energy }}</b>
          </span>
        </template>
      </template>
    </BoardTrackRow>
    <div class="delta-board__hint">{{ $t('Symbol in the space = what you need · chip below = what you get · 1 energy per step (a wild tag covers one symbol) · only the final space scores: 2 or 5 VP, one player each') }}</div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import BoardTrackRow from '@/client/components/trackBonus/BoardTrackRow.vue';
import {LaneEntry} from '@/client/components/trackBonus/trackBonus';
import {TrackCell, cellState} from '@/client/components/trackBonus/trackCell';
import {DELTA_SPACES, DeltaNext, deltaLane, deltaNext, deltaPosition} from './deltaTrack';

export default defineComponent({
  name: 'DeltaBoard',
  components: {BoardTrackRow, PlayerCube},
  props: {
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    viewerColor: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
  },
  methods: {
    cells(player: PublicPlayerModel): Array<TrackCell> {
      const position = deltaPosition(player);
      const next = deltaNext(player);
      return DELTA_SPACES.map((space, index) => {
        let state = cellState(index, position);
        if (index === position + 1 && next !== undefined) {
          state = next.blocker === undefined ? 'reachable' : 'blocked';
        }
        return {
          label: space.victoryPoints !== undefined ? String(space.victoryPoints) : index === 0 ? '0' : undefined,
          icon: space.tag !== undefined ? 'tags/' + space.tag + '.png' : undefined,
          state,
          reward: true,
        };
      });
    },
    lane(player: PublicPlayerModel): Record<number, Array<LaneEntry>> {
      return deltaLane(deltaPosition(player));
    },
    next(player: PublicPlayerModel): DeltaNext | undefined {
      return deltaNext(player);
    },
    stateText(player: PublicPlayerModel): string {
      switch (deltaNext(player)?.blocker) {
      case 'energy':
        return 'no energy';
      case 'tag':
        return 'tag missing';
      default:
        return 'reachable';
      }
    },
  },
});
</script>
