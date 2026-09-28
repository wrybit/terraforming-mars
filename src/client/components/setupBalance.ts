// Rechnung der Startauswahl: was vom Start-Kapital nach Präludien und Kartenkauf bleibt.
// Gemeinsam genutzt von der Anzeige (SetupSummary.vue) und der Prüfung vor dem Start (SelectInitialCards.vue),
// damit beide garantiert dieselbe Zahl sehen.
export function remainingMegacredits(
  startMegacredits: number,
  preludeMegacredits: number | undefined,
  purchasedCount: number,
  cardCost: number): number {
  return startMegacredits + (preludeMegacredits ?? 0) - purchasedCount * cardCost;
}
