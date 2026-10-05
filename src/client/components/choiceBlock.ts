/*
 * Choice block (choice_block.less): tiles or cards of a decision as a block that is as square as possible,
 * centered in the tab box (project cards on desktop ignore it and fill the row, choice_block.less). The column count grows with the square root of the count: 2 → 2×1, 3–4 → 2×2, 5–6 → 3×2, 7–9 → 3×3.
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

/* Inline style for the element with class choice-block (column count landscape/portrait, choice_block.less). */
export function choiceBlockStyle(count: number): Record<string, string> {
  return {
    '--choice-columns': String(choiceBlockColumns(count)),
    '--choice-columns-portrait': String(choiceBlockColumnsPortrait(count)),
  };
}
