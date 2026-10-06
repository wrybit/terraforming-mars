// Is a space selection running (tile, colony space, Moon …)? Then a click on the board must
// not open the zoom modal, otherwise nothing can be placed anymore.
// The signal is the mounted space selection itself (SelectSpace.vue), not the highlighted spaces:
// after a space is tapped, SelectSpace removes all highlights before the click reaches the board.
// The same selectors are in board_zoom_modal.less (magnifier cursor).
export const SELECT_SPACE_SELECTOR = '.select_space_cont';
export const AVAILABLE_SPACE_SELECTOR = '.board-space--available';

// Board the selectable spaces are on: Moon only if none of them is on Mars
export function placementBoard(root: Document | HTMLElement = document): 'mars' | 'moon' {
  const onMoon = root.querySelector(`#moon_board ${AVAILABLE_SPACE_SELECTOR}, #moon_board_outer_spaces ${AVAILABLE_SPACE_SELECTOR}`) !== null;
  const onMars = root.querySelector(`#main_board ${AVAILABLE_SPACE_SELECTOR}, #colony_spaces ${AVAILABLE_SPACE_SELECTOR}`) !== null;
  return onMoon && !onMars ? 'moon' : 'mars';
}

export function isBoardPlacementActive(root: Document | HTMLElement = document): boolean {
  return root.querySelector(SELECT_SPACE_SELECTOR) !== null || root.querySelector(AVAILABLE_SPACE_SELECTOR) !== null;
}
