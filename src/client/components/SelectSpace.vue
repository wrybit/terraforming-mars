<template>
  <div class="select_space_cont">
    <!-- Confirmation as a speech bubble at the chosen space (opens to the left if there's no room on the right) -->
    <SpaceConfirmPopover
        :anchor="confirmAnchor"
        @accept="confirmPlacement"
        @dismiss="cancelPlacement"
        @hide="hideDialog" />
    <div v-if="showtitle" class="wf-select-space">
      {{ $t(playerinput.title) }}
      <GoToMap :playerinput="playerinput"/>
    </div>
    <!-- Transition to the large board deliberately via a button: automatic expanding feels disruptive.
         The top line says what is being placed, below it the next step – so it's clear what happens after the click -->
    <div v-if="zoomBoard !== undefined" class="select-space-zoom">
      <button type="button" class="btn btn-submit btn-rounded select-space-zoom-button" @click="enlargeBoard">
        <span class="select-space-zoom-action">{{ placementAction }}</span>
        <span v-if="zoomBoard === 'moon'" class="select-space-zoom-next-step" v-i18n>Show the Moon enlarged and choose a space</span>
        <span v-else class="select-space-zoom-next-step" v-i18n>Show Mars enlarged and choose a space</span>
      </button>
    </div>
    <div v-if="warning" class="nes-container is-rounded">
      <span class="nes-text is-warning" v-i18n>{{ warning }}</span>
      <GoToMap :playerinput="playerinput"/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {selectBoardTab} from '@/client/components/boardTabs/boardTabState';
import {isMoonSpace} from '@/common/boards/spaces';
import {SelectSpaceModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {getPreferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import {SelectSpaceResponse} from '@/common/inputs/InputResponse';
import SpaceConfirmPopover from '@/client/components/SpaceConfirmPopover.vue';
import {placementLabel, previewTileClass, previewTileForSpaceInput} from '@/client/components/spaceTilePreview';
import {ZoomBoard, placementZoom, releasePlacementZoom, releasePlacementZoomAndWait, requestPlacementZoom} from '@/client/components/board/placementZoom';

const PREVIEW_CLASS = 'space-tile-preview';
// Spaces on the Mars board (incl. colony spaces next to it) and on the Moon: the board they are on gets enlarged
const MARS_REGION_SELECTOR = '#main_board, #colony_spaces';
const MOON_REGION_SELECTOR = '#moon_board, #moon_board_outer_spaces';
import GoToMap from '@/client/components/waitingFor/GoToMap.vue';
import {SpaceId} from '@/common/Types';

type DataModel = {
  spaces: Set<SpaceId>;
  selectedTile: HTMLElement | undefined,
  // Space at which the confirmation bubble is currently open
  confirmAnchor: HTMLElement | undefined,
  spaceId: SpaceId | undefined;
  warning: string | undefined;
  // Board the selectable spaces are on (Mars wins if both): the enlarge button shows this board
  zoomBoard: ZoomBoard | undefined;
};

export default defineComponent({
  name: 'SelectSpace',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectSpaceModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectSpaceResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
      required: true,
    },
    showtitle: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    return {placementZoom};
  },
  data(): DataModel {
    return {
      spaces: new Set(this.playerinput.spaces),
      selectedTile: undefined,
      confirmAnchor: undefined,
      spaceId: undefined,
      warning: undefined,
      zoomBoard: undefined,
    };
  },
  computed: {
    // Known tile as a short action ("Place city"), otherwise the title of the space selection itself
    placementAction(): string {
      const tile = previewTileForSpaceInput(this.playerinput.title);
      return tile !== undefined ? this.$t(placementLabel(tile)) : this.$t(this.playerinput.title);
    },
  },
  components: {
    SpaceConfirmPopover,
    GoToMap,
  },
  methods: {
    animateSpace(tile: Element, activate: boolean) {
      if (activate) {
        tile.classList.add('board-space--available');
      } else {
        tile.classList.remove('board-space--available');
      }
    },
    animateSpaces(tiles: Array<Element>) {
      tiles.forEach((tile: Element) => {
        const spaceId = tile.getAttribute('data_space_id') as SpaceId;
        if (spaceId !== null && this.spaces.has(spaceId)) {
          this.animateSpace(tile, true);
        }
      });
    },
    // Preview of the tile above the space while the confirmation is open.
    // It sits congruently above the space in the board instead of inside the space: the space is clipped
    // as a hexagon (clip-path) and would cut off shadow and glow.
    showTilePreview(tile: HTMLElement) {
      this.removeTilePreview();
      const previewTile = previewTileForSpaceInput(this.playerinput.title);
      const board = tile.parentElement;
      if (previewTile === undefined || board === null) {
        return;
      }
      // Sibling of the space with exactly its computed position and size (same frame of reference).
      // The spaces share left/top; their position on the board lives in margin-left/-top (board.less)
      const spaceStyle = getComputedStyle(tile);
      const preview = document.createElement('div');
      preview.className = PREVIEW_CLASS + ' ' + previewTileClass(previewTile);
      preview.style.left = spaceStyle.left;
      preview.style.top = spaceStyle.top;
      preview.style.marginLeft = spaceStyle.marginLeft;
      preview.style.marginTop = spaceStyle.marginTop;
      preview.style.width = spaceStyle.width;
      preview.style.height = spaceStyle.height;
      board.appendChild(preview);
    },
    removeTilePreview() {
      document.querySelectorAll('.' + PREVIEW_CLASS).forEach((preview) => preview.remove());
    },
    cancelPlacement() {
      this.confirmAnchor = undefined;
      this.removeTilePreview();
      if (this.selectedTile === undefined) {
        throw new Error('unexpected, no tile selected!');
      }
      this.animateSpace(this.selectedTile, false);
      this.animateSpaces(this.getSelectableSpaces());
    },
    async confirmPlacement() {
      this.confirmAnchor = undefined;
      const tiles = this.getSelectableSpaces();
      tiles.forEach((tile) => {
        tile.onclick = null;
      });

      if (this.selectedTile === undefined) {
        throw new Error('unexpected, no tile selected!');
      }
      const spaceId = this.selectedTile.getAttribute('data_space_id') as SpaceId;
      if (spaceId === null) {
        throw new Error('unexpected, space has no id');
      }
      this.spaceId = spaceId;
      this.selectedTile.classList.add('board-space--selected');
      // Only submit once the large board is back in the column (otherwise a hard cut, placementZoom.ts).
      // The preview flies along and stays until the server response shows the real tile
      await releasePlacementZoomAndWait();
      this.movePreviewToColumnBoard(spaceId);
      this.saveData();
    },
    // The choice was made in the large board, which is now gone: preview on the same space in the column's board
    movePreviewToColumnBoard(spaceId: SpaceId) {
      if (this.selectedTile === undefined || this.selectedTile.isConnected) {
        return;
      }
      const columnTile = this.getSelectableSpaces().find((tile) => tile.getAttribute('data_space_id') === spaceId);
      if (columnTile !== undefined) {
        this.showTilePreview(columnTile);
      }
    },
    disableAnimation() {
      const tiles = this.getSelectableSpaces();
      tiles.forEach((tile) => {
        tile.classList.remove('board-space--available', 'board-space--selected');
      });
    },
    getSelectableSpaces(): Array<HTMLElement> {
      const spaces: Array<HTMLElement> = [];

      // All occurrences of each region: the enlarged board (BoardZoomModal) is a second instance with the same IDs,
      // getElementById would only find the board in the column
      const regions = ['main_board', 'moon_board', 'colony_spaces', 'moon_board_outer_spaces'];
      for (const region of regions) {
        document.querySelectorAll(`[id="${region}"]`).forEach((board) => {
          const array = board.getElementsByClassName('board-space-selectable');
          for (let i = 0, length = array.length; i < length; i++) {
            spaces.push(array[i] as HTMLElement);
          }
        });
      }

      return spaces;
    },
    hideDialog(hide: boolean) {
      PreferencesManager.INSTANCE.set('hide_tile_confirmation', hide);
    },
    onTileSelected(tile: HTMLElement) {
      this.selectedTile = tile;
      this.disableAnimation();
      this.animateSpace(tile, true);
      tile.classList.remove('board-space--available');
      const hideTileConfirmation = getPreferences().hide_tile_confirmation;
      if (hideTileConfirmation) {
        this.confirmPlacement();
      } else {
        this.confirmAnchor = tile;
        this.showTilePreview(tile);
      }
    },
    saveData() {
      if (this.spaceId === undefined) {
        this.warning = 'Must select a space';
        return;
      }
      this.onsave({type: 'space', spaceId: this.spaceId});
    },
    enlargeBoard() {
      if (this.zoomBoard !== undefined) {
        requestPlacementZoom(this.zoomBoard);
      }
    },
    // Mark selectable spaces and make them clickable; returns the bound spaces
    bindSpaces(): Array<HTMLElement> {
      this.disableAnimation();
      const tiles = this.getSelectableSpaces();
      this.animateSpaces(tiles);
      const bound: Array<HTMLElement> = [];
      for (const tile of tiles) {
        const spaceId = tile.getAttribute('data_space_id') as SpaceId;
        if (spaceId === null || this.spaces.has(spaceId) === false) {
          continue;
        }
        tile.onclick = () => this.onTileSelected(tile);
        bound.push(tile);
      }
      return bound;
    },
  },
  watch: {
    // Large board shown again: its spaces don't know about the space selection yet.
    // Not while a confirmation is open, otherwise its highlight and preview would be lost
    'placementZoom.boardRenderCount'() {
      if (this.confirmAnchor === undefined && this.spaceId === undefined) {
        this.bindSpaces();
      }
    },
  },
  beforeUnmount() {
    this.removeTilePreview();
    // Highlights and click handlers belong to this space selection: when switching to another tab they would otherwise
    // stay on the board – it would still look selectable, couldn't be enlarged, and a click would pick a space
    this.disableAnimation();
    this.getSelectableSpaces().forEach((tile) => {
      tile.onclick = null;
    });
    releasePlacementZoom();
  },
  mounted() {
    // Moon spaces are only clickable while the Moon tab is open – open the board the spaces are on
    selectBoardTab([...this.spaces].some((spaceId) => isMoonSpace(spaceId)) ? 'moon' : 'mars');
    const bound = this.bindSpaces();
    // The large board closes by itself after confirmation (confirmPlacement)
    if (bound.some((tile) => tile.closest(MARS_REGION_SELECTOR) !== null)) {
      this.zoomBoard = 'mars';
    } else if (bound.some((tile) => tile.closest(MOON_REGION_SELECTOR) !== null)) {
      this.zoomBoard = 'moon';
    }
  },
});

</script>
