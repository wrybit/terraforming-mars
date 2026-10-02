import {CardType} from '@/common/cards/CardType';
import {CardName} from '@/common/cards/CardName';
import {getCard} from '@/client/cards/ClientCardManifest';
import {StatsPlayerResult} from './statsResults';

// Alles, was die Statistik auflistet und als Detailseite öffnen kann. Jede Art sagt nur, welche Einträge
// ein Spieler in einer Partie "hatte" – Zählen, Sortieren und Anzeigen ist für alle Arten derselbe Code.
export type StatsKind = 'corporation' | 'prelude' | 'card' | 'milestone' | 'award' | 'board' | 'player';

export type StatsKindDefinition = {
  /** Englisch, wird beim Anzeigen übersetzt. */
  label: string;
  singular: string;
  /** True: nur Partien mit vollständigem Endstand liefern Einträge (nicht die reinen Screenshot-Partien). */
  needsDetails: boolean;
  namesOf(result: StatsPlayerResult): Array<string>;
};

const PROJECT_TYPES = new Set([CardType.AUTOMATED, CardType.ACTIVE, CardType.EVENT]);

function cardsOfType(result: StatsPlayerResult, matches: (type: CardType) => boolean): Array<string> {
  return (result.details?.cards ?? []).filter((name: CardName) => {
    const type = getCard(name)?.type;
    return type !== undefined && matches(type);
  });
}

export const STATS_KINDS: Record<StatsKind, StatsKindDefinition> = {
  corporation: {
    label: 'Corporations',
    singular: 'Corporation',
    needsDetails: false,
    // Mit Endstand aus den ausgespielten Karten (Importe kennen den Konzern sonst nicht), ohne aus der
    // Zusammenfassung – so zählen auch Screenshot-Partien mit; mehrere Konzerne (Merger) getrennt
    namesOf: (result) => result.details !== undefined ?
      cardsOfType(result, (type) => type === CardType.CORPORATION) :
      result.player.corporation?.split(' / ').filter((name) => name !== '') ?? [],
  },
  prelude: {
    label: 'Prelude cards',
    singular: 'Prelude',
    needsDetails: true,
    namesOf: (result) => cardsOfType(result, (type) => type === CardType.PRELUDE),
  },
  card: {
    label: 'Project cards',
    singular: 'Project card',
    needsDetails: true,
    namesOf: (result) => cardsOfType(result, (type) => PROJECT_TYPES.has(type)),
  },
  milestone: {
    label: 'Milestones',
    singular: 'Milestone',
    needsDetails: true,
    namesOf: (result) => (result.game.details?.milestones ?? [])
      .filter((milestone) => milestone.playerName === result.player.name)
      .map((milestone) => milestone.name),
  },
  award: {
    label: 'Awards',
    singular: 'Award',
    needsDetails: true,
    // Gezählt beim Finanzierer: die Frage ist, ob sich das Finanzieren gelohnt hat
    namesOf: (result) => (result.game.details?.awards ?? [])
      .filter((award) => award.funderName === result.player.name)
      .map((award) => award.name),
  },
  board: {
    label: 'Boards',
    singular: 'Board',
    needsDetails: true,
    namesOf: (result) => result.game.details === undefined ? [] : [result.game.details.boardName],
  },
  player: {
    label: 'Players',
    singular: 'Player',
    needsDetails: false,
    namesOf: (result) => [result.player.name],
  },
};

export function isStatsKind(value: string | null): value is StatsKind {
  return value !== null && Object.prototype.hasOwnProperty.call(STATS_KINDS, value);
}

/** Welche anderen Arten auf der Detailseite als "zusammen gespielt" erscheinen. */
export const COMPANION_KINDS: Record<StatsKind, ReadonlyArray<StatsKind>> = {
  corporation: ['prelude', 'card'],
  prelude: ['corporation', 'card'],
  card: ['corporation', 'prelude'],
  milestone: ['corporation'],
  award: ['corporation'],
  board: ['corporation'],
  player: ['corporation', 'prelude', 'card'],
};
