/*
 * Choice block (choice_block.less): tiles or cards of a decision as a block that is as square as possible,
 * centered in the tab box (many cards fill the row instead, choiceBlockFillsWidth). The column count grows with the square root of the count: 2 → 2×1, 3–4 → 2×2, 5–6 → 3×2, 7–9 → 3×3.
 */
export function choiceBlockColumns(count: number): number {
  return Math.max(1, Math.ceil(Math.sqrt(count)));
}

/*
 * Portrait (tablet upright, phone): the same block upright – more rows than columns, matching the screen:
 * 2 → 1×2, 3–4 → 2×2, 5–6 → 2×3, 7–9 → 3×3.
 */
export function choiceBlockColumnsPortrait(count: number): number {
  return Math.max(1, Math.ceil(count / choiceBlockColumns(count)));
}

/* Inline style for the element with class choice-block (column count landscape/portrait and element count, choice_block.less). */
export function choiceBlockStyle(count: number): Record<string, string> {
  return {
    '--choice-count': String(Math.max(1, count)),
    '--choice-columns': String(choiceBlockColumns(count)),
    '--choice-columns-portrait': String(choiceBlockColumnsPortrait(count)),
  };
}

/*
 * Card selections with many cards (build, sell, draft …): the square block would get more than two rows
 * (from 7 cards: 3×3), so the cards fill the width of the tab box instead – like the hand cards.
 * Few cards (buying 4 → 2×2) stay the square block.
 */
const CHOICE_BLOCK_MAX_ROWS = 2;

export function choiceBlockFillsWidth(count: number): boolean {
  return Math.ceil(count / choiceBlockColumns(count)) > CHOICE_BLOCK_MAX_ROWS;
}

/*
 * Class for card selections: choice-block--fill when the cards fill the row (choice_block.less).
 * Selections from the hand (build, sell) always flow like the hand cards, whatever their count –
 * the square block is only for cards you see for the first time (buying, draft with few cards).
 */
export function choiceBlockClass(count: number, flowing = false): Record<string, boolean> {
  return {'choice-block--fill': flowing || choiceBlockFillsWidth(count)};
}
