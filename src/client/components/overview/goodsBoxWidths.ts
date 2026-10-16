// Widths that keep a resource column calm: every box of a column gets the same width and the same
// production slot, so the stock numbers end on one line and the production plaques end on another.
// Measured per column over all rows: a shield plus a two-digit stock and production ("+12") do not
// fit into the standard box, and production plaques differ in width ("+1" vs "+14").

// Standard box width (players_table.less: .players-table-goods max-width)
export const GOODS_BOX_WIDTH = 78;
// Space around the box inside its cell (players_table.less: width calc(100% - 8px))
export const GOODS_BOX_INSET = 8;

export type GoodsColumnWidths = {
  // Width the widest content of a column needs (all rows); 0 = not measured
  box: Array<number>;
  // Width of the production slot per column (widest plaque); 0 = not measured
  production: Array<number>;
};

export function emptyGoodsColumnWidths(columnCount: number): GoodsColumnWidths {
  return {box: new Array(columnCount).fill(0), production: new Array(columnCount).fill(0)};
}

export function sameGoodsColumnWidths(a: GoodsColumnWidths, b: GoodsColumnWidths): boolean {
  const same = (x: ReadonlyArray<number>, y: ReadonlyArray<number>) => x.length === y.length && x.every((value, index) => value === y[index]);
  return same(a.box, b.box) && same(a.production, b.production);
}

// Padding plus gap: the part of the box that is not stock or production
function frameWidth(box: HTMLElement): number {
  const style = getComputedStyle(box);
  return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + (parseFloat(style.columnGap) || 0);
}

function childWidth(box: HTMLElement, selector: string): number {
  return box.querySelector<HTMLElement>(selector)?.offsetWidth ?? 0;
}

/**
 * Box and production slot width per resource column (index as in the rows).
 * Undefined while no resource box is rendered (goods section hidden): the caller keeps its last widths. Zeros would
 * mean "standard width", the section would fit again, show, measure wider, hide … an endless update loop.
 */
export function measureGoodsColumnWidths(table: Element, columnCount: number, transposed: boolean = false): GoodsColumnWidths | undefined {
  if (table.querySelector('.players-table-row .players-table-goods') === null) {
    return undefined;
  }
  const frame: Array<number> = new Array(columnCount).fill(0);
  const stock: Array<number> = new Array(columnCount).fill(0);
  const production: Array<number> = new Array(columnCount).fill(0);
  for (const row of table.querySelectorAll('.players-table-row')) {
    row.querySelectorAll<HTMLElement>('.players-table-goods').forEach((box, index) => {
      if (index < columnCount) {
        // Stock and production are measured separately: the widest stock and the widest plaque
        // of a column may come from different rows, and the box must hold both
        frame[index] = Math.max(frame[index], frameWidth(box));
        stock[index] = Math.max(stock[index], childWidth(box, '.players-table-goods-stock'));
        production[index] = Math.max(production[index], childWidth(box, '.players-table-goods-production'));
      }
    });
  }
  const box = frame.map((width, index) => Math.ceil(width + stock[index] + production[index]));
  if (transposed) {
    // Transposed (mobile) a player's goods stack in one column: one production slot for all boxes
    // keeps the stock numbers of that stack on one line. Box widths stay as the mobile grid lays them out
    const widest = Math.ceil(Math.max(0, ...production));
    return {box: new Array(columnCount).fill(0), production: new Array(columnCount).fill(widest)};
  }
  return {
    box,
    production: production.map((width) => Math.ceil(width)),
  };
}
