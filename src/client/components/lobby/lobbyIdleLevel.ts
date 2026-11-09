// How dead is a running room? Level from the time since the last human move.
// The colour in lobby.less rises with the level: grey, yellow, orange, red
export type LobbyIdleLevel = 'active' | 'slow' | 'stalled' | 'dead';

const MINUTE = 60_000;

// Upper bounds in ascending order; anything above is 'dead'
const LEVELS: ReadonlyArray<[maxMs: number, level: LobbyIdleLevel]> = [
  [10 * MINUTE, 'active'],
  [20 * MINUTE, 'slow'],
  [60 * MINUTE, 'stalled'],
];

export function lobbyIdleLevel(idleMs: number): LobbyIdleLevel {
  return LEVELS.find(([maxMs]) => idleMs < maxMs)?.[1] ?? 'dead';
}
