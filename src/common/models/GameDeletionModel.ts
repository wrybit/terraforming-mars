// Antwort von api/game/deletion: Damit eine Fehlermeldung sagen kann, WARUM eine Partie fehlt,
// statt nur "nicht geladen" (geloescht? automatisch entfernt? nie auf diesem Server gewesen?).
// 'closed-unstarted': opened in the lobby, the creator left before anything happened and nobody else ever came
export type GameDeletionReason = 'deleted-in-admin-area' | 'purged-unfinished' | 'closed-unstarted';

export type GameDeletionModel =
  | {deleted: false}
  | {
    deleted: true,
    gameId: string,
    /** Millisekunden seit 1970 */
    deletedAt: number,
    reason: GameDeletionReason,
    playerNames: Array<string>,
    /** Nur bei 'purged-unfinished': die damals gueltige Frist MAX_GAME_DAYS */
    maxGameDays?: string,
  };
