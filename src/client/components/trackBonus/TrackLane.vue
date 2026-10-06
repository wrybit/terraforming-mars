<template>
  <!-- Bonus lane below a horizontal track: one cell per track space, the chips hang below their space on one
       connector line (pyramid: whoever moves the track there on top, the "everyone" chips below in pairs) -->
  <div class="track-lane">
    <span v-for="index in count" :key="index" class="track-lane__cell">
      <span v-if="(bonuses[index - 1] ?? []).length > 0" :class="['track-bonus-pin', 'track-bonus-pin--up', {'track-bonus-pin--done': allDone(index - 1)}]">
        <span class="track-bonus-link"></span>
        <span v-for="(row, rowIndex) in rows(index - 1)" :key="rowIndex" class="track-bonus-pin__row">
          <TrackBonusChip v-for="(entry, entryIndex) in row" :key="entryIndex" :bonus="entry.bonus" :kind="entry.kind"/>
        </span>
      </span>
    </span>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import TrackBonusChip from './TrackBonusChip.vue';
import {LaneEntry} from './trackBonus';

export default defineComponent({
  name: 'TrackLane',
  components: {TrackBonusChip},
  props: {
    count: {
      type: Number,
      required: true,
    },
    // Chips per space index
    bonuses: {
      type: Object as PropType<Record<number, ReadonlyArray<LaneEntry>>>,
      required: true,
    },
  },
  methods: {
    rows(index: number): Array<ReadonlyArray<LaneEntry>> {
      const list = this.bonuses[index] ?? [];
      const sorted = [...list.filter((entry) => entry.kind !== 'everyone'), ...list.filter((entry) => entry.kind === 'everyone')];
      const rows: Array<ReadonlyArray<LaneEntry>> = sorted.length > 0 ? [sorted.slice(0, 1)] : [];
      for (let start = 1; start < sorted.length; start += 2) {
        rows.push(sorted.slice(start, start + 2));
      }
      return rows;
    },
    allDone(index: number): boolean {
      return (this.bonuses[index] ?? []).every((entry) => entry.kind === 'done');
    },
  },
});
</script>
