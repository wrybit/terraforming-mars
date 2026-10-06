<!-- Common widgets between player and spectator views -->
<template>
  <a name="board" class="player_home_anchor hotkey-target"></a>
  <!-- Board tabs: Mars and the expansion boards of this game share one box (BoardTabs.vue) -->
  <BoardTabs :game="game" :players="players" :tileView="tileView" @toggleTileView="$emit('toggleTileView')">
    <template #mars>
      <Board
        ref="columnBoard"
        v-bind="boardProps"
        :outerSpacesInCorners="!mobileLayout"
        @toggleTileView="$emit('toggleTileView')"
        @click="onBoardClick"
        class="board-cont--zoomable"
        id="shortkey-board"
      />
      <!-- Desktop: the special spaces off Mars in the corners of the box -->
      <OuterSpaceCorners v-if="!mobileLayout" :spaces="game.spaces" :tileView="tileView"/>
    </template>
    <!-- Caller's content next to Mars inside the Mars tab (mobile: parameter bars) -->
    <template #marsAside>
      <slot name="marsAside"></slot>
    </template>
    <template #moon>
      <MoonBoard v-if="game.moon" :model="game.moon" :tileView="tileView" ring id="shortkey-moonBoard"/>
    </template>
    <template #colonies>
      <ColoniesBoard :colonies="game.colonies" :players="players" :viewerColor="viewerColor"/>
    </template>
    <template #turmoil>
      <TurmoilBoard v-if="game.turmoil" :turmoil="game.turmoil" :players="players" :viewerColor="viewerColor" :generation="game.generation"/>
    </template>
    <template #paths>
      <PlanetsBoard v-if="game.pathfinders" :model="game.pathfinders" :gameOptions="game.gameOptions"/>
    </template>
    <template #delta>
      <DeltaBoard :players="players" :viewerColor="viewerColor"/>
    </template>
  </BoardTabs>

  <!-- Second board instance for viewing only. The IDs in it (main_board etc.) then exist twice;
       getElementById returns the first occurrence though, and the modal is attached at the end of body -->
  <BoardZoomModal :open="boardZoomOpen" :origin="columnBoardElement" @close="closeBoardZoom" @rendered="notifyZoomBoardRendered" @hidden="notifyZoomBoardHidden">
    <Board
      v-bind="boardProps"
      @toggleTileView="$emit('toggleTileView')"
    />
  </BoardZoomModal>

  <div v-if="players.length > 1" class="player_home_block--milestones-and-awards">
    <a class="hotkey-target"></a>
    <Milestones :milestones="game.milestones" />
    <Awards :awards="game.awards" />
    <!-- The same data as a table; only visible in the two-column layout (milestone_award_table.less) -->
    <MilestoneAwardTable :milestones="game.milestones" :awards="game.awards" :players="players" :viewerColor="viewerColor"/>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';

import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {SpaceId} from '@/common/Types';
import {Color} from '@/common/Color';
import Board from '@/client/components/Board.vue';
import BoardTabs from '@/client/components/boardTabs/BoardTabs.vue';
import ColoniesBoard from '@/client/components/colonies/ColoniesBoard.vue';
import BoardZoomModal from '@/client/components/board/BoardZoomModal.vue';
import OuterSpaceCorners from '@/client/components/board/OuterSpaceCorners.vue';
import {mobileLayout} from '@/client/utils/mobileLayout';
import {isBoardPlacementActive} from '@/client/components/board/boardPlacementActive';
import {notifyZoomBoardHidden, notifyZoomBoardRendered, placementZoom, releasePlacementZoom} from '@/client/components/board/placementZoom';
import DeltaBoard from '@/client/components/delta/DeltaBoard.vue';
import Milestones from '@/client/components/Milestones.vue';
import Awards from '@/client/components/Awards.vue';
import MilestoneAwardTable from '@/client/components/milestoneAwardTable/MilestoneAwardTable.vue';
import TurmoilBoard from '@/client/components/turmoil/TurmoilBoard.vue';
import MoonBoard from '@/client/components/moon/MoonBoard.vue';
import PlanetsBoard from '@/client/components/pathfinders/PlanetsBoard.vue';
import {TileView} from './board/TileView';
import {scrollToSpace} from '@/client/utils/boardScroll';

export default defineComponent({
  name: 'GameBoardView',
  props: {
    game: {
      type: Object as () => GameModel,
      required: true,
    },
    tileView: {
      type: String as () => TileView,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    // Own player (missing for spectators): listed last and highlighted in the milestone table
    viewerColor: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
  },
  emits: ['toggleTileView'],
  setup() {
    return {placementZoom};
  },
  data() {
    return {
      boardZoomOpen: false,
      // Start point of the zoom animation; only known after mounting
      columnBoardElement: undefined as HTMLElement | undefined,
    };
  },
  components: {
    OuterSpaceCorners,
    Board,
    BoardTabs,
    ColoniesBoard,
    BoardZoomModal,
    DeltaBoard,
    Milestones,
    Awards,
    MilestoneAwardTable,
    TurmoilBoard,
    MoonBoard,
    PlanetsBoard,
  },
  computed: {
    // Phone/tablet layout keeps the special spaces at their board positions (mobile.less)
    mobileLayout(): boolean {
      return mobileLayout.value;
    },
    // Same props for the board in the column and in the enlargement modal
    boardProps() {
      return {
        spaces: this.game.spaces,
        expansions: this.game.gameOptions.expansions,
        venusScaleLevel: this.game.venusScaleLevel,
        boardName: this.game.gameOptions.boardName,
        oceans_count: this.game.oceans,
        oxygen_level: this.game.oxygenLevel,
        temperature: this.game.temperature,
        altVenusBoard: this.game.gameOptions.altVenusBoard,
        aresData: this.game.aresData,
        tileView: this.tileView,
      };
    },
  },
  watch: {
    // Placing tiles: board enlarged via button in the space selection, small again after confirming (placementZoom.ts)
    // immediate: the space selection may be mounted before the board (e.g. when reloading the page)
    'placementZoom.requested': {
      immediate: true,
      handler(requested: boolean) {
        if (requested) {
          this.openBoardZoom();
        } else {
          this.boardZoomOpen = false;
        }
      },
    },
  },
  methods: {
    openBoardZoom() {
      this.columnBoardElement = (this.$refs.columnBoard as {$el?: HTMLElement} | undefined)?.$el;
      this.boardZoomOpen = true;
    },
    // Closing via backdrop, ✕ or Escape: an ongoing space selection continues on the small board
    closeBoardZoom() {
      this.boardZoomOpen = false;
      releasePlacementZoom();
    },
    notifyZoomBoardRendered,
    notifyZoomBoardHidden,
    // Clicking Mars enlarges it – except during a space selection
    // and on the board's controls
    onBoardClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target !== null && target.closest('.hide-tile-button') !== null) {
        return;
      }
      if (isBoardPlacementActive()) {
        return;
      }
      this.openBoardZoom();
    },
    highlightSpace(spaceId: SpaceId) {
      scrollToSpace(spaceId);

      const regions = ['main_board', 'moon_board', 'moon_board_outer_spaces'];
      for (const region of regions) {
        const board = document.getElementById(region);
        if (board !== null) {
          const array = board.getElementsByClassName('board-log-highlight');
          for (let i = 0, length = array.length; i < length; i++) {
            const element = array[i] as HTMLElement;
            if (element.getAttribute('data_log_highlight_id') === spaceId) {
              element.classList.add('highlight');
              setTimeout(() => {
                element.classList.remove('highlight');
              }, 3000);
              return;
            }
          }
        }
      }
    },
  },
});
</script>
