<template>
  <div :class="['player-home-columns', {'player-home-columns--board-collapsed': boardCollapsed}]" :ref="trackColumns">
    <!-- Zwei-Spalten-Layout der Spiel- und Zuschaueransicht (player_home_columns.less): links #main, rechts #board.
         Das Brett steht im DOM zuerst (Hotkey-Reihenfolge, schmale Screens) und wird per CSS rechts platziert.
         Kommentar innen, damit die Wurzel ein Element bleibt -->
    <div class="player-home-columns__board" :ref="trackBoardColumn">
      <slot name="board"></slot>
    </div>

    <!-- Ziehgriff zwischen den Spalten (nur im Zwei-Spalten-Layout sichtbar): verteilt die Breite, Doppelklick = Standard -->
    <div class="player-home-columns__resizer"
      role="separator" aria-orientation="vertical" tabindex="0"
      :aria-valuenow="boardShare" :aria-valuemin="minBoardShare" :aria-valuemax="maxBoardShare"
      :aria-label="$t('Column width')" :title="$t('Column width')"
      @pointerdown="startResize" @dblclick="resetResize"
      @keydown.left.prevent="nudgeResize(1)" @keydown.right.prevent="nudgeResize(-1)">
      <!-- Aufteilung links / rechts, nur beim Ziehen bzw. mit Tastaturfokus sichtbar -->
      <span class="player-home-columns__resizer-label" aria-hidden="true">{{ columnSplitLabel }}</span>
    </div>

    <div class="player-home-columns__main">
      <slot name="main"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {observeBoardColumn} from '@/client/utils/boardColumnPosition';
import {observeRightColumnFit} from '@/client/utils/rightColumnFit';
import {
  DEFAULT_BOARD_SHARE, KEYBOARD_STEP, MAX_BOARD_SHARE, MIN_BOARD_SHARE,
  applyBoardShare, loadBoardShare, setBoardShare, shareLabel, startColumnResize,
} from '@/client/utils/columnResize';

// Aufräumfunktion der Spalten-Beobachtung (Position fürs Modal, Platzausnutzung); pro Seite gibt es nur eine Spielansicht
let stopObservingBoardColumn: (() => void) | undefined;
// Spalten-Container für den Ziehgriff; pro Seite gibt es nur eine Spielansicht
let columnsElement: HTMLElement | undefined;

function observeBoardColumnFully(column: HTMLElement): () => void {
  const stopPosition = observeBoardColumn(column);
  const stopFit = observeRightColumnFit(column);
  return () => {
    stopPosition();
    stopFit();
  };
}

export default defineComponent({
  name: 'HomeColumns',
  props: {
    // Rechte Spalte (Brett) ausgeblendet, die linke nimmt die volle Breite (Startphase, SetupBoardToggle)
    boardCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // Anteil der rechten Spalte in Prozent (columnResize.ts)
      boardShare: loadBoardShare(),
    };
  },
  computed: {
    columnSplitLabel(): string {
      return shareLabel(this.boardShare);
    },
    minBoardShare(): number {
      return MIN_BOARD_SHARE;
    },
    maxBoardShare(): number {
      return MAX_BOARD_SHARE;
    },
  },
  beforeUnmount() {
    stopObservingBoardColumn?.();
    stopObservingBoardColumn = undefined;
  },
  methods: {
    // Funktions-Ref des Spalten-Containers: gespeicherte Aufteilung sofort anwenden
    // (wird mit dem Element bzw. beim Entfernen mit null aufgerufen)
    trackColumns(element: unknown) {
      columnsElement = element instanceof HTMLElement ? element : undefined;
      if (columnsElement !== undefined) {
        applyBoardShare(columnsElement, this.boardShare);
      }
    },
    trackBoardColumn(element: unknown) {
      stopObservingBoardColumn?.();
      stopObservingBoardColumn = element instanceof HTMLElement ? observeBoardColumnFully(element) : undefined;
    },
    startResize(event: PointerEvent) {
      if (columnsElement !== undefined) {
        startColumnResize(event, columnsElement, (share) => {
          this.boardShare = share;
        });
      }
    },
    resetResize() {
      if (columnsElement !== undefined) {
        this.boardShare = setBoardShare(columnsElement, DEFAULT_BOARD_SHARE);
      }
    },
    // Pfeiltaste links schiebt den Griff nach links, die rechte Spalte wird breiter
    nudgeResize(direction: number) {
      if (columnsElement !== undefined) {
        this.boardShare = setBoardShare(columnsElement, this.boardShare + direction * KEYBOARD_STEP);
      }
    },
  },
});
</script>
