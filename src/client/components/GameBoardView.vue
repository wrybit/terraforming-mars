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
        @click="onBoardClick($event, 'mars')"
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
      <!-- Enlarges on click like Mars (BoardZoomModal) -->
      <MoonBoard v-if="game.moon" ref="columnMoon" :model="game.moon" :tileView="tileView" ring id="shortkey-moonBoard"
        class="board-cont--zoomable" @click="onBoardClick($event, 'moon')"/>
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
  <BoardZoomModal :open="boardZoomOpen" :origin="columnBoardElement" :frame="zoomBoard === 'mars' ? marsZoomFrame : undefined"
    @close="closeBoardZoom" @rendered="notifyZoomBoardRendered" @hidden="notifyZoomBoardHidden">
    <template #banner>
      <PlacementBanner v-if="placementDescription !== undefined" :description="placementDescription"/>
    </template>
    <MoonBoard v-if="zoomBoard === 'moon' && game.moon" :model="game.moon" :tileView="tileView" ring/>
    <Board
      v-else
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
import PlacementBanner from '@/client/components/board/PlacementBanner.vue';
import {describePlacement, PlacementDescription} from '@/client/components/board/placementDescription';
import OuterSpaceCorners from '@/client/components/board/OuterSpaceCorners.vue';
import {mobileLayout} from '@/client/utils/mobileLayout';
import {MarsFrame, marsFrame} from '@/client/components/mobile/mobileBoardZoom';
import {isBoardPlacementActive} from '@/client/components/board/boardPlacementActive';
import {ZoomBoard, notifyZoomBoardHidden, notifyZoomBoardRendered, placementZoom, releasePlacementZoom} from '@/client/components/board/placementZoom';
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
      // Board shown in the enlargement modal (Mars or Moon)
      zoomBoard: 'mars' as ZoomBoard,
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
    PlacementBanner,
    DeltaBoard,
    Milestones,
    Awards,
    MilestoneAwardTable,
    TurmoilBoard,
    MoonBoard,
    PlanetsBoard,
  },
  computed: {
    // Only during a space selection on the board shown large (not when Mars is merely enlarged for viewing)
    placementDescription(): PlacementDescription | undefined {
      const title = placementZoom.inputTitle;
      return title === undefined ? undefined : describePlacement(title, this.game);
    },
    // Phone/tablet layout: the special spaces sit in the board as columns of the visible section (Board.vue)
    mobileLayout(): boolean {
      return mobileLayout.value;
    },
    // Large Mars shows the section of the mobile tab (planet without ring when there is no Venus, else ring with columns)
    marsZoomFrame(): MarsFrame {
      return marsFrame(this.mobileLayout && !this.game.gameOptions.expansions.venus);
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
          this.openBoardZoom(placementZoom.board);
        } else {
          this.boardZoomOpen = false;
        }
      },
    },
  },
  methods: {
    openBoardZoom(board: ZoomBoard) {
      this.zoomBoard = board;
      const columnRef = board === 'moon' ? this.$refs.columnMoon : this.$refs.columnBoard;
      this.columnBoardElement = (columnRef as {$el?: HTMLElement} | undefined)?.$el;
      this.boardZoomOpen = true;
    },
    // Closing via backdrop, ✕ or Escape: an ongoing space selection continues on the small board
    closeBoardZoom() {
      this.boardZoomOpen = false;
      releasePlacementZoom();
    },
    notifyZoomBoardRendered,
    notifyZoomBoardHidden,
    // Clicking Mars or the Moon enlarges it – except during a space selection
    // and on the board's controls
    onBoardClick(event: MouseEvent, board: ZoomBoard) {
      const target = event.target as HTMLElement | null;
      if (target !== null && target.closest('.hide-tile-button') !== null) {
        return;
      }
      if (isBoardPlacementActive()) {
        return;
      }
      this.openBoardZoom(board);
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
