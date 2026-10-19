<template>
  <div :class="mainClass" :data_space_id="space.id" v-flash="flashKeys.moonSpace(space.id)">
    <BoardSpaceTile
      :space="space"
      :aresExtension="false"
      :tileView="tileView"
    />
    <div class="board-space-text" v-if="text" v-i18n>{{ text }}</div>
    <Bonus v-if="space.tileType === undefined || !showTiles" :bonus="space.bonus" />
    <div v-if="tileView === 'coords' && space.a9 !== undefined" class="board-space-coords">{{ space.a9 }}</div>
    <BoardCube v-if="space.color !== undefined && showTiles" class="board-cube" :color="space.color" :spinSeed="space.id"/>
    <BoardCube v-if="space.coOwner !== undefined && showTiles" class="board-cube-coOwner" :color="space.coOwner" :size="11" :spinSeed="space.id + '-co'"/>
    <div class="board-log-highlight" :data_log_highlight_id="space.id"></div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {SpaceModel} from '@/common/models/SpaceModel';
import Bonus from '@/client/components/Bonus.vue';
import BoardCube from '@/client/components/common/BoardCube.vue';
import {TileView, showsTiles} from '../board/TileView';
import BoardSpaceTile from '@/client/components/board/BoardSpaceTile.vue';
import {vFlash} from '@/client/directives/ChangeFlash';
import {flashKeys} from '@/client/utils/changeFlashKeys';

export default defineComponent({
  name: 'MoonSpace',
  props: {
    space: {
      type: Object as () => SpaceModel,
      required: true,
    },
    text: {
      type: String,
      required: false,
    },
    tileView: {
      type: String as () => TileView,
      default: 'show',
    },
  },
  directives: {
    flash: vFlash,
  },
  components: {
    Bonus,
    BoardSpaceTile,
    BoardCube,
  },
  computed: {
    showTiles(): boolean {
      return showsTiles(this.tileView);
    },
    flashKeys(): typeof flashKeys {
      return flashKeys;
    },
    mainClass(): string {
      let css = 'board-space moon-space-' + this.space.id.toString();
      css += ' board-space-selectable';

      if (this.space.spaceType === 'lunar_mine') {
        css += ' moon-space-type-mine';
      } else {
        css += ' moon-space-type-other';
      }

      return css;
    },
  },
});
</script>
