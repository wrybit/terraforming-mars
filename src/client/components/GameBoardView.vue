<!-- Common widgets between player and spectator views -->
<template>
  <a name="board" class="player_home_anchor hotkey-target"></a>
  <Board
    ref="columnBoard"
    v-bind="boardProps"
    @toggleTileView="$emit('toggleTileView')"
    @click="onBoardClick"
    class="board-cont--zoomable"
    id="shortkey-board"
  />

  <!-- Zweite Brett-Instanz nur zum Ansehen. Die IDs darin (main_board usw.) gibt es dann doppelt;
       getElementById liefert aber das erste Vorkommen, und das Modal hängt am Ende von body -->
  <BoardZoomModal :open="boardZoomOpen" :origin="columnBoardElement" @close="closeBoardZoom" @rendered="notifyZoomBoardRendered" @hidden="notifyZoomBoardHidden">
    <Board
      v-bind="boardProps"
      @toggleTileView="$emit('toggleTileView')"
    />
  </BoardZoomModal>

  <template v-if="game.turmoil">
    <a class="hotkey-target"></a>
    <Turmoil :turmoil="game.turmoil"/>
  </template>

  <template v-if="game.moon">
    <a class="hotkey-target"></a>
    <MoonBoard :model="game.moon" :tileView="tileView" id="shortkey-moonBoard"/>
  </template>

  <template v-if="game.gameOptions.expansions.pathfinders">
    <a class="hotkey-target"></a>
    <PlanetaryTracks :tracks="game.pathfinders" :gameOptions="game.gameOptions"/>
  </template>

  <DeltaProjectBoard v-if="game.gameOptions.expansions.deltaProject" :players="players"/>

  <div v-if="players.length > 1" class="player_home_block--milestones-and-awards">
    <a class="hotkey-target"></a>
    <Milestones :milestones="game.milestones" />
    <Awards :awards="game.awards" />
    <!-- Dieselben Daten als Tabelle; sichtbar nur im Zwei-Spalten-Layout (milestone_award_table.less) -->
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
import BoardZoomModal from '@/client/components/board/BoardZoomModal.vue';
import {isBoardPlacementActive} from '@/client/components/board/boardPlacementActive';
import {notifyZoomBoardHidden, notifyZoomBoardRendered, placementZoom, releasePlacementZoom} from '@/client/components/board/placementZoom';
import DeltaProjectBoard from '@/client/components/delta/DeltaProjectBoard.vue';
import Milestones from '@/client/components/Milestones.vue';
import Awards from '@/client/components/Awards.vue';
import MilestoneAwardTable from '@/client/components/milestoneAwardTable/MilestoneAwardTable.vue';
import Turmoil from '@/client/components/turmoil/Turmoil.vue';
import MoonBoard from '@/client/components/moon/MoonBoard.vue';
import PlanetaryTracks from '@/client/components/pathfinders/PlanetaryTracks.vue';
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
    // Eigener Spieler (fehlt bei Zuschauern): steht in der Meilenstein-Tabelle zuletzt und hervorgehoben
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
      // Startpunkt der Zoom-Animation; erst nach dem Mounten bekannt
      columnBoardElement: undefined as HTMLElement | undefined,
    };
  },
  components: {
    Board,
    BoardZoomModal,
    DeltaProjectBoard,
    Milestones,
    Awards,
    MilestoneAwardTable,
    Turmoil,
    MoonBoard,
    PlanetaryTracks,
  },
  computed: {
    // Gleiche Props für das Brett in der Spalte und im Vergrößerungs-Modal
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
    // Plättchen platzieren: Brett groß per Button in der Feldwahl, nach der Bestätigung wieder klein (placementZoom.ts)
    // immediate: Die Feldwahl kann vor dem Brett gemountet sein (z. B. beim Neuladen der Seite)
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
    // Schließen per Hintergrund, ✕ oder Escape: eine laufende Feldwahl geht auf dem kleinen Brett weiter
    closeBoardZoom() {
      this.boardZoomOpen = false;
      releasePlacementZoom();
    },
    notifyZoomBoardRendered,
    notifyZoomBoardHidden,
    // Klick auf den Mars vergrößert ihn – außer während einer Feldwahl
    // und auf Bedienelementen des Bretts
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
