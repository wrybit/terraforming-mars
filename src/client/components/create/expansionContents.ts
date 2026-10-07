import {CardType} from '@/common/cards/CardType';
import {GameModule} from '@/common/cards/GameModule';
import {getCards} from '@/client/cards/ClientCardManifest';
import {CONTENT_KEYS, ContentKey, EXPANSION_FACTS, TraitKey} from '@/common/game/expansionFacts';

// What each game module adds, for the content line of its tile and for grouping the expansions.
// Card counts come from the client card manifest; everything else from expansionFacts.ts.

/** Layout of a module: its own board, extra things on the Mars board, or cards only. */
export type BoardLayout = 'ownBoard' | 'changesMars' | 'cardsOnly';

/** Content of one game module. */
export type ExpansionContents = {
  counts: Partial<Record<ContentKey, number>>;
  traits: ReadonlySet<TraitKey>;
  layout: BoardLayout;
  // Kind of new tiles (English, translated in the UI); only set with the trait `newTiles`
  tiles?: string;
};

const PROJECT_TYPES: ReadonlyArray<CardType> = [CardType.AUTOMATED, CardType.ACTIVE, CardType.EVENT];
const STANDARD_TYPES: ReadonlyArray<CardType> = [CardType.STANDARD_PROJECT, CardType.STANDARD_ACTION];

function countCards(module: GameModule): Partial<Record<ContentKey, number>> {
  const cards = getCards((card) => card.module === module);
  const count = (types: ReadonlyArray<CardType>) => cards.filter((card) => types.includes(card.type)).length;
  return {
    project: count(PROJECT_TYPES),
    corporation: count([CardType.CORPORATION]),
    prelude: count([CardType.PRELUDE]),
    ceo: count([CardType.CEO]),
    // The base game's standard projects are the baseline, not something it "adds"
    standardProject: module === 'base' ? 0 : count(STANDARD_TYPES),
  };
}

function layoutOf(traits: ReadonlySet<TraitKey>): BoardLayout {
  if (traits.has('ownBoard')) {
    return 'ownBoard';
  }
  if (traits.has('changesMars')) {
    return 'changesMars';
  }
  return 'cardsOnly';
}

const cache = new Map<GameModule, ExpansionContents>();

/** Content of `module`, computed once per page. Zero counts are left out. */
export function expansionContents(module: GameModule): ExpansionContents {
  let contents = cache.get(module);
  if (contents === undefined) {
    const facts = EXPANSION_FACTS[module] ?? {};
    const counts: Partial<Record<ContentKey, number>> = {
      ...countCards(module),
      globalEvent: facts.globalEvent,
      colonyTile: facts.colonyTile,
      milestone: facts.milestone,
      award: facts.award,
    };
    for (const key of CONTENT_KEYS) {
      if (!counts[key]) {
        delete counts[key];
      }
    }
    const traits = new Set(facts.traits ?? []);
    contents = {counts, traits, layout: layoutOf(traits), tiles: facts.tiles};
    cache.set(module, contents);
  }
  return contents;
}
