import {CardType} from '@/common/cards/CardType';
import {CardName} from '@/common/cards/CardName';
import {getCard} from '@/client/cards/ClientCardManifest';
import {StatsPlayerResult} from './statsResults';

// Everything the statistics list and can open as a detail page. Each kind only says which entries
// a player "had" in a game – counting, sorting and displaying is the same code for all kinds.
export type StatsKind = 'corporation' | 'prelude' | 'card' | 'milestone' | 'award' | 'board' | 'player';

export type StatsKindDefinition = {
  /** English, translated when displayed. */
  label: string;
  singular: string;
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
    // With a full game state, from the played cards (imports don't know the corporation otherwise), else from
    // the summary – so screenshot games count too; multiple corporations (Merger) separately
    namesOf: (result) => result.game.details?.cardsComplete === true ?
      cardsOfType(result, (type) => type === CardType.CORPORATION) :
      result.player.corporation?.split(' / ').filter((name) => name !== '') ?? [],
  },
  prelude: {
    label: 'Prelude cards',
    singular: 'Prelude',
    // Screenshots don't show preludes (they give no victory points)
    namesOf: (result) => result.game.details?.cardsComplete === true ? cardsOfType(result, (type) => type === CardType.PRELUDE) : [],
  },
  card: {
    label: 'Project cards',
    singular: 'Project card',
    // Screenshots only list cards with victory points – for those cards they are complete
    namesOf: (result) => cardsOfType(result, (type) => PROJECT_TYPES.has(type)),
  },
  milestone: {
    label: 'Milestones',
    singular: 'Milestone',
    namesOf: (result) => (result.game.details?.milestones ?? [])
      .filter((milestone) => milestone.playerName === result.player.name)
      .map((milestone) => milestone.name),
  },
  award: {
    label: 'Awards',
    singular: 'Award',
    // Counted for the funder: the question is whether funding paid off
    namesOf: (result) => (result.game.details?.awards ?? [])
      .filter((award) => award.funderName === result.player.name)
      .map((award) => award.name),
  },
  board: {
    label: 'Boards',
    singular: 'Board',
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

/** Which other kinds appear as "played together" on the detail page. */
export const COMPANION_KINDS: Record<StatsKind, ReadonlyArray<StatsKind>> = {
  corporation: ['prelude', 'card'],
  prelude: ['corporation', 'card'],
  card: ['corporation', 'prelude'],
  milestone: ['corporation'],
  award: ['corporation'],
  board: ['corporation'],
  player: ['corporation', 'prelude', 'card'],
};
