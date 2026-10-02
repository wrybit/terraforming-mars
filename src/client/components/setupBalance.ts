// Initial selection calculation: what remains of the starting money after preludes and card purchase.
// Shared by the display (SetupSummary.vue) and the check before starting (SelectInitialCards.vue),
// so both are guaranteed to see the same number.
export function remainingMegacredits(
  startMegacredits: number,
  preludeMegacredits: number | undefined,
  purchasedCount: number,
  cardCost: number): number {
  return startMegacredits + (preludeMegacredits ?? 0) - purchasedCount * cardCost;
}
