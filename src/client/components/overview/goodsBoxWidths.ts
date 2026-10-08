// Width each resource column needs so no box spills over: a shield plus a two-digit stock and
// production ("+12") do not fit into the standard box. Measured per column over all rows, so
// every box in a column gets the same width and the production values stay right-aligned.

// Standard box width (players_table.less: .players-table-goods max-width)
export const GOODS_BOX_WIDTH = 78;
// Space around the box inside its cell (players_table.less: width calc(100% - 8px))
export const GOODS_BOX_INSET = 8;

function contentWidth(box: HTMLElement): number {
  const style = getComputedStyle(box);
  const frame = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + (parseFloat(style.columnGap) || 0);
  // Stock and production sit side by side; the value coin is positioned absolutely and takes no room
  const parts = [...box.children].filter((child) => getComputedStyle(child).position !== 'absolute') as Array<HTMLElement>;
  return Math.ceil(frame + parts.reduce((sum, part) => sum + part.offsetWidth, 0));
}

/** Box width per resource column (index as in the rows); 0 where nothing has been measured. */
export function measureGoodsBoxWidths(table: Element, columnCount: number): Array<number> {
  const widths: Array<number> = new Array(columnCount).fill(0);
  for (const row of table.querySelectorAll('.players-table-row')) {
    row.querySelectorAll<HTMLElement>('.players-table-goods').forEach((box, index) => {
      if (index < columnCount) {
        widths[index] = Math.max(widths[index], contentWidth(box));
      }
    });
  }
  return widths.map((width) => (width > GOODS_BOX_WIDTH ? width : 0));
}
