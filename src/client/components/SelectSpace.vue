<template>
  <div class="select_space_cont">
    <!-- Bestätigung als Sprechblase am gewählten Feld (öffnet nach links, wenn rechts kein Platz ist) -->
    <SpaceConfirmPopover
        :anchor="confirmAnchor"
        @accept="confirmPlacement"
        @dismiss="cancelPlacement"
        @hide="hideDialog" />
    <div v-if="showtitle" class="wf-select-space">
      {{ $t(playerinput.title) }}
      <GoToMap :playerinput="playerinput"/>
    </div>
    <!-- Übergang zum großen Brett bewusst per Button: automatisches Aufklappen wirkt störend.
         Oben steht, was platziert wird, darunter der nächste Schritt – so ist klar, was nach dem Klick passiert -->
    <div v-if="marsPlacement" class="select-space-zoom">
      <button type="button" class="btn btn-submit btn-rounded select-space-zoom-button" @click="enlargeBoard">
        <span class="select-space-zoom-action">{{ placementAction }}</span>
        <span class="select-space-zoom-next-step" v-i18n>Show Mars enlarged and choose a space</span>
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
import {SelectSpaceModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {getPreferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import {SelectSpaceResponse} from '@/common/inputs/InputResponse';
import SpaceConfirmPopover from '@/client/components/SpaceConfirmPopover.vue';
import {placementLabel, previewTileClass, previewTileForSpaceInput} from '@/client/components/spaceTilePreview';
import {placementZoom, releasePlacementZoom, releasePlacementZoomAndWait, requestPlacementZoom} from '@/client/components/board/placementZoom';

const PREVIEW_CLASS = 'space-tile-preview';
// Felder auf dem Mars-Brett (inkl. Kolonie-Felder daneben); nur für sie wird das Brett vergrößert, nicht für den Mond
const MARS_REGION_SELECTOR = '#main_board, #colony_spaces';
import GoToMap from '@/client/components/waitingFor/GoToMap.vue';
import {SpaceId} from '@/common/Types';

type DataModel = {
  spaces: Set<SpaceId>;
  selectedTile: HTMLElement | undefined,
  // Feld, an dem die Bestätigungs-Blase gerade offen ist
  confirmAnchor: HTMLElement | undefined,
  spaceId: SpaceId | undefined;
  warning: string | undefined;
  // Wählbare Felder liegen auf dem Mars (nicht nur auf dem Mond): Button zum Vergrößern anzeigen
  marsPlacement: boolean;
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
      marsPlacement: false,
    };
  },
  computed: {
    // Bekanntes Plättchen als kurze Handlung ("Stadt platzieren"), sonst der Titel der Feldwahl selbst
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
    // Vorschau des Plättchens über dem Feld, solange die Bestätigung offen ist.
    // Sie liegt deckungsgleich über dem Feld im Brett statt im Feld selbst: das Feld ist als Sechseck
    // zugeschnitten (clip-path) und würde Schatten und Schein abschneiden.
    showTilePreview(tile: HTMLElement) {
      this.removeTilePreview();
      const previewTile = previewTileForSpaceInput(this.playerinput.title);
      const board = tile.parentElement;
      if (previewTile === undefined || board === null) {
        return;
      }
      // Geschwister des Feldes mit exakt dessen berechneter Lage und Größe (gleicher Bezugsrahmen).
      // Die Felder teilen sich left/top; ihre Lage auf dem Brett steckt in margin-left/-top (board.less)
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
      // Erst absenden, wenn das große Brett zurück in der Spalte ist (sonst harter Schnitt, placementZoom.ts).
      // Die Vorschau fliegt dabei mit und bleibt stehen, bis die Server-Antwort das echte Plättchen zeigt
      await releasePlacementZoomAndWait();
      this.movePreviewToColumnBoard(spaceId);
      this.saveData();
    },
    // Gewählt wurde im großen Brett, das jetzt weg ist: Vorschau aufs gleiche Feld im Brett der Spalte
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

      // Alle Vorkommen jeder Region: Das vergrößerte Brett (BoardZoomModal) ist eine zweite Instanz mit denselben IDs,
      // getElementById fände nur das Brett in der Spalte
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
      requestPlacementZoom();
    },
    // Wählbare Felder markieren und klickbar machen; liefert die gebundenen Felder
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
    // Großes Brett neu eingeblendet: seine Felder kennen die Feldwahl noch nicht.
    // Nicht während einer offenen Bestätigung, sonst gingen deren Markierung und Vorschau verloren
    'placementZoom.boardRenderCount'() {
      if (this.confirmAnchor === undefined && this.spaceId === undefined) {
        this.bindSpaces();
      }
    },
  },
  beforeUnmount() {
    this.removeTilePreview();
    // Markierungen und Klick-Handler gehören zu dieser Feldwahl: beim Wechsel in einen anderen Tab blieben sie sonst
    // am Brett hängen – das Brett sähe weiter wählbar aus, ließe sich nicht vergrößern und ein Klick wählte ein Feld
    this.disableAnimation();
    this.getSelectableSpaces().forEach((tile) => {
      tile.onclick = null;
    });
    releasePlacementZoom();
  },
  mounted() {
    const bound = this.bindSpaces();
    // Großes Brett schließt sich nach der Bestätigung von selbst (confirmPlacement)
    this.marsPlacement = bound.some((tile) => tile.closest(MARS_REGION_SELECTOR) !== null);
  },
});

</script>
