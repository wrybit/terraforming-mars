import {Color} from '../Color';
import {LANGUAGE} from '../constants';
import {Theme} from '../theme/Theme';

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
  /** Has the game page open right now (running local games only; missing in older stored imports). */
  isOnline?: boolean;
  /** Language chosen in the player's settings, sent by the open game page (unknown until the player was online once). */
  language?: LANGUAGE;
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
  /** Results page of a finished local game (the-end?id=…); imports use importedParticipantId / screenshotUrl. */
  resultUrl?: string;
  /** Project cards played by all players together (local games only) – tells barely started games apart. */
  playedCardCount?: number;
  /** Theme the game is played in; missing means Mars (imports, games stored before themes existed). */
  theme?: Theme;
  players: Array<AdminPlayerSummary>;
};

export type AdminDeleteGameRequest = {
  id: string;
};

export type AdminImportGameRequest = {
  url: string;
};
