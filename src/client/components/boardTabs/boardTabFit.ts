// Boards with a fixed drawing size (Moon ring) scale to the free box: the view gets --board-tab-fit,
// the board uses it as zoom. Size of the drawing comes from data-fit-width / data-fit-height on the view.
export const BOARD_TAB_FIT_VARIABLE = '--board-tab-fit';
const FIT_SELECTOR = '[data-fit-width]';

function fitView(view: HTMLElement): void {
  const width = Number(view.dataset.fitWidth);
  const height = Number(view.dataset.fitHeight ?? view.dataset.fitWidth);
  const box = view.getBoundingClientRect();
  if (!(width > 0) || !(height > 0) || box.width === 0 || box.height === 0) {
    return;
  }
  view.style.setProperty(BOARD_TAB_FIT_VARIABLE, String(Math.min(box.width / width, box.height / height)));
}

// Refits all views of the panel when its size changes; returns a cleanup function
export function observeBoardTabFit(panel: HTMLElement): () => void {
  const fitAll = () => panel.querySelectorAll<HTMLElement>(FIT_SELECTOR).forEach(fitView);
  fitAll();
  if (typeof ResizeObserver === 'undefined') {
    return () => {};
  }
  const observer = new ResizeObserver(fitAll);
  observer.observe(panel);
  panel.querySelectorAll<HTMLElement>(FIT_SELECTOR).forEach((view) => observer.observe(view));
  return () => observer.disconnect();
}
