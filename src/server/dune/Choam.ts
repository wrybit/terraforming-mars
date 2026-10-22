import {IGame} from '../IGame';
import {CHOAM_ACCEPT_OFFER_TITLE, CHOAM_ACCEPT_TITLE, CHOAM_OFFER_TITLE, CHOAM_TITLE, CHOAM_WITHDRAW_TITLE} from '../../common/dune/duneActionTitles';
import {IPlayer} from '../IPlayer';
import {PlayerId} from '../../common/Types';
import {ALL_RESOURCES, Resource} from '../../common/Resource';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {SelectTrade} from '../inputs/SelectTrade';
import {PlayerInput} from '../PlayerInput';
import {message} from '../logs/MessageBuilder';
import {ChoamModel} from '../../common/dune/DuneModel';
import {RESOURCE_LABEL} from './resourceLabels';
import {CardName} from '../../common/cards/CardName';

// Module D – CHOAM contracts (claude/dune-erweiterung-konzept.md): open trade between players, every step a normal action.
// 1. Offer: the offered goods leave the tableau and lie on the own place of the CHOAM exchange, together with the
//    wish (kind and amount up to 30; the offer itself up to the whole stock – Jens, 19 Oct 2026). At most 1 open
//    offer per player.
// 2. Accept: another player takes the offer in their own turn – whoever comes first gets the deal.
// 3. Only then both pay 1 M€ to the bank.
// 4. Nobody accepts: the goods go back to the offerer without a fee – at the end of the second generation, the one
//    they were made in included (Jens 22 Oct 2026: one generation was too short to find a buyer).
// 5. Withdraw: the offerer takes an open offer back as an action, without a fee (Jens, 19 Oct 2026: the own line of
//    the CHOAM tab needs a move of its own).

export type ChoamOffer = {
  seller: PlayerId,
  give: Resource,
  giveAmount: number,
  want: Resource,
  wantAmount: number,
  /** Last generation the offer stands; at its end the goods go back. Missing in games saved before: this generation */
  expires?: number,
};

export type ChoamData = {
  /** Open offers in the order they were made */
  offers: Array<ChoamOffer>,
  /** Contracts each player closed, as buyer or seller (milestone CHOAM Partner, dune/goals); missing in older games */
  deals?: Record<PlayerId, number>,
};

export const CHOAM_FEE = 1;
/** Generations an offer stands, the one it is made in included */
export const CHOAM_OFFER_GENERATIONS = 2;
/** Most that can be wished for in return */
export const MAX_CHOAM_WISH = 30;

export function initializeChoam(): ChoamData {
  return {offers: []};
}

/** At most 1 open offer per player, 2 with the Guild Bank card */
export function maxOffers(player: IPlayer): number {
  return player.tableau.has(CardName.GUILD_BANK) ? 2 : 1;
}

/**
 * Making an offer: one trade input with both sides (what leaves the stock, what is wished in return), its own tab
 * of the action menu (Jens, 19 Oct 2026). Undefined while the player may not make another offer.
 */
export function offerInput(player: IPlayer, data: ChoamData): SelectTrade | undefined {
  if (data.offers.filter((offer) => offer.seller === player.id).length >= maxOffers(player)) {
    return undefined;
  }
  const give = ALL_RESOURCES
    .filter((resource) => player.stock.get(resource) >= 1)
    .map((resource) => ({resource, max: player.stock.get(resource)}));
  if (give.length === 0) {
    return undefined;
  }
  return new SelectTrade(CHOAM_OFFER_TITLE, 'Offer', give, ALL_RESOURCES, MAX_CHOAM_WISH).andThen((trade) => {
    player.stock.deduct(trade.give, trade.giveAmount, {log: true});
    data.offers.push({seller: player.id, give: trade.give, giveAmount: trade.giveAmount, want: trade.get, wantAmount: trade.getAmount,
      expires: player.game.generation + CHOAM_OFFER_GENERATIONS - 1});
    player.game.log('${0} offers ${1} ${2} for ${3} ${4} at the CHOAM exchange', (b) => b.player(player)
      .number(trade.giveAmount).string(RESOURCE_LABEL[trade.give]).number(trade.getAmount).string(RESOURCE_LABEL[trade.get]));
    return undefined;
  });
}

/** Whether `player` can pay for the offer plus the fee */
export function canAccept(player: IPlayer, offer: ChoamOffer): boolean {
  const fee = (offer.want === Resource.MEGACREDITS ? offer.wantAmount : 0) + feeOf(player);
  return player.megaCredits >= fee && (offer.want === Resource.MEGACREDITS || player.stock.get(offer.want) >= offer.wantAmount);
}

/** The fee to the bank; the CHOAM Directorate card frees its owner of it */
export function feeOf(player: IPlayer): number {
  return player.tableau.has(CardName.CHOAM_DIRECTORATE) ? 0 : CHOAM_FEE;
}

