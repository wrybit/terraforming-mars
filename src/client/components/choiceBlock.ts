/*
 * Auswahl-Block (choice_block.less): Kacheln bzw. Karten einer Entscheidung als möglichst quadratischer Block,
 * mittig in der Tab-Box. Die Spaltenzahl wächst mit der Wurzel der Anzahl: 2 → 2×1, 3–4 → 2×2, 5–6 → 3×2, 7–9 → 3×3.
 */
export function choiceBlockColumns(count: number): number {
  return Math.max(1, Math.ceil(Math.sqrt(count)));
}

/* Inline-Stil für das Element mit der Klasse choice-block. */
export function choiceBlockStyle(count: number): Record<string, string> {
  return {'--choice-columns': String(choiceBlockColumns(count))};
}
