<template>
  <!-- One Arrakis space outside the board (worm map, Kanly war field): its terrain as a coloured hex, on it the space as
       on the board – tile, owner's cube, worm and war-field marker (BoardSpace.vue) -->
  <div :class="['arrakis-hex', 'arrakis-hex--' + zone]">
    <BoardSpace v-if="space !== undefined" :space="space" tileView="show"/>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {SpaceModel} from '@/common/models/SpaceModel';
import {BoardName} from '@/common/boards/BoardName';
import {arrakisLayout} from '@/common/dune/arrakisLayout';
import BoardSpace from '@/client/components/BoardSpace.vue';

export default defineComponent({
  name: 'ArrakisHex',
  components: {BoardSpace},
  props: {
    spaceId: {
      type: String,
      required: true,
    },
    space: {
      type: Object as PropType<SpaceModel | undefined>,
      default: undefined,
    },
    /** The game's Arrakis board (standard or large): names its spaces and gives their terrain */
    board: {
      type: String as PropType<BoardName>,
      default: BoardName.ARRAKIS,
    },
  },
  computed: {
    zone(): string {
      return arrakisLayout(this.board).zones[this.spaceId] ?? 'erg';
    },
  },
});
</script>
