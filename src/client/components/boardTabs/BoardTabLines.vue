<template>
  <!-- Short info of an inactive board tab: one thin segmented line per track (boardTabs.ts) -->
  <span class="board-tab-lines" aria-hidden="true">
    <span v-for="(track, trackIndex) in tracks" :key="trackIndex"
      :class="['board-tab-line', {'board-tab-line--fine': track.total > 12}]"
      :style="{'--line-color': track.color, '--line-height': lineHeight + 'px'}">
      <i v-for="cell in cells(track)" :key="cell.index" :class="cell.classes" :style="cell.style"></i>
    </span>
  </span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {BoardTabTrack} from './boardTabs';

type Cell = {
  index: number;
  classes: Array<string>;
  style: Record<string, string>;
};

// Player colours of the markers on the Delta line (same as the colour cubes)
const MARKER_COLOR: Record<string, string> = {
  red: '#e5533d', green: '#4caf50', blue: '#3f8ed8', yellow: '#e0c23a', black: '#777', purple: '#a06ad9', orange: '#e08a2e', pink: '#e06aa8', neutral: '#ccc',
};

export default defineComponent({
  name: 'BoardTabLines',
  props: {
    tracks: {
      type: Array as PropType<ReadonlyArray<BoardTabTrack>>,
      required: true,
    },
  },
  computed: {
    // Many tracks get thinner lines so the tab height stays the same
    lineHeight(): number {
      return this.tracks.length > 4 ? 3 : this.tracks.length === 1 ? 6 : 4;
    },
  },
  methods: {
    cells(track: BoardTabTrack): Array<Cell> {
      const next = track.bonus.find((step) => step > track.step);
      return Array.from({length: track.total}, (_, index) => {
        const number = index + 1;
        const marker = track.markers?.find((m) => m.at === index);
        const classes: Array<string> = [];
        if (track.markers === undefined && index < track.step) {
          classes.push('board-tab-line__on');
        }
        // Bonus already passed: subtle dark dot in the filled segment
        if (track.markers === undefined && track.bonus.includes(number) && number <= track.step) {
          classes.push('board-tab-line__claimed');
        }
        if (number === next) {
          classes.push('board-tab-line__next');
        }
        const style: Record<string, string> = marker ? {background: MARKER_COLOR[marker.color] ?? '#fff'} : {};
        return {index, classes, style};
      });
    },
  },
});
</script>
