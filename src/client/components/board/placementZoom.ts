import {reactive} from 'vue';

// Vergrößerter Mars während einer Plättchen-Platzierung.
// Die Feldwahl (SelectSpace.vue) und das Brett (GameBoardView.vue) liegen in getrennten Teilbäumen;
// dieser gemeinsame Zustand verbindet sie, ohne Props oder Events durch die halbe App zu reichen.
export const placementZoom = reactive({
  // Spieler hat in der Feldwahl das große Brett angefordert
  requested: false,
  // Zählt jedes Einblenden des großen Bretts: dessen Felder sind dann neu im DOM
  // und brauchen Markierung und Klick-Handler der laufenden Feldwahl
  boardRenderCount: 0,
});

export function requestPlacementZoom(): void {
  placementZoom.requested = true;
}

export function releasePlacementZoom(): void {
  placementZoom.requested = false;
}

export function notifyZoomBoardRendered(): void {
  placementZoom.boardRenderCount++;
}