export function acceptOffer(game: IGame, data: ChoamData, buyer: IPlayer, offer: ChoamOffer): void {
  const seller = game.getPlayerById(offer.seller);
  data.offers.splice(data.offers.indexOf(offer), 1);
  buyer.stock.deduct(offer.want, offer.wantAmount, {log: true});
  seller.stock.add(offer.want, offer.wantAmount, {log: true});
  buyer.stock.add(offer.give, offer.giveAmount, {log: true});
  // An offerer without M€ left pays no fee
  buyer.stock.deduct(Resource.MEGACREDITS, feeOf(buyer));
  seller.stock.deduct(Resource.MEGACREDITS, Math.min(seller.megaCredits, feeOf(seller)));
  data.deals = {...data.deals, [buyer.id]: (data.deals?.[buyer.id] ?? 0) + 1, [seller.id]: (data.deals?.[seller.id] ?? 0) + 1};
  game.log('${0} accepted the CHOAM contract of ${1}', (b) => b.player(buyer).player(seller));
}

function acceptInputs(player: IPlayer, data: ChoamData): Array<SelectOption> {
  const game = player.game;
  return data.offers
    .filter((offer) => offer.seller !== player.id && canAccept(player, offer))
    .map((offer) => new SelectOption(message('Accept ${0}: get ${1} ${2} for ${3} ${4}', (b) => b.player(game.getPlayerById(offer.seller))
      .number(offer.giveAmount).string(RESOURCE_LABEL[offer.give]).number(offer.wantAmount).string(RESOURCE_LABEL[offer.want])), 'Accept')
      .andThen(() => {
        acceptOffer(game, data, player, offer);
        return undefined;
      }));
}

/** CHOAM actions of the Dune group of the action menu: only the AI accepts offers there (each valued on a game copy) */
export function choamActions(player: IPlayer, data: ChoamData): Array<PlayerInput> {
  if (player.aiLevel === undefined) {
    return [];
  }
  const accepts = acceptInputs(player, data);
  return accepts.length === 0 ? [] : [new OrOptions(...accepts).setTitle(CHOAM_ACCEPT_TITLE)];
}

/** Withdraw an own open offer: the goods come back, no fee */
export function withdrawOffer(player: IPlayer, data: ChoamData, offer: ChoamOffer): void {
  data.offers.splice(data.offers.indexOf(offer), 1);
  player.stock.add(offer.give, offer.giveAmount, {log: true});
  player.game.log('${0} withdrew the CHOAM offer', (b) => b.player(player));
}

/**
 * The CHOAM tab of the action menu for a player (Jens, 19 Oct 2026): making an offer, accepting each offer of another
 * player that can be paid, withdrawing each own offer. The client shows them as one list with a line per player
 * (ChoamInput.vue); accept and withdraw name the offer by its place in the list. Not for the AI.
 */
export function choamTabActions(player: IPlayer, data: ChoamData): Array<PlayerInput> {
  if (player.aiLevel !== undefined) {
    return [];
  }
  const game = player.game;
  const choices: Array<PlayerInput> = [];
  const offer = offerInput(player, data);
  if (offer !== undefined) {
    choices.push(offer);
  }
  data.offers.forEach((open, index) => {
    if (open.seller === player.id) {
      choices.push(new SelectOption(message(CHOAM_WITHDRAW_TITLE, (b) => b.number(index)), 'Withdraw').andThen(() => {
        withdrawOffer(player, data, open);
        return undefined;
      }));
    } else if (canAccept(player, open)) {
      choices.push(new SelectOption(message(CHOAM_ACCEPT_OFFER_TITLE, (b) => b.number(index)), 'Accept').andThen(() => {
        acceptOffer(game, data, player, open);
        return undefined;
      }));
    }
  });
  return choices.length === 0 ? [] : [new OrOptions(...choices).setTitle(CHOAM_TITLE)];
}

/** End of generation: offers nobody accepted and whose time is up go back, without a fee; the others stay */
export function returnOffers(game: IGame, data: ChoamData): void {
  const expired = data.offers.filter((offer) => (offer.expires ?? game.generation) <= game.generation);
  for (const offer of expired) {
    const seller = game.getPlayerById(offer.seller);
    seller.stock.add(offer.give, offer.giveAmount);
    game.log('The CHOAM exchange returns the offer of ${0}', (b) => b.player(seller));
  }
  data.offers = data.offers.filter((offer) => !expired.includes(offer));
}

export function choamModel(game: IGame, data: ChoamData): ChoamModel {
  return {
    offers: data.offers.map((offer) => ({
      color: game.getPlayerById(offer.seller).color,
      give: offer.give,
      giveAmount: offer.giveAmount,
      want: offer.want,
      wantAmount: offer.wantAmount,
      expires: offer.expires ?? game.generation,
    })),
  };
}
