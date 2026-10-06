import {CardName} from '@/common/cards/CardName';
import {Expansion, GameModule, EXPANSIONS, GAME_MODULES} from '@/common/cards/GameModule';
import {byModule, byType, getCards} from '@/client/cards/ClientCardManifest';
import {CardType} from '@/common/cards/CardType';
import {toName} from '@/common/utils/utils';

// Default pools of the custom card lists (corporations, preludes, CEOs): exactly what the game
// would deal without a custom list. Shared by the list editors and the overview that only shows
// the difference to this default.

export type CustomCardListKind = 'corporations' | 'preludes' | 'ceos';

const CARD_TYPE: Record<CustomCardListKind, CardType> = {
  corporations: CardType.CORPORATION,
  preludes: CardType.PRELUDE,
  ceos: CardType.CEO,
};

// Never part of a custom pool: the beginner corporation is chosen per player, Delta Project is dealt automatically
const EXCLUDED: ReadonlyArray<CardName> = [CardName.BEGINNER_CORPORATION, CardName.DELTA_PROJECT];

// Module that is always part of the pool, regardless of the expansion switches
const ALWAYS: Record<CustomCardListKind, ReadonlyArray<GameModule>> = {
  corporations: ['base'],
  preludes: ['prelude'],
  ceos: ['base'],
};

export function customListCardNames(kind: CustomCardListKind, module: GameModule): Array<CardName> {
  return getCards(byModule(module))
    .filter(byType(CARD_TYPE[kind]))
    .map(toName)
    .filter((name) => !EXCLUDED.includes(name));
}

export function defaultCustomList(kind: CustomCardListKind, expansions: Record<Expansion, boolean>): Array<CardName> {
  const modules: Array<GameModule> = [...ALWAYS[kind], ...EXPANSIONS.filter((expansion) => expansions[expansion])];
  return [...new Set(modules)].flatMap((module) => customListCardNames(kind, module));
}

// Difference of a custom list to the default pool; an empty list means "default"
export function customListDelta(kind: CustomCardListKind, expansions: Record<Expansion, boolean>, selected: ReadonlyArray<CardName>) {
  const defaults = defaultCustomList(kind, expansions);
  if (selected.length === 0) {
    return {added: [], removed: []};
  }
  return {
    added: selected.filter((name) => !defaults.includes(name)).sort(),
    removed: defaults.filter((name) => !selected.includes(name)).sort(),
  };
}

// All cards of a kind, grouped by module and sorted – the groups of the list editor
export function customListCardsByModule(kind: CustomCardListKind): Record<GameModule, Array<CardName>> {
  const byGroup = Object.fromEntries(GAME_MODULES.map((module) => [module, customListCardNames(kind, module).sort()]));
  return byGroup as Record<GameModule, Array<CardName>>;
}
