import {IGame} from '../IGame';
import {BAZAAR_ACTION_TITLE, BAZAAR_BUY_TITLE, BAZAAR_WARE_TITLE} from '../../common/dune/duneActionTitles';
import {SelectPayment} from '../inputs/SelectPayment';
import {Payment} from '../../common/inputs/Payment';
import {IPlayer} from '../IPlayer';
import {PlayerId} from '../../common/Types';
import {Resource} from '../../common/Resource';
import {TileType} from '../../common/TileType';
import {Random} from '../../common/utils/Random';
import {inplaceShuffle} from '../utils/shuffle';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {message} from '../logs/MessageBuilder';
import {CardName} from '../../common/cards/CardName';
import {BazaarModel} from '../../common/dune/DuneModel';
import {Color} from '../../common/Color';
import {payWithLog} from './payWithLog';
import {
  BAZAAR_SLOT_PRICE_CHANGE, BAZAAR_WARES, BazaarGood, bazaarBasePrice, bazaarPrice, bazaarStartWareCount, bazaarWare,
} from '../../common/dune/bazaarWares';

// Module A – Bazaar of Arrakeen (claude/dune-erweiterung-konzept.md). At the start one ware per player (at most 5)
// lies out from the left. Each further generation, right after research (Jens, 24 Oct 2026, bazaar prototype):
// 1. all wares slide one slot to the right (cheaper); a ware pushed out on the right is discarded,
// 2. gaps close: the wares slide on to the right until they lie side by side,
// 3. every free slot left of the first ware gets a new ware (all five when the bazaar is empty).
// During the action phase, buying a ware is an action (Jens, 19 Oct 2026: tap the ware in the bazaar tab); each
// player buys at most 1 ware per generation. The owner of the bazaar tile pays less.
// A bought ware pays out at once and goes to the discard pile; nothing is kept for later.

export type BazaarData = {
  deck: Array<string>,
  discard: Array<string>,
  /** Ware names from left (newest, dearest) to right (oldest, cheapest); null = empty */
  slots: Array<string | null>,
  /** Players still to buy in a bazaar phase of the former rules; only games saved back then have any */
  buyers: Array<PlayerId>,
  /** Players who bought a ware this generation (missing in games saved before buying became an action) */
  bought?: Array<PlayerId>,
  /** Who took the ware of each slot this generation (bought or for free); shown in the empty slot until the slide */
  takenBy?: Array<PlayerId | null>,
  /** Wares each player bought in the whole game (milestone Bazaar Regular, dune/goals); missing in older games */
  purchases?: Record<PlayerId, number>,
};

/** Title of the choice of the former bazaar phase; the AI recognises it by this (ai/duneChoices.ts) */
export const BAZAAR_TITLE = 'Bazaar of Arrakeen: buy one ware';
export {BAZAAR_ACTION_TITLE};

export function initializeBazaar(rng: Random, playerCount: number): BazaarData {
  const deck = BAZAAR_WARES.map((ware) => ware.name);
  inplaceShuffle(deck, rng);
  const data: BazaarData = {deck, discard: [], slots: BAZAAR_SLOT_PRICE_CHANGE.map(() => null), buyers: [], bought: []};
  const startCount = bazaarStartWareCount(playerCount);
  for (let slot = 0; slot < startCount; slot++) {
    data.slots[slot] = drawWare(data, rng) ?? null;
  }
  return data;
}

/** The owner of the Bazaar special tile (Commercial District) pays less */
export function ownsBazaarTile(player: IPlayer): boolean {
  return player.game.board.spaces.some((space) => space.tile?.tileType === TileType.COMMERCIAL_DISTRICT && space.player?.id === player.id);
}

function drawWare(data: BazaarData, rng: Random): string | undefined {
  if (data.deck.length === 0) {
    data.deck = data.discard;
    data.discard = [];
    inplaceShuffle(data.deck, rng);
  }
  return data.deck.shift();
}

