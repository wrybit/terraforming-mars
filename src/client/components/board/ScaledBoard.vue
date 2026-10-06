<template>
  <!-- The game board is a fixed ~700 px wide; in narrower containers it shrinks instead of being clipped -->
  <div :class="['scaled-board', {'scaled-board--planet': planetOnly}]">
    <div ref="scaled" class="scaled-board-content" :style="contentStyle">
      <Board :spaces="spaces" :expansions="expansions" :venusScaleLevel="0" :boardName="boardName"/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {BoardName} from '@/common/boards/BoardName';
import {Expansion} from '@/common/cards/GameModule';
import {SpaceModel} from '@/common/models/SpaceModel';
import Board from '@/client/components/Board.vue';
import {PLANET_BOUNDS} from '@/client/components/mobile/mobileBoardZoom';

// Empty game board outside the game (statistics, "Create game"), scaled to the width of its container
export default defineComponent({
  name: 'ScaledBoard',
  components: {Board},
  props: {
    spaces: {type: Array as PropType<ReadonlyArray<SpaceModel>>, required: true},
    boardName: {type: String as PropType<BoardName>, required: true},
    // Without expansions by default: this is about the board itself, not the Venus/Moon tracks
    expansions: {type: Object as PropType<Record<Expansion, boolean>>, default: () => ({})},
    // Only the planet: without the scales around it and the spaces outside it (board.less)
    planetOnly: {type: Boolean, default: false},
  },
  data() {
    return {
      scale: 1,
      // Width of the board at original size, measured at zoom 1
      naturalWidth: 0,
      resizeObserver: undefined as ResizeObserver | undefined,
    };
  },
  computed: {
    contentStyle(): Record<string, string | number> {
      if (!this.planetOnly) {
        return {zoom: this.scale};
      }
      return {
        'zoom': this.scale,
        '--planet-left': PLANET_BOUNDS.left + 'px',
        '--planet-top': PLANET_BOUNDS.top + 'px',
        'width': PLANET_BOUNDS.width + 'px',
        'height': PLANET_BOUNDS.height + 'px',
      };
    },
  },
  watch: {
    // Another board can be wider or narrower (outer spaces): measure again
    boardName() {
      this.measure();
    },
  },
  mounted() {
    this.measure();
    // Older browsers and test environments without ResizeObserver keep the first fit
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.fitToWidth());
      this.resizeObserver.observe(this.$el as HTMLElement);
    }
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
  },
  methods: {
    async measure(): Promise<void> {
      this.scale = 1;
      await this.$nextTick();
      this.naturalWidth = (this.$refs.scaled as HTMLElement | undefined)?.scrollWidth ?? 0;
      this.fitToWidth();
    },
    fitToWidth(): void {
      const available = (this.$el as HTMLElement).clientWidth;
      this.scale = this.naturalWidth <= 0 ? 1 : Math.min(1, available / this.naturalWidth);
    },
  },
});
</script>

<style scoped lang="less">
// Full width of the container, so the measurement knows how much room there is; the board centered in it
.scaled-board {
  display: flex;
  justify-content: center;
  width: 100%;
}

// The scales extend past the board left and right: include the room so the scaling covers them
.scaled-board-content {
  padding: 0 24px;
}

// Planet alone: the section of the planet, nothing sticks out
.scaled-board--planet .scaled-board-content {
  overflow: hidden;
  padding: 0;
}
</style>
