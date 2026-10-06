<template>
  <!-- Special spaces off Mars in the four corners of the board box, grouped by origin (outerSpaces.ts):
       the round planet leaves the corners free. Placed relative to the box, not to the board, because the
       board is zoomed and shifted (rightColumnFit.ts); the hexes still get the size of the Mars spaces. -->
  <div ref="root" class="board-outer-spaces board-outer-spaces--corners" id="colony_spaces" :style="{'--outer-hex-scale': hexScale}">
    <div v-for="group in groups" :key="group.corner" :class="['board-outer-group', 'board-outer-group--' + group.corner]">
      <span v-if="group.title !== undefined" class="board-outer-group__title" v-i18n>{{ group.title }}</span>
      <BoardSpace v-for="outer in group.spaces" :key="outer.id" :space="spaceOf(outer.id)" :text="outer.short" :title="$t(outer.name)" :tileView="tileView"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import BoardSpace from '@/client/components/BoardSpace.vue';
import {SpaceModel} from '@/common/models/SpaceModel';
import {SpaceId} from '@/common/Types';
import {TileView} from '@/client/components/board/TileView';
import {outerGroups} from '@/client/components/board/outerSpaces';

const props = defineProps<{
  spaces: ReadonlyArray<SpaceModel>;
  tileView: TileView;
}>();

// Width of a Mars space at zoom 1 (board.less .board-space)
const MARS_SPACE_WIDTH = 46;

const spaceMap = computed(() => new Map(props.spaces.map((space) => [space.id, space])));
const groups = computed(() => outerGroups((id) => spaceMap.value.has(id)));
const hexScale = ref(1);

function spaceOf(id: SpaceId): SpaceModel {
  return spaceMap.value.get(id) as SpaceModel;
}

// Measure a Mars space in the box: the corner hexes take over its rendered size
let observer: ResizeObserver | undefined;
const root = ref<HTMLElement>();
function measure(panel: Element) {
  const marsSpace = panel.querySelector('#main_board .board-space');
  const width = marsSpace?.getBoundingClientRect().width ?? 0;
  if (width > 0) {
    hexScale.value = Math.round(width / MARS_SPACE_WIDTH * 1000) / 1000;
  }
}

onMounted(() => {
  const panel = root.value?.closest('.board-tabs-panel');
  if (panel === null || panel === undefined) {
    return;
  }
  measure(panel);
  observer = new ResizeObserver(() => measure(panel));
  observer.observe(panel);
  const board = panel.querySelector('.board-cont');
  if (board !== null) {
    observer.observe(board);
  }
});

onBeforeUnmount(() => observer?.disconnect());
</script>
