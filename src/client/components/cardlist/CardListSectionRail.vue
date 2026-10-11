<template>
  <!-- Desktop: one tick per section at the right edge; fisheye around the pointer, the current section stands out -->
  <nav class="card-list-rail" :aria-label="$t('Sections')" @mousemove="pointerMoved" @mouseleave="pointerY = undefined">
    <button v-for="(section, index) in sections" :key="section.title" type="button"
      :class="['card-list-rail-tick', {'card-list-rail-tick--active': index === activeIndex}]"
      :style="tickStyle(index)"
      :aria-current="index === activeIndex ? 'true' : undefined"
      @click="$emit('jump', section.title)">
      <span class="card-list-rail-label" v-i18n>{{ section.title }}</span>
      <span class="card-list-rail-line" aria-hidden="true"></span>
    </button>
  </nav>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {fisheyeInfluence, RAIL_TICK_SPACING} from '@/client/components/cardlist/sectionRail';

export type RailSection = {title: string};

// Tick length at rest and how much the fisheye adds at its centre
const TICK_LENGTH = 14;
const TICK_GROWTH = 26;
// Without a pointer the current section bulges a little, with the pointer the fisheye is at full strength
const RESTING_STRENGTH = 0.55;

export default defineComponent({
  name: 'CardListSectionRail',
  props: {
    sections: {type: Array as PropType<ReadonlyArray<RailSection>>, required: true},
    activeIndex: {type: Number, required: true},
  },
  emits: ['jump'],
  data() {
    return {
      // Pointer position relative to the first tick's centre; undefined: the pointer is not on the rail
      pointerY: undefined as number | undefined,
    };
  },
  methods: {
    pointerMoved(event: MouseEvent): void {
      const rail = event.currentTarget as HTMLElement;
      const first = rail.firstElementChild?.getBoundingClientRect();
      if (first !== undefined) {
        this.pointerY = event.clientY - (first.top + first.height / 2);
      }
    },
    influence(index: number): number {
      const center = index * RAIL_TICK_SPACING;
      if (this.pointerY !== undefined) {
        return fisheyeInfluence(Math.abs(center - this.pointerY));
      }
      return RESTING_STRENGTH * fisheyeInfluence(Math.abs(center - this.activeIndex * RAIL_TICK_SPACING));
    },
    tickStyle(index: number): Record<string, string> {
      const influence = this.influence(index);
      return {
        '--rail-length': `${TICK_LENGTH + TICK_GROWTH * influence}px`,
        '--rail-influence': influence.toFixed(3),
        'height': `${RAIL_TICK_SPACING}px`,
      };
    },
  },
});
</script>
