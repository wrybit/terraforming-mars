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
  // Großes Brett ist zu sehen (von der Einblendung bis zum Ende der Rück-Animation)
  boardVisible: false,
});

// Obergrenze fürs Warten auf die Rück-Animation (boardZoomAnimation.ts: 320 ms), falls das Modal
// ohne Abschluss verschwindet – die Platzierung darf nie hängen bleiben
const CLOSE_WAIT_LIMIT_MS = 1000;

let closeWaiters: Array<() => void> = [];

export function requestPlacementZoom(): void {
  placementZoom.requested = true;
}

export function releasePlacementZoom(): void {
  placementZoom.requested = false;
}

// Brett verkleinern und warten, bis es wieder in der Spalte liegt. Nötig vor dem Absenden einer Platzierung:
// Die Server-Antwort baut die ganze Spieleransicht neu auf und würde die Rück-Animation hart abschneiden
export function releasePlacementZoomAndWait(): Promise<void> {
  releasePlacementZoom();
  if (!placementZoom.boardVisible) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, CLOSE_WAIT_LIMIT_MS);
    closeWaiters.push(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

export function notifyZoomBoardRendered(): void {
  placementZoom.boardVisible = true;
  placementZoom.boardRenderCount++;
}

export function notifyZoomBoardHidden(): void {
  placementZoom.boardVisible = false;
  const waiters = closeWaiters;
  closeWaiters = [];
  waiters.forEach((resolve) => resolve());
}
