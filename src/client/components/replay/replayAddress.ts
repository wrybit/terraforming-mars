import {Color} from '@/common/Color';

// The replay's address names the chosen perspective (…/replay?id=…&player=red), so a shared link shows the same view
const PLAYER_PARAMETER = 'player';

/** Perspective named in the page address, if it is one of `colors`. */
export function readReplayPlayer(colors: ReadonlyArray<Color>): Color | undefined {
  const value = new URLSearchParams(window.location.search).get(PLAYER_PARAMETER);
  return colors.find((color) => color === value);
}

/** Writes the perspective into the page address (undefined removes it), without a new history entry. */
export function writeReplayPlayer(color: Color | undefined): void {
  const parameters = new URLSearchParams(window.location.search);
  if (color === undefined) {
    parameters.delete(PLAYER_PARAMETER);
  } else {
    parameters.set(PLAYER_PARAMETER, color);
  }
  const search = parameters.toString();
  const address = window.location.pathname + (search === '' ? '' : '?' + search) + window.location.hash;
  if (address !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(window.history.state, '', address);
  }
}
