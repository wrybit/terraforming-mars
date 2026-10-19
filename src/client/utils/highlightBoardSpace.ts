// Lets one space of Mars/Arrakis or the Moon blink for a moment (log entries, the Kanly war field …):
// scrolls the board into view and lights the space's highlight layer (BoardSpace.vue, board.less .highlight)
import {SpaceId} from '@/common/Types';
import {scrollToSpace} from '@/client/utils/boardScroll';

const REGIONS = ['main_board', 'moon_board', 'moon_board_outer_spaces'];
const HIGHLIGHT_DURATION = 3000;

export function highlightBoardSpace(spaceId: SpaceId): void {
  scrollToSpace(spaceId);
  for (const region of REGIONS) {
    const board = document.getElementById(region);
    const element = board === null ? undefined :
      Array.from(board.getElementsByClassName('board-log-highlight')).find((candidate) => candidate.getAttribute('data_log_highlight_id') === spaceId);
    if (element !== undefined) {
      element.classList.add('highlight');
      setTimeout(() => element.classList.remove('highlight'), HIGHLIGHT_DURATION);
      return;
    }
  }
}
