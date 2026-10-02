import {Color} from '../Color';

// Vertrag zwischen Admin-API (Server) und Admin-Übersicht (Client): beide Seiten lesen und schreiben genau diese Form.

/** Herkunft eines Eintrags: hier gespieltes Spiel oder nur importiertes Ergebnis eines fremden Servers. */
export type AdminGameSource = 'local' | 'imported';

export type AdminPlayerSummary = {
  name: string;
  color: Color;
  /** Link zur Spieleransicht; bei Importen nur für den Spieler, dessen Link importiert wurde. */
  url: string | undefined;
  victoryPoints: number;
  megaCredits: number;
  isWinner: boolean;
};

export type AdminGameSummary = {
  id: string;
  source: AdminGameSource;
  /** Bei lokalen Spielen der Spielstart, bei Importen der Zeitpunkt des Imports. */
  createdTimeMs: number;
  isFinished: boolean;
  generation: number;
  spectatorUrl: string | undefined;
  /** Ursprünglicher Link eines importierten Spiels. */
  externalUrl: string | undefined;
  /** Teilnehmer-ID, unter der ein importiertes Spiel hier gespeichert ist (Ergebnisseite the-end?id=…). */
  importedParticipantId: string | undefined;
  players: Array<AdminPlayerSummary>;
};

export type AdminDeleteGameRequest = {
  id: string;
};

export type AdminImportGameRequest = {
  url: string;
};
