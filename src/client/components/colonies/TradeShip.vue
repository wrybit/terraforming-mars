<template>
  <!-- Trade fleet as an acrylic shuttle in the player colour (pictures baked in 3D like the player cubes) -->
  <img class="trade-ship" :src="'assets/acrylic/shuttle-' + shipColor + '.png'" :width="size" :height="size" alt="">
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';

const SHIP_COLORS: ReadonlyArray<string> = ['red', 'yellow', 'green', 'black', 'blue', 'purple', 'orange', 'pink', 'neutral'];

export default defineComponent({
  name: 'TradeShip',
  props: {
    color: {
      type: String as PropType<Color>,
      required: true,
    },
    size: {
      type: Number,
      default: 28,
    },
  },
  computed: {
    shipColor(): string {
      return SHIP_COLORS.includes(this.color) ? this.color : 'neutral';
    },
  },
});
</script>
