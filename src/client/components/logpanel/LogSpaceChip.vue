<template>
  <span class="log-space-id" data-test="log-space-chip" @click.stop.prevent="$emit('spaceClicked', space)">
    <!-- Space of the board as in the classic log: marker and coordinate, a click highlights the space -->
    <svg width="20" height="14" viewBox="0 0 28 38">
      <circle cx="14" cy="19" r="16" stroke="black" stroke-width="1" transform="translate(0, 2)" :fill="space.startsWith('m') ? 'gray' : '#b7410e'" />
    </svg>
    {{ label }}
  </span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {SpaceId} from '@/common/Types';
import {spaceLabel} from '@/client/utils/spaceLabel';

export default defineComponent({
  name: 'LogSpaceChip',
  props: {
    space: {
      type: String as PropType<SpaceId>,
      required: true,
    },
    game: {
      type: Object as PropType<GameModel>,
      required: true,
    },
  },
  emits: ['spaceClicked'],
  computed: {
    label(): string {
      return spaceLabel(this.game, this.space);
    },
  },
});
</script>