/** Steps 1 to 3 of a new generation: slide right, close the gaps, fill up left of the first ware */
export function slideAndRefill(data: BazaarData, rng: Random): void {
  // A new generation: the empty slots no longer tell who took their ware
  data.takenBy = undefined;
  const slotCount = data.slots.length;
  const pushedOut = data.slots[slotCount - 1];
  if (pushedOut !== null && pushedOut !== undefined) {
    data.discard.push(pushedOut);
  }
  const slid = [null, ...data.slots.slice(0, slotCount - 1)];
  // Close the gaps against the rightmost ware: it keeps its slot, the others line up to its left
  const wares = slid.filter((ware): ware is string => ware !== null);
  const rightmost = slid.findLastIndex((ware) => ware !== null);
  const packed: Array<string | null> = slid.map(() => null);
  wares.forEach((ware, index) => {
    packed[rightmost - wares.length + 1 + index] = ware;
  });
  const firstWare = wares.length === 0 ? slotCount : rightmost - wares.length + 1;
  for (let slot = 0; slot < firstWare; slot++) {
    packed[slot] = drawWare(data, rng) ?? null;
  }
  data.slots = packed;
}

const GOOD_RESOURCE: Partial<Record<BazaarGood, Resource>> = {
  steel: Resource.STEEL,
  titanium: Resource.TITANIUM,
  plants: Resource.PLANTS,
  energy: Resource.ENERGY,
  heat: Resource.HEAT,
};

/** Bazaar Concession card: 3 M€ off every purchase */
export const CONCESSION_DISCOUNT = 3;

export function priceFor(player: IPlayer, data: BazaarData, slot: number): number | undefined {
  const name = data.slots[slot];
  if (name === null || name === undefined) {
    return undefined;
  }
  const concession = player.tableau.has(CardName.BAZAAR_CONCESSION) ? CONCESSION_DISCOUNT : 0;
  return Math.max(0, bazaarPrice(bazaarWare(name), slot, ownsBazaarTile(player)) - concession);
}

function payOut(player: IPlayer, name: string): void {
  for (const [good, amount] of Object.entries(bazaarWare(name).content) as Array<[BazaarGood, number]>) {
    const resource = GOOD_RESOURCE[good];
    if (resource !== undefined) {
      player.stock.add(resource, amount, {log: true});
    } else if (good === 'cards') {
      player.drawCard(amount);
    } else {
      player.increaseTerraformRating(amount, {log: true});
    }
  }
}

// The slot shows who took its ware (Jens, 19 Oct 2026)
function markTaken(data: BazaarData, slot: number, player: IPlayer): void {
  const takenBy = data.takenBy ?? data.slots.map(() => null);
  takenBy[slot] = player.id;
  data.takenBy = takenBy;
}

/** Caravan Master card: the ware in `slot` for free, if one lies there */
/** Caravan Master card: the cheapest ware on display for free (the first of equal prices); nothing when none lies out */
export function takeCheapestWare(player: IPlayer): void {
  const data = player.game.duneData?.bazaar;
  if (data === undefined) {
    return;
  }
  let cheapest: {slot: number, price: number} | undefined;
  data.slots.forEach((_, slot) => {
    const price = priceFor(player, data, slot);
    if (price !== undefined && (cheapest === undefined || price < cheapest.price)) {
      cheapest = {slot, price};
    }
  });
  if (cheapest !== undefined) {
    takeFreeWare(player, cheapest.slot);
  }
}

export function takeFreeWare(player: IPlayer, slot: number): void {
  const data = player.game.duneData?.bazaar;
  const name = data?.slots[slot];
  if (data === undefined || name === null || name === undefined) {
    return;
  }
  data.slots[slot] = null;
  markTaken(data, slot, player);
  data.discard.push(name);
  player.game.log('${0} took ${1} from the bazaar', (b) => b.player(player).string(name));
  payOut(player, name);
}


