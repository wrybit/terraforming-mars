// One space of a horizontal track (BoardTrackRow.vue): number or icon, marker state, reward space or not
export type TrackCellState = 'at' | 'past' | 'reachable' | 'blocked';

export type TrackCell = {
  label?: string;
  icon?: string;
  state?: TrackCellState;
  reward?: boolean;
};

export function cellState(index: number, position: number): TrackCellState | undefined {
  if (index === position) {
    return 'at';
  }
  return index < position ? 'past' : undefined;
}
