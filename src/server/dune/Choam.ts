import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {PlayerId} from '../../common/Types';
import {ALL_RESOURCES, Resource} from '../../common/Resource';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {SelectAmount} from '../inputs/SelectAmount';
import {PlayerInput} from '../PlayerInput';
import {message} from '../logs/MessageBuilder';
import {ChoamModel} from '../../common/dune/DuneModel';
import {RESOURCE_LABEL} from './resourceLabels';
import {CardName} from '../../common/cards/CardName';

// Module D – CHOAM contracts (claude/dune-erweiterung-konzept.md): open trade between players, every step a normal action.
// 1. Offer: the offered goods leave the tableau and lie on the own place of the CHOAM exchange, together with the
//    wish (kind and amount 1–10). At most 1 open offer per player.
// 2. Accept: another player takes the offer in their own turn – whoever comes first gets the deal.
// 3. Only then both pay 1 M€ to the bank.
// 4. Nobody accepts: the goods go back to the offerer at the end of the generation, without a fee.

export type ChoamOffer = {
  seller: PlayerId,
  give: Resource,
  giveAmount: number,
  want: Resource,
  wantAmount: number,
};

export type ChoamData = {
  /** Open offers in the order they were made */
  offers: Array<ChoamOffer>,
};

export const CHOAM_FEE = 1;
export const MAX_CHOAM_AMOUNT = 10;

export function initializeChoam(): ChoamData {
  return {offers: []};
}

/** At most 1 open offer per player, 2 with the Guild Bank card */
export function maxOffers(player: IPlayer): number {
  return player.tableau.has(CardName.GUILD_BANK) ? 2 : 1;
}

function offerInput(player: IPlayer, data: ChoamData): OrOptions | undefined {
  if (data.offers.filter((offer) => offer.seller === player.id).length >= maxOffers(player)) {
    return undefined;
  }
  const giveOptions = ALL_RESOURCES.filter((give) => player.stock.get(give) >= 1).map((give) => {
    const most = Math.min(MAX_CHOAM_AMOUNT, player.stock.get(give));
    const wantOptions = ALL_RESOURCES.filter((want) => want !== give).map((want) =>
      new SelectAmount(message('Want ${0}: how many?', (b) => b.string(RESOURCE_LABEL[want])), 'Next', 1, MAX_CHOAM_AMOUNT, false)
        .andThen((wantAmount) => new SelectAmount(message('Offer ${0}: how many?', (b) => b.string(RESOURCE_LABEL[give])), 'Offer', 1, most, false)
          .andThen((giveAmount) => {
            player.stock.deduct(give, giveAmount, {log: true});
            data.offers.push({seller: player.id, give, giveAmount, want, wantAmount});
            player.game.log('${0} offers ${1} ${2} for ${3} ${4} at the CHOAM exchange', (b) => b.player(player)
              .number(giveAmount).string(RESOURCE_LABEL[give]).number(wantAmount).string(RESOURCE_LABEL[want]));
            return undefined;
          })));
    return new OrOptions(...wantOptions).setTitle(message('Offer ${0}, wish:', (b) => b.string(RESOURCE_LABEL[give])));
  });
  return giveOptions.length === 0 ? undefined : new OrOptions(...giveOptions).setTitle('CHOAM: make an offer');
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
  game.log('${0} accepted the CHOAM contract of ${1}', (b) => b.player(buyer).player(seller));
  // CHOAM Directorate: 1 M€ for every contract other players close
  for (const player of game.players) {
    if (player !== buyer && player !== seller && player.tableau.has(CardName.CHOAM_DIRECTORATE)) {
      player.stock.add(Resource.MEGACREDITS, 1, {log: true});
    }
  }
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

/** CHOAM actions of the action menu; the AI only accepts offers (each one valued on a game copy) */
export function choamActions(player: IPlayer, data: ChoamData): Array<PlayerInput> {
  const accepts = acceptInputs(player, data);
  const actions: Array<PlayerInput | undefined> = [
    accepts.length === 0 ? undefined : new OrOptions(...accepts).setTitle('CHOAM: accept a contract'),
    player.aiLevel === undefined ? offerInput(player, data) : undefined,
  ];
  return actions.filter((input): input is PlayerInput => input !== undefined);
}

/** End of generation: offers nobody accepted go back, without a fee */
export function returnOffers(game: IGame, data: ChoamData): void {
  for (const offer of data.offers) {
    const seller = game.getPlayerById(offer.seller);
    seller.stock.add(offer.give, offer.giveAmount);
    game.log('The CHOAM exchange returns the offer of ${0}', (b) => b.player(seller));
  }
  data.offers = [];
}

export function choamModel(game: IGame, data: ChoamData): ChoamModel {
  return {
    offers: data.offers.map((offer) => ({
      color: game.getPlayerById(offer.seller).color,
      give: offer.give,
      giveAmount: offer.giveAmount,
      want: offer.want,
      wantAmount: offer.wantAmount,
    })),
  };
}
