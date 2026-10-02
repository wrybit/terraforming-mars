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
  /** Hinweis unter der Liste, woher die Einträge stammen (Englisch, wird übersetzt). */
  note?: string;
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
    // Mit vollständigem Spielstand aus den ausgespielten Karten (Importe kennen den Konzern sonst nicht), sonst aus
    // der Zusammenfassung – so zählen auch Screenshot-Partien mit; mehrere Konzerne (Merger) getrennt
    namesOf: (result) => result.game.details?.cardsComplete === true ?
      cardsOfType(result, (type) => type === CardType.CORPORATION) :
      result.player.corporation?.split(' / ').filter((name) => name !== '') ?? [],
  },
  prelude: {
    label: 'Prelude cards',
    singular: 'Prelude',
    note: 'Only games with the full game state count.',
    // Screenshots zeigen Präludien nicht (sie geben keine Siegpunkte)
    namesOf: (result) => result.game.details?.cardsComplete === true ? cardsOfType(result, (type) => type === CardType.PRELUDE) : [],
  },
  card: {
    label: 'Project cards',
    singular: 'Project card',
    // Screenshots listen nur Karten mit Siegpunkten – für diese Karten sind sie vollständig
    note: 'Cards without victory points only count in games with the full game state; cards with victory points also in screenshots.',
    namesOf: (result) => cardsOfType(result, (type) => PROJECT_TYPES.has(type)),
  },
  milestone: {
    label: 'Milestones',
    singular: 'Milestone',
    note: 'Only games with a known final state count.',
    namesOf: (result) => (result.game.details?.milestones ?? [])
      .filter((milestone) => milestone.playerName === result.player.name)
      .map((milestone) => milestone.name),
  },
  award: {
    label: 'Awards',
    singular: 'Award',
    note: 'Only games with a known final state count.',
    // Gezählt beim Finanzierer: die Frage ist, ob sich das Finanzieren gelohnt hat
    namesOf: (result) => (result.game.details?.awards ?? [])
      .filter((award) => award.funderName === result.player.name)
      .map((award) => award.name),
  },
  board: {
    label: 'Boards',
    singular: 'Board',
    note: 'Only games with a known final state count.',
    namesOf: (result) => result.game.details?.boardName === undefined ? [] : [result.game.details.boardName],
  },
  player: {
    label: 'Players',
    singular: 'Player',
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
