import {reactive} from 'vue';

// Enlarged board (Mars or Moon) during a tile placement.
// The space selection (SelectSpace.vue) and the board (GameBoardView.vue) live in separate subtrees;
// this shared state connects them without passing props or events through half the app.
export type ZoomBoard = 'mars' | 'moon';

export const placementZoom = reactive({
  // Player requested the large board in the space selection
  requested: false,
  // Which board to enlarge: the one the selectable spaces are on
  board: 'mars' as ZoomBoard,
  // Counts every showing of the large board: its spaces are then new in the DOM
  // and need the highlighting and click handlers of the running space selection
  boardRenderCount: 0,
  // Large board is visible (from showing until the end of the return animation)
  boardVisible: false,
});

// Upper limit for waiting on the return animation (boardZoomAnimation.ts: 320 ms), in case the modal
// disappears without completing – the placement must never hang
const CLOSE_WAIT_LIMIT_MS = 1000;

let closeWaiters: Array<() => void> = [];

export function requestPlacementZoom(board: ZoomBoard = 'mars'): void {
  placementZoom.board = board;
  placementZoom.requested = true;
}

export function releasePlacementZoom(): void {
  placementZoom.requested = false;
}

// Shrink the board and wait until it's back in the column. Needed before submitting a placement:
// the server response rebuilds the whole player view and would abruptly cut off the return animation
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
