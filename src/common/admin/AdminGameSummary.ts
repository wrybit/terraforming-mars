import {Color} from '../Color';

// Contract between admin API (server) and admin overview (client): both sides read and write exactly this shape.

/** Origin of an entry: game played here or only an imported result from another server. */
export type AdminGameSource = 'local' | 'imported';

export type AdminPlayerSummary = {
  name: string;
  color: Color;
  /** Link to the player view; for imports only for the player whose link was imported. */
  url: string | undefined;
  victoryPoints: number;
  megaCredits: number;
  isWinner: boolean;
  /** Corporation(s) played, separated by " / " if several. */
  corporation: string | undefined;
};

export type AdminGameSummary = {
  id: string;
  source: AdminGameSource;
  /** For local games the game start, for imports the time of the import. */
  createdTimeMs: number;
  isFinished: boolean;
  generation: number;
  spectatorUrl: string | undefined;
  /** Original link of an imported game. */
  externalUrl: string | undefined;
  /** Participant ID under which an imported game is stored here (results page the-end?id=…). */
  importedParticipantId: string | undefined;
  /** Screenshot of the results page stored here when the game itself no longer exists (taken over from Discord). */
  screenshotUrl: string | undefined;
  players: Array<AdminPlayerSummary>;
};

export type AdminDeleteGameRequest = {
  id: string;
};

export type AdminImportGameRequest = {
  url: string;
};
