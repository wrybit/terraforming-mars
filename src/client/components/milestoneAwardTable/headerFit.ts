// Fit the milestone table header to narrow columns (contract with milestone_award_table.less):
// - Icons shrink when their column gets narrower than the icon – never larger than the original.
//   Each icon individually: a shared factor would make all of them tiny because of one wide double icon.
// - Owner (cube + name): if the name doesn't fully fit beside it, only the cube remains (name in tooltip).

export const ICON_ZOOM_VARIABLE = '--ma-table-icon-zoom';
const ICON_SELECTOR = '.ma-table-head .ma-table-icon';
const OWNER_SELECTOR = '.ma-table-owner';
const OWNER_NAME_SELECTOR = '.ma-table-owner-name';
export const OWNER_CUBE_ONLY_CLASS = 'ma-table-owner--cube-only';
// Space between two icons so they don't touch
const ICON_SPACING = 4;

// Factor at which the icon fits its column (at most 1)
export function iconZoom(iconWidth: number, cellWidth: number): number {
  if (iconWidth <= 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, cellWidth - ICON_SPACING) / iconWidth);
}

function fitOwners(table: HTMLElement): void {
  const owners = [...table.querySelectorAll<HTMLElement>(OWNER_SELECTOR)];
  // First measure all with cube, then switch only the too-wide ones (no back and forth per element)
  owners.forEach((owner) => owner.classList.remove(OWNER_CUBE_ONLY_CLASS));
  // The name shrinks (ellipsis) instead of overflowing – a truncated name means: not enough room
  const tooWide = owners.filter((owner) => {
    const name = owner.querySelector<HTMLElement>(OWNER_NAME_SELECTOR);
    return name !== null && name.scrollWidth > name.clientWidth;
  });
  tooWide.forEach((owner) => owner.classList.add(OWNER_CUBE_ONLY_CLASS));
}

function fitIcons(table: HTMLElement): void {
  const icons = [...table.querySelectorAll<HTMLElement>(ICON_SELECTOR)];
  // Measure at original size; the column width doesn't depend on the icons (minmax(0, 1fr))
  icons.forEach((icon) => icon.style.setProperty(ICON_ZOOM_VARIABLE, '1'));
  const zooms = icons.map((icon) => iconZoom(icon.getBoundingClientRect().width, icon.parentElement?.getBoundingClientRect().width ?? 0));
  icons.forEach((icon, index) => icon.style.setProperty(ICON_ZOOM_VARIABLE, String(zooms[index])));
}

function fit(table: HTMLElement): void {
  fitIcons(table);
  fitOwners(table);
}

// Starts fitting and returns a cleanup function
export function observeHeaderFit(table: HTMLElement): () => void {
  let frame: number | undefined;
  const schedule = () => {
    if (frame === undefined) {
      frame = requestAnimationFrame(() => {
        frame = undefined;
        fit(table);
      });
    }
  };
  // Table width changes with window and drag handle; images only have their width after loading
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
  resizeObserver?.observe(table);
  table.addEventListener('load', schedule, true);
  schedule();

  return () => {
    resizeObserver?.disconnect();
    table.removeEventListener('load', schedule, true);
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
    }
  };
}
