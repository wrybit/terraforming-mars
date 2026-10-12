import {nextTick, onBeforeUnmount, Ref, watch, WatchSource} from 'vue';

/**
 * Narrows an element with "width: max-content; max-width: …" to the width its wrapped content really needs.
 *
 * CSS alone cannot do this: once a flex row wraps, the box keeps the full max-width and leaves an empty strip
 * on the right. The narrowest width that keeps the same height (same line breaks) and causes no overflow is
 * found by a binary search over a few reflows.
 */
export function shrinkToWrappedContent(element: HTMLElement): void {
  element.style.width = '';
  const fullHeight = element.offsetHeight;
  const fullWidth = parseFloat(getComputedStyle(element).width);
  // Not rendered (hidden, test DOM): nothing to measure
  if (fullHeight === 0 || !(fullWidth > 0)) {
    return;
  }
  const fits = (width: number): boolean => {
    element.style.width = width + 'px';
    return element.offsetHeight <= fullHeight && element.scrollWidth <= element.clientWidth;
  };
  let tooNarrow = 0;
  let wideEnough = Math.ceil(fullWidth);
  while (wideEnough - tooNarrow > 1) {
    const middle = Math.floor((tooNarrow + wideEnough) / 2);
    if (fits(middle)) {
      wideEnough = middle;
    } else {
      tooNarrow = middle;
    }
  }
  element.style.width = wideEnough + 'px';
}

/** Re-measures whenever one of the sources changes (open state, content) and when the window is resized. */
export function useShrinkToWrappedContent(element: Ref<HTMLElement | undefined>, sources: Array<WatchSource>): void {
  const update = () => {
    nextTick(() => {
      if (element.value !== undefined) {
        shrinkToWrappedContent(element.value);
      }
    });
  };
  watch([element, ...sources], update, {deep: true});
  window.addEventListener('resize', update);
  onBeforeUnmount(() => window.removeEventListener('resize', update));
}
