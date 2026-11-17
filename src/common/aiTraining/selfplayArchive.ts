// Contract between the training hub (it keeps every self-play game of the new AI) and the game servers:
// a game server imports an archived game when its result page is opened and shows its decision log to admins.

/** One archived self-play game: the computer that played it and its id in the hub's archive */
export type SelfplayArchiveRef = {
  machine: string;
  gameId: string;
};

/** game: serialized final game; record: decision log of the game (one record line of the training data) */
export type SelfplayArchiveKind = 'game' | 'record';

/** Path on the hub, resolved against the address of the lobby feed (AI_TRAINING_FEED) */
export function selfplayArchivePath(kind: SelfplayArchiveKind, ref: SelfplayArchiveRef): string {
  return `/api/selfplay/${kind}/${encodeURIComponent(ref.machine)}/${encodeURIComponent(ref.gameId)}`;
}

/** Query parameters of the game server's address that opens an archived game (paths.AI_TRAINING_GAME) */
export const SELFPLAY_MACHINE_PARAM = 'machine';
export const SELFPLAY_GAME_PARAM = 'id';
