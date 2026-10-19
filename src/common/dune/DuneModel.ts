import {Color} from '../Color';
import {Resource} from '../Resource';

// What the client gets of the Dune expansion (server/dune/DuneExpansion.ts); only the modules of this game.

export type BazaarSlotModel = {
  /** Ware name (common/dune/bazaarWares.ts), undefined = empty slot */
  ware: string | undefined,
  /** Price in this slot before a player's own discount */
  price: number,
};

export type BazaarModel = {
  slots: ReadonlyArray<BazaarSlotModel>,
  /** Players still to buy in a bazaar phase of the former rules (only games saved back then) */
  buyers: ReadonlyArray<Color>,
  /** Players who bought a ware this generation (buying is an action, at most once per generation) */
  bought: ReadonlyArray<Color>,
  deckSize: number,
};

/** One move of the worm: the generation it ended and the spaces crossed (empty when the worm was blocked) */
export type WormMoveModel = {generation: number, path: ReadonlyArray<string>};

export type WormTrailModel = {start: string, moves: ReadonlyArray<WormMoveModel>};

export type WormModel = {
  spaceId: string,
  /** Die of the last move (1 top right … 6 top left, clockwise) */
  roll: number | undefined,
  /** Heading of that move (0 top left … 5 left, clockwise); differs from the die when rock made the worm turn */
  direction: number | undefined,
  /** The rolled direction was blocked, the worm turned clockwise */
  turned: boolean,
  /** Spaces crossed by the last move */
  path: ReadonlyArray<string>,
  /** Where the worm has been: the space it began on and every move since, oldest first */
  trail: WormTrailModel,
  /** Player choosing the distance right now */
  chooser: Color | undefined,
  /** While a player chooses: the spaces crossed by each choice, in the order of the options (server/dune/Worm.ts) */
  choices?: ReadonlyArray<ReadonlyArray<string>>,
};

export type PlayerCount = {color: Color, sardaukar: number};

export type KanlyModel = {
  garrisons: ReadonlyArray<PlayerCount>,
  battle: {
    spaceId: string,
    owner: Color | undefined,
    opener: Color,
    troops: ReadonlyArray<PlayerCount>,
  } | undefined,
  foughtThisGeneration: boolean,
};

/** Top of the suspicion track (module E); levels from 3 on cost TR at the end of the generation */
export const MAX_SUSPICION = 5;
export const COSTLY_SUSPICION = 3;

/** TR lost at the end of the generation for a suspicion level: 3 → 1, 4 → 2, 5 → 3 */
export function suspicionPenalty(level: number): number {
  return Math.max(0, level - COSTLY_SUSPICION + 1);
}

export type SmugglingModel = {
  suspicion: ReadonlyArray<{color: Color, level: number}>,
};

export type ChoamOfferModel = {
  color: Color,
  give: Resource,
  giveAmount: number,
  want: Resource,
  wantAmount: number,
};

export type ChoamModel = {
  offers: ReadonlyArray<ChoamOfferModel>,
};

export type SchemeModel = {
  reduced: boolean,
  players: ReadonlyArray<{
    color: Color,
    count: number,
    /** Only the viewer's own agendas, and everybody's after the game */
    agendas: ReadonlyArray<{name: string, value: number, level: number}> | undefined,
  }>,
};

export type DuneModel = {
  bazaar?: BazaarModel,
  worm?: WormModel,
  kanly?: KanlyModel,
  smuggling?: SmugglingModel,
  choam?: ChoamModel,
  schemes?: SchemeModel,
};
