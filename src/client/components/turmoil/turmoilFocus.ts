import {boardTabState, selectBoardTab} from '@/client/components/boardTabs/boardTabState';
import {turmoilPickState} from '@/client/components/turmoil/turmoilView';

// While a party is being chosen the board shows the Turmoil tab (the picked party is outlined there);
// afterwards the previous board comes back. Returns the function that restores it.
export function focusTurmoilBoard(): () => void {
  const previous = boardTabState.active;
  selectBoardTab('turmoil');
  return () => {
    turmoilPickState.pick = undefined;
    if (boardTabState.active === 'turmoil') {
      selectBoardTab(previous);
    }
  };
}
