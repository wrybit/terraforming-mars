import {observeMobileFit} from '@/client/utils/mobileFit';
import {transposedCopy} from '@/client/utils/transposeTable';

/*
 * Mobile view adjustments that apply beyond the player view (results page, modals):
 * scaling via mobileFit.ts and the rotated results table.
 */

// Wide tables that appear rotated on the phone; the original is hidden via CSS (mobile.less)
const TRANSPOSE_SELECTOR = '.game_end_table:not(.mb-transposed)';
const SOURCE_CLASS = 'mb-transposed-source';

function transposeTables(root: HTMLElement): void {
  root.querySelectorAll<HTMLTableElement>(TRANSPOSE_SELECTOR).forEach((table) => {
    const next = table.nextElementSibling;
    if (next?.classList.contains('mb-transposed')) {
      return;
    }
    const copy = transposedCopy(table);
    table.classList.add(SOURCE_CLASS);
    table.after(copy);
  });
}

/* Starts the adjustments for `root` and returns the function that stops them again. */
export function startMobileDocument(root: HTMLElement): () => void {
  const stopFit = observeMobileFit(root);
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => transposeTables(root));
  };
  const mutations = new MutationObserver(schedule);
  mutations.observe(root, {childList: true, subtree: true});
  schedule();
  return () => {
    stopFit();
    cancelAnimationFrame(frame);
    mutations.disconnect();
    // Remove rotated copies, show the original again (switch to the desktop view)
    root.querySelectorAll('.mb-transposed').forEach((copy) => copy.remove());
    root.querySelectorAll('.' + SOURCE_CLASS).forEach((table) => table.classList.remove(SOURCE_CLASS));
  };
}
