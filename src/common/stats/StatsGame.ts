import {AdminGameSummary} from '../admin/AdminGameSummary';
import {CardName} from '../cards/CardName';
import {BoardName} from '../boards/BoardName';
import {Expansion} from '../cards/GameModule';
import {MilestoneName} from '../ma/MilestoneName';
import {AwardName} from '../ma/AwardName';
import {SpaceId} from '../Types';

// Vertrag zwischen Statistik-API (Server) und Statistikseite (Client): beide Seiten lesen und schreiben genau diese Form.

/** Siegpunkte nach Herkunft, wie in der Aufschlüsselung der Ergebnisseite. */
export type StatsVictoryPoints = {
  terraformRating: number;
  milestones: number;
  awards: number;
  greenery: number;
  city: number;
  cards: number;
  /** Alles Übrige (Mond, Fluchtgeschwindigkeit, Pfadfinder-Leisten …). */
  other: number;
  total: number;
};

export type StatsCardPoints = {
  name: CardName;
  points: number;
};

/** Was über einen Spieler einer Partie bekannt ist, wenn der Endstand vorliegt. Fehlende Werte waren nicht ablesbar. */
export type StatsPlayerDetails = {
  name: string;
  /** Ausgespielte Karten inkl. Konzern und Präludien; bei Screenshots nur die Karten mit Siegpunkten (cardsComplete). */
  cards: Array<CardName>;
  /** Siegpunkte je Karte (nur Karten, die Punkte geben können). */
  cardPoints?: Array<StatsCardPoints>;
  terraformRating?: number;
  greeneries?: number;
  cities?: number;
  victoryPoints?: StatsVictoryPoints;
  /** Siegpunkte am Ende jeder Generation (Index 0 = Generation 1). */
  pointsByGeneration?: Array<number>;
  megaCredits?: number;
  /** Bedenkzeit über die ganze Partie. */
  timeSeconds?: number;
  actions?: number;
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
  /** Spieler auf Platz 2 (nur bei mehr als zwei Spielern punktet er). */
  secondNames?: Array<string>;
};

/** Fortschritt der globalen Parameter in Prozent am Ende jeder Generation. */
export type StatsGlobals = {
  temperature: Array<number>;
  oxygen: Array<number>;
  oceans: Array<number>;
  venus?: Array<number>;
};

/** Ein Stadt- oder Grünflächenplättchen am Ende der Partie – Grundlage der Heatmap. */
export type StatsTile = {
  spaceId: SpaceId;
  type: 'city' | 'greenery';
  playerName: string;
};

export type StatsGameDetails = {
  /** Aus dem Spielstand gelesen oder aus einem Screenshot der Ergebnisseite abgelesen. */
  source: 'game' | 'screenshot';
  /** False: in cards stehen nur die Karten mit Siegpunkten (mehr zeigt ein Screenshot nicht). */
  cardsComplete: boolean;
  boardName: BoardName | undefined;
  expansions: Array<Expansion>;
  players: Array<StatsPlayerDetails>;
  milestones: Array<StatsClaimedMilestone>;
  awards: Array<StatsFundedAward>;
  globalsByGeneration?: StatsGlobals;
  /** Nur aus dem Spielstand; ein Screenshot zeigt das Spielbrett nicht. */
  tiles?: Array<StatsTile>;
};

/** Eine beendete Partie, wie die Statistik sie sieht. */
export type StatsGame = {
  /** Gleiche Zusammenfassung wie in der Admin-Übersicht – ohne Spieler-Links, die Seite ist öffentlich. */
  summary: AdminGameSummary;
  /** Ergebnisseite auf diesem Server oder gespeicherter Screenshot. */
  resultUrl: string | undefined;
  /** Fehlt, wenn vom Ergebnis nichts weiter bekannt ist. */
  details: StatsGameDetails | undefined;
};
