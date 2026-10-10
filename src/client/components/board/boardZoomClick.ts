// Click on a zoomable board (Mars, Moon): controls on the board (tile view button) keep their own job
// and must not open the enlargement
export function isBoardControlClick(event: MouseEvent): boolean {
  const target = event.target as HTMLElement | null;
  return target !== null && target.closest('.hide-tile-button') !== null;
}
