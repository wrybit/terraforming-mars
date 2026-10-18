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
  /** Players still to buy in this bazaar phase, in buying order */
  buyers: ReadonlyArray<Color>,
  deckSize: number,
};

export type WormModel = {
  spaceId: string,
  /** Die of the last move (1 top right … 6 top left, clockwise) */
  roll: number | undefined,
  /** Spaces crossed by the last move */
  path: ReadonlyArray<string>,
  /** Player choosing the distance right now */
  chooser: Color | undefined,
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
