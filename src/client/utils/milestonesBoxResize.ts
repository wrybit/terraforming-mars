// Height of the separate milestones & awards box above the log (spectator view, LogPanel.vue) via the drag handle
// below it (RowResizeHandle.vue). The box gets a fixed height and its table scrolls inside; the log box below
// takes the rest but keeps its minimum height (player_home_fixed.less).
import {RowResizeTarget} from '@/client/utils/rowResize';

// Smallest box: the table header row stays readable
const MIN_BOX_HEIGHT = 80;
// Same as the minimum height of the log box in the separated layout (player_home_fixed.less)
const MIN_LOG_HEIGHT = 120;
const LOG_PANEL_SELECTOR = '.log-panel.or-tab-panel';

export function milestonesBoxTarget(box: HTMLElement): RowResizeTarget {
  const height = () => box.getBoundingClientRect().height;
  return {
    current: height,
    limits() {
      const log = box.parentElement?.querySelector<HTMLElement>(LOG_PANEL_SELECTOR);
      // The log may give away everything above its minimum height
      const spare = log === null || log === undefined ? 0 : Math.max(0, log.getBoundingClientRect().height - MIN_LOG_HEIGHT);
      const max = height() + spare;
      return {min: Math.min(MIN_BOX_HEIGHT, max), max};
    },
    // undefined = natural height (as tall as the table)
    apply(value) {
      if (value === undefined) {
        box.style.removeProperty('height');
      } else {
        box.style.height = `${value}px`;
      }
    },
  };
}
