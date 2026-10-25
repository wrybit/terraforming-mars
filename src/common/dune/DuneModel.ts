import {ExchangeGood, ExchangeModel, ExchangeSide} from './smugglingExchange';
import {Color} from '../Color';
import {BoardName} from '../boards/BoardName';
import {Resource} from '../Resource';
import {SpaceId} from '../Types';

// What the client gets of the Dune expansion (server/dune/DuneExpansion.ts); only the modules of this game.

export type BazaarSlotModel = {
  /** Ware name (common/dune/bazaarWares.ts), undefined = empty slot */
  ware: string | undefined,
  /** Price in this slot before a player's own discount */
  price: number,
  /** Printed price of the ware (its card value less 10 %), before the slot and any discount */
  basePrice?: number,
  /**
   * What the viewer pays here: slot plus own discounts (bazaar tile, Bazaar Concession). Shown like a discounted
   * project card, printed price → own price (Jens, 19 Oct 2026); spectators see the slot price.
   */
  ownPrice?: number,
  /** Empty slot: the player who took its ware this generation */
  takenBy?: Color,
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
  /** Heading of the first step of that move (0 top left … 5 left, clockwise); differs from the die when it bounced */
  direction: number | undefined,
  /** The rolled direction was blocked, the worm bounced off right away */
  turned: boolean,
  /** Spaces crossed by the last move */
  path: ReadonlyArray<string>,
  /** Where the worm has been: the space it began on and every move since, oldest first */
  trail: WormTrailModel,
  /** Player choosing the distance right now */
  chooser: Color | undefined,
  /** The Thumper card was played this generation: the worm may move 1 to 3 spaces, whatever the vegetation */
  thumper?: true,
  /** While a player chooses: the spaces crossed by each choice, in the order of the options (server/dune/Worm.ts) */
  choices?: ReadonlyArray<ReadonlyArray<string>>,
};

export type PlayerCount = {color: Color, sardaukar: number};

export type KanlyModel = {
  garrisons: ReadonlyArray<PlayerCount>,
  battle: {
    spaceId: SpaceId,
    owner: Color | undefined,
    opener: Color,
    troops: ReadonlyArray<PlayerCount>,
  } | undefined,
  foughtThisGeneration: boolean,
};

/**
 * Top of the envy track of CHOAM (formerly suspicion): 0–5; levels from 3 on cost TR at the end of the generation,
 * after which the marker drops back to 0; at 5 every CHOAM move but the tribute is closed (Jens 19 Oct 2026; one more
 * free step since 24 Oct 2026, now that every CHOAM move raises it)
 */
export const MAX_SUSPICION = 5;
export const COSTLY_SUSPICION = 3;

/** TR lost at the end of the generation for an envy level: 0 to 2 free, 3 → 1, 4 → 2, 5 → 3 */
export function suspicionPenalty(level: number): number {
  return Math.max(0, level - COSTLY_SUSPICION + 1);
}

/** The emperor's privilege of a generation (server/dune/Privilege.ts) */
export type PrivilegeModel = {
  generation: number,
  good: ExchangeGood,
  amount: number,
  /** What the emperor pays (1.5 × the normal worth) */
  pay: number,
  /** Normal worth of the goods at the guild */
  worth: number,
  /** Who delivered it this generation */
  takenBy: Color | undefined,
};

/** One of the viewer's own open prophecies (server/dune/Prophecy.ts) */
export type ProphecyModel = {
  id: number,
  side: ExchangeSide,
  good: ExchangeGood,
  amount: number,
  limit: number,
  /** Bet premium if it comes true (sell orders only) */
  premium: number,
  /** Buy orders since 25 Oct 2026: the Solari bound (prophecyOutcome.ts) */
  budget?: number,
};

/** CHOAM: the exchange, the envy track, the privilege and the viewer's prophecies (the data keeps its old name) */
export type SmugglingModel = {
  /** Every player's envy level and what a tribute costs them (cards and the smugglers' market lower it) */
  suspicion: ReadonlyArray<{color: Color, level: number, bribeCost: number}>,
  /** Rates of the exchange, every generation so far and the forecast (common/dune/smugglingExchange.ts) */
  exchange: ExchangeModel,
  privilege: PrivilegeModel,
  /** The privilege of the next generation, shown ahead so players can prepare (Jens 25 Oct 2026) */
  nextPrivilege?: PrivilegeModel,
  /** The viewer's own open prophecies; empty for spectators */
  orders: ReadonlyArray<ProphecyModel>,
};

export type ChoamOfferModel = {
  color: Color,
  give: Resource,
  giveAmount: number,
  want: Resource,
  wantAmount: number,
  /** Last generation the offer stands (server/dune/Choam.ts CHOAM_OFFER_GENERATIONS) */
  expires: number,
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
  /**
   * Only for the viewer, while a card lets them look at agendas: Mentat Calculation – the top 3 of the deck with the
   * values they would count for the viewer; Tleilaxu Spy – the agendas of `target` with that player's values
   */
  look?: {
    kind: 'mentat' | 'spy',
    target?: Color,
    agendas: ReadonlyArray<{name: string, value: number, level: number}>,
  },
};

export type DuneModel = {
  /** The Arrakis board of the game: its layout names spaces and draws the mini maps (common/dune/arrakisLayout.ts) */
  board: BoardName,
  bazaar?: BazaarModel,
  worm?: WormModel,
  kanly?: KanlyModel,
  smuggling?: SmugglingModel,
  choam?: ChoamModel,
  schemes?: SchemeModel,
};
