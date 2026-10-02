import {AdminGameSummary} from '../admin/AdminGameSummary';
import {CardName} from '../cards/CardName';
import {BoardName} from '../boards/BoardName';
import {Expansion} from '../cards/GameModule';
import {MilestoneName} from '../ma/MilestoneName';
import {AwardName} from '../ma/AwardName';

// Vertrag zwischen Statistik-API (Server) und Statistikseite (Client): beide Seiten lesen und schreiben genau diese Form.

/** Was über einen Spieler einer Partie bekannt ist, wenn der vollständige Endstand vorliegt. */
export type StatsPlayerDetails = {
  name: string;
  /** Alle ausgespielten Karten inkl. Konzern und Präludien – welche Art eine Karte ist, entscheidet die Seite. */
  cards: Array<CardName>;
  terraformRating: number;
  greeneries: number;
  cities: number;
};

export type StatsClaimedMilestone = {
  name: MilestoneName;
  playerName: string;
};

export type StatsFundedAward = {
  name: AwardName;
  funderName: string;
  /** Alle Spieler auf Platz 1 der Auszeichnung (bei Gleichstand mehrere). */
  winnerNames: Array<string>;
};

export type StatsGameDetails = {
  boardName: BoardName;
  expansions: Array<Expansion>;
  players: Array<StatsPlayerDetails>;
  milestones: Array<StatsClaimedMilestone>;
  awards: Array<StatsFundedAward>;
};

/** Eine beendete Partie, wie die Statistik sie sieht. */
export type StatsGame = {
  /** Gleiche Zusammenfassung wie in der Admin-Übersicht – ohne Spieler-Links, die Seite ist öffentlich. */
  summary: AdminGameSummary;
  /** Ergebnisseite auf diesem Server oder gespeicherter Screenshot. */
  resultUrl: string | undefined;
  /** Fehlt, wenn nur das Ergebnis bekannt ist (Partien, die nur als Screenshot vorliegen). */
  details: StatsGameDetails | undefined;
};
