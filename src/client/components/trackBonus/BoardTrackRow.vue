<template>
  <!-- One horizontal track row (planet tracks, Delta Project): picture and name on the left, the spaces with the
       marker, the bonus lane below, the key value on the right -->
  <div class="board-track-row">
    <span class="board-track-row__head">
      <slot name="image"></slot>
      <span class="board-track-row__name">{{ name }}</span>
    </span>
    <div class="board-track-row__body">
      <div :class="['board-track-row__track', {'board-track-row__track--long': cells.length > 12}]">
        <span v-for="(cell, index) in cells" :key="index" :class="cellClasses(cell)">
          <img v-if="cell.icon !== undefined" :src="'assets/' + cell.icon" alt="">
          <template v-else>{{ cell.label }}</template>
        </span>
      </div>
      <TrackLane :count="cells.length" :bonuses="bonuses"/>
    </div>
    <div class="board-track-row__value">
      <span class="board-track-row__big"><slot name="value"></slot></span>
      <span class="board-track-row__sub"><slot name="sub"></slot></span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import TrackLane from './TrackLane.vue';
import {LaneEntry} from './trackBonus';
import {TrackCell} from './trackCell';

export default defineComponent({
  name: 'BoardTrackRow',
  components: {TrackLane},
  props: {
    name: {
      type: String,
      required: true,
    },
    cells: {
      type: Array as PropType<ReadonlyArray<TrackCell>>,
      required: true,
    },
    bonuses: {
      type: Object as PropType<Record<number, ReadonlyArray<LaneEntry>>>,
      required: true,
    },
  },
  methods: {
    cellClasses(cell: TrackCell): Array<string> {
      const classes = ['board-track-row__cell'];
      if (cell.state !== undefined) {
        classes.push('board-track-row__cell--' + cell.state);
      }
      if (cell.reward) {
        classes.push('board-track-row__cell--reward');
      }
      return classes;
    },
  },
});
</script>
