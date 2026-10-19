import {IGame} from '../IGame';
import {BAZAAR_ACTION_TITLE, BAZAAR_WARE_TITLE} from '../../common/dune/duneActionTitles';
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
import {
  BAZAAR_SLOT_PRICE_CHANGE, BAZAAR_WARES, BazaarGood, bazaarPrice, bazaarWare, bazaarWareCount,
} from '../../common/dune/bazaarWares';

// Module A – Bazaar of Arrakeen (claude/dune-erweiterung-konzept.md). Each generation, right after research:
// 1. the wares slide one slot to the right (cheaper); a ware pushed out on the right is discarded,
// 2. new wares are laid out from the left until there are one fewer than players.
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
};

/** Title of the choice of the former bazaar phase; the AI recognises it by this (ai/duneChoices.ts) */
export const BAZAAR_TITLE = 'Bazaar of Arrakeen: buy one ware';
export {BAZAAR_ACTION_TITLE};

export function initializeBazaar(rng: Random): BazaarData {
  const deck = BAZAAR_WARES.map((ware) => ware.name);
  inplaceShuffle(deck, rng);
  return {deck, discard: [], slots: BAZAAR_SLOT_PRICE_CHANGE.map(() => null), buyers: [], bought: []};
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

/** Steps 1 and 2: slide right, then refill from the left */
export function slideAndRefill(data: BazaarData, playerCount: number, rng: Random): void {
  const pushedOut = data.slots[data.slots.length - 1];
  if (pushedOut !== null && pushedOut !== undefined) {
    data.discard.push(pushedOut);
  }
  data.slots = [null, ...data.slots.slice(0, data.slots.length - 1)];
  const wanted = bazaarWareCount(playerCount);
  for (let slot = 0; slot < data.slots.length && data.slots.filter((ware) => ware !== null).length < wanted; slot++) {
    if (data.slots[slot] === null) {
      data.slots[slot] = drawWare(data, rng) ?? null;
    }
  }
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

/** Caravan Master card: the ware in `slot` for free, if one lies there */
export function takeFreeWare(player: IPlayer, slot: number): void {
  const data = player.game.duneData?.bazaar;
  const name = data?.slots[slot];
  if (data === undefined || name === null || name === undefined) {
    return;
  }
  data.slots[slot] = null;
  data.discard.push(name);
  player.game.log('${0} took ${1} from the bazaar', (b) => b.player(player).string(name));
  payOut(player, name);
}


export function buyWare(player: IPlayer, data: BazaarData, slot: number): void {
  const name = data.slots[slot];
  const price = priceFor(player, data, slot);
  if (name === null || name === undefined || price === undefined) {
    throw new Error(`No ware in bazaar slot ${slot}`);
  }
  player.stock.deduct(Resource.MEGACREDITS, price);
  data.slots[slot] = null;
  data.discard.push(name);
  data.bought = [...(data.bought ?? []), player.id];
  player.game.log('${0} bought ${1} at the bazaar for ${2} M€', (b) => b.player(player).string(name).number(price));
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

/** The bazaar action of the action menu; undefined when the player already bought this generation or cannot pay */
export function buyAction(player: IPlayer, data: BazaarData): OrOptions | undefined {
  if ((data.bought ?? []).includes(player.id)) {
    return undefined;
  }
  const options = wareOptions(player, data);
  return options.length === 0 ? undefined : new OrOptions(...options).setTitle(BAZAAR_ACTION_TITLE);
}

export function bazaarModel(game: IGame, data: BazaarData): BazaarModel {
  return {
    slots: data.slots.map((name, slot) => ({
      ware: name ?? undefined,
      price: name === null ? 0 : bazaarPrice(bazaarWare(name), slot),
    })),
    buyers: data.buyers.map((id) => game.getPlayerById(id).color),
    bought: (data.bought ?? []).map((id) => game.getPlayerById(id).color),
    deckSize: data.deck.length,
  };
}