/** Buys the ware in `slot`; with a payment (heat for Helion …) from it, otherwise in M€ */
export function buyWare(player: IPlayer, data: BazaarData, slot: number, payment?: Payment): void {
  const name = data.slots[slot];
  const price = priceFor(player, data, slot);
  if (name === null || name === undefined || price === undefined) {
    throw new Error(`No ware in bazaar slot ${slot}`);
  }
  // The line first: price and content follow it and land on its right in the log (logActions.ts)
  player.game.log('${0} bought ${1} at the bazaar for ${2} M€', (b) => b.player(player).string(name).number(price));
  if (payment !== undefined) {
    payWithLog(player, payment);
  } else {
    player.stock.deduct(Resource.MEGACREDITS, price, {log: true});
  }
  data.slots[slot] = null;
  markTaken(data, slot, player);
  data.discard.push(name);
  data.bought = [...(data.bought ?? []), player.id];
  data.purchases = {...data.purchases, [player.id]: (data.purchases?.[player.id] ?? 0) + 1};
  payOut(player, name);
}

/** One option per ware the player can afford */
function wareOptions(player: IPlayer, data: BazaarData): Array<SelectOption> {
  const options: Array<SelectOption> = [];
  data.slots.forEach((name, slot) => {
    const price = priceFor(player, data, slot);
    if (name === null || price === undefined || price > player.megaCredits) {
      return;
    }
    options.push(new SelectOption(message(BAZAAR_WARE_TITLE, (b) => b.string(name).number(price)), 'Buy')
      .andThen(() => {
        buyWare(player, data, slot);
        return undefined;
      }));
  });
  return options;
}

/** The choice of the former bazaar phase (games saved back then); undefined when nothing is affordable */
export function buyInput(player: IPlayer, data: BazaarData): OrOptions | undefined {
  const options = wareOptions(player, data);
  if (options.length === 0) {
    return undefined;
  }
  options.push(new SelectOption('Buy nothing', 'Pass').andThen(() => {
    player.game.log('${0} bought nothing at the bazaar', (b) => b.player(player));
    return undefined;
  }));
  return new OrOptions(...options).setTitle(BAZAAR_TITLE);
}

/**
 * The bazaar actions of the action menu: one payment per affordable ware, each its own option. The client shows such
 * a tab only after a tap on its ware in the bazaar, with the usual payment box (before/after, cancel) – Jens,
 * 19 Oct 2026. None when the player already bought this generation.
 */
export function bazaarTabActions(player: IPlayer, data: BazaarData): Array<SelectPayment> {
  if ((data.bought ?? []).includes(player.id)) {
    return [];
  }
  const actions: Array<SelectPayment> = [];
  data.slots.forEach((name, slot) => {
    const price = priceFor(player, data, slot);
    if (name === null || price === undefined || !player.canAfford(price)) {
      return;
    }
    actions.push(new SelectPayment(message(BAZAAR_BUY_TITLE, (b) => b.string(name).number(price)), price, {})
      .andThen((payment) => {
        buyWare(player, data, slot, payment);
        return undefined;
      }));
  });
  return actions;
}

function takenByColor(game: IGame, id: PlayerId | null | undefined): Color | undefined {
  return id === null || id === undefined ? undefined : game.getPlayerById(id).color;
}

export function bazaarModel(game: IGame, data: BazaarData, viewer?: IPlayer): BazaarModel {
  return {
    slots: data.slots.map((name, slot) => {
      const price = name === null ? 0 : bazaarPrice(bazaarWare(name), slot);
      return {
        ware: name ?? undefined,
        price,
        basePrice: name === null ? undefined : bazaarBasePrice(bazaarWare(name)),
        ownPrice: name === null ? undefined : (viewer === undefined ? price : priceFor(viewer, data, slot)),
        takenBy: takenByColor(game, data.takenBy?.[slot]),
      };
    }),
    buyers: data.buyers.map((id) => game.getPlayerById(id).color),
    bought: (data.bought ?? []).map((id) => game.getPlayerById(id).color),
    deckSize: data.deck.length,
  };
}
