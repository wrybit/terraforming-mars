<template>
  <div class="planets-board">
    <!-- Planets board tab (Pathfinders): one row per planet track with the marker, every reward as a chip below
         its space (own / for everyone) and on the right how many tags are missing for the next reward -->
    <BoardTrackRow v-for="track in tracks" :key="track.key" :name="$t(track.name)" :cells="track.cells" :bonuses="track.bonuses"
      :data-test="'planet-track-' + track.key">
      <template #image><span class="board-track-row__picture"><img :src="'assets/tags/' + track.tag + '.png'" alt=""></span></template>
      <template #value>
        <template v-if="track.missing !== undefined">{{ track.missing }}×<img :src="'assets/tags/' + track.tag + '.png'" alt=""></template>
      </template>
      <template #sub>{{ track.missing !== undefined ? $t('tags to next reward') : '' }}</template>
    </BoardTrackRow>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {PathfindersModel} from '@/common/models/PathfindersModel';
import {GameOptionsModel} from '@/common/models/GameOptionsModel';
import {PLANETARY_TRACKS} from '@/common/pathfinders/PlanetaryTracks';
import BoardTrackRow from '@/client/components/trackBonus/BoardTrackRow.vue';
import {LaneEntry} from '@/client/components/trackBonus/trackBonus';
import {TrackCell, cellState} from '@/client/components/trackBonus/trackCell';
import {isRewardSpace, trackLane} from './planetTrackRewards';

type PlanetKey = keyof PathfindersModel;

type PlanetRow = {
  key: PlanetKey;
  tag: string;
  name: string;
  cells: Array<TrackCell>;
  bonuses: Record<number, Array<LaneEntry>>;
  missing: number | undefined;
};

const PLANETS: ReadonlyArray<{key: PlanetKey, tag: string, name: string}> = [
  {key: 'venus', tag: 'venus', name: 'Venus'},
  {key: 'earth', tag: 'earth', name: 'Earth'},
  {key: 'mars', tag: 'mars', name: 'Mars'},
  {key: 'jovian', tag: 'jovian', name: 'Jupiter'},
  {key: 'moon', tag: 'moon', name: 'Moon'},
];

export default defineComponent({
  name: 'PlanetsBoard',
  components: {BoardTrackRow},
  props: {
    model: {
      type: Object as PropType<PathfindersModel>,
      required: true,
    },
    gameOptions: {
      type: Object as PropType<GameOptionsModel>,
      required: true,
    },
  },
  computed: {
    tracks(): Array<PlanetRow> {
      const turmoil = this.gameOptions.expansions.turmoil;
      return PLANETS.map((planet) => {
        const spaces = PLANETARY_TRACKS[planet.key].spaces;
        const position = this.model[planet.key];
        const next = spaces.findIndex((space, index) => index > position && isRewardSpace(space));
        return {
          ...planet,
          cells: spaces.map((space, index) => ({label: String(index), state: cellState(index, position), reward: isRewardSpace(space)})),
          bonuses: trackLane(spaces, position, turmoil),
          missing: next > 0 ? next - position : undefined,
        };
      });
    },
  },
});
</script>
