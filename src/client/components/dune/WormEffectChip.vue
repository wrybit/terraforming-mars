<template>
  <!-- Effect of the worm as a chip: amounts with the resource picture, green gain, red loss, gold for the spice blow
       (every adjacent player tile gets one, so "×N"). On the map and in the result line (WormMoveInput.vue). -->
  <span :class="['worm-chip', 'worm-chip--' + chip.tone]">
    <span v-for="(item, index) in chip.items" :key="index" class="worm-chip__item">
      {{ (item.amount > 0 ? '+' : '−') + Math.abs(item.amount) }}<img :src="picture(item.resource)" alt="">
    </span>
    <span v-if="chip.times !== undefined" class="worm-chip__times">×{{ chip.times }}</span>
  </span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {WormChip} from './wormMoveDisplay';
import {duneGraphic} from './duneGraphic';

export default defineComponent({
  name: 'WormEffectChip',
  props: {
    chip: {
      type: Object as PropType<WormChip>,
      required: true,
    },
  },
  methods: {
    picture(resource: string): string {
      return duneGraphic(resource);
    },
  },
});
</script>
