// A place named in a Dune tab (the Kanly war field) shown on the planet: opens the Arrakis tab and lets the space
// blink (Jens, 19 Oct 2026)
import {nextTick} from 'vue';
import {SpaceId} from '@/common/Types';
import {selectBoardTab} from '@/client/components/boardTabs/boardTabState';
import {highlightBoardSpace} from '@/client/utils/highlightBoardSpace';

export async function showOnArrakis(spaceId: SpaceId): Promise<void> {
  selectBoardTab('mars');
  // The board is visible only after the tab switch has been rendered
  await nextTick();
  highlightBoardSpace(spaceId);
}
