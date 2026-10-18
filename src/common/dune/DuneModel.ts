import {Color} from '../Color';

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

export type DuneModel = {
  bazaar?: BazaarModel,
};
