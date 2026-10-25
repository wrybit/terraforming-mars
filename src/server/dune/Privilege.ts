import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {PlayerId} from '../../common/Types';
import {Random} from '../../common/utils/Random';
import {Resource} from '../../common/Resource';
import {SelectOption} from '../inputs/SelectOption';
import {EXCHANGE_GOODS, ExchangeGood, ExchangePrices, NORMAL_SELL, privilegePay} from '../../common/dune/smugglingExchange';
import {PRIVILEGE_TITLE} from '../../common/dune/duneActionTitles';
import {PrivilegeModel} from '../../common/dune/DuneModel';
import {RESOURCE_LABEL} from './resourceLabels';

// Privilege of the CHOAM module (Jens 24 Oct 2026, _mockups/dune/choam/choam-prototyp.html): every generation the
// emperor asks for one good and pays 1 Solari per unit more than the guild (at least normal + 1; since 25 Oct 2026,
// before 1.5 times the normal worth) – but only to the first who delivers (an action). The pay follows the guild's
// sell rate of its generation, so it is worked out when shown or delivered; `pay` keeps what was paid.
// Whoever took it is shown with what was asked, delivered and paid; nobody took it at the end of the generation: it
// lapses, and the next generation brings a new one.

export type PrivilegeData = {
  generation: number,
  good: ExchangeGood,
  amount: number,
  pay: number,
  takenBy?: PlayerId,
  /** Its line "the emperor seeks …" is in the log (the first privilege of the game gets it in generation 1) */
  announced?: boolean,
};

/**
 * A new privilege: a good chance picks, about 10 Solari of normal worth (2 to 6 units). Without `rng` (games saved
 * before the privilege, on first look) the generation picks it, so showing the game never draws random numbers.
 */
export function newPrivilege(generation: number, rng?: Random): PrivilegeData {
  const index = rng === undefined ? generation % EXCHANGE_GOODS.length : Math.floor(rng.next() * EXCHANGE_GOODS.length);
  const good = EXCHANGE_GOODS[index];
  const amount = Math.max(2, Math.min(6, Math.ceil(10 / NORMAL_SELL[good])));
  return {generation, good, amount, pay: privilegePay(good, amount, NORMAL_SELL[good])};
}

export function canDeliver(player: IPlayer, privilege: PrivilegeData): boolean {
  return privilege.takenBy === undefined && player.stock.get(privilege.good) >= privilege.amount;
}

/** What the privilege pays at the given sell rates of its generation */
export function privilegePayAt(privilege: PrivilegeData, sell: ExchangePrices): number {
  return privilegePay(privilege.good, privilege.amount, sell[privilege.good]);
}

export function deliverInput(player: IPlayer, privilege: PrivilegeData, sell: ExchangePrices, then: () => void): SelectOption | undefined {
  if (!canDeliver(player, privilege)) {
    return undefined;
  }
  return new SelectOption(PRIVILEGE_TITLE, 'Deliver').andThen(() => {
    privilege.pay = privilegePayAt(privilege, sell);
    player.game.log('${0} delivered ${1} ${2} to the emperor for ${3} M€',
      (b) => b.player(player).number(privilege.amount).string(RESOURCE_LABEL[privilege.good]).number(privilege.pay));
    player.stock.deduct(privilege.good, privilege.amount, {log: true});
    player.stock.add(Resource.MEGACREDITS, privilege.pay, {log: true});
    privilege.takenBy = player.id;
    then();
    return undefined;
  });
}

/** End of a generation: a privilege nobody took lapses */
export function lapsePrivilege(game: IGame, privilege: PrivilegeData | undefined): void {
  if (privilege !== undefined && privilege.takenBy === undefined) {
    game.log('Nobody used the privilege of the emperor');
  }
}

/** Start of a generation: the emperor names his new wish (Jens 25 Oct 2026: in the log of the new generation) */
export function renewPrivilege(game: IGame, generation: number, sell: ExchangePrices, previewed?: PrivilegeData): PrivilegeData {
  const next = previewed?.generation === generation ? {...previewed, takenBy: undefined, announced: undefined} : newPrivilege(generation, game.rng);
  announcePrivilege(game, next, sell);
  return next;
}

/** The line of the emperor's wish, once per privilege */
export function announcePrivilege(game: IGame, privilege: PrivilegeData, sell: ExchangePrices): void {
  if (privilege.announced === true) {
    return;
  }
  privilege.announced = true;
  const pay = privilegePayAt(privilege, sell);
  game.log('The emperor seeks ${0} ${1} for ${2} M€', (b) => b.number(privilege.amount).string(RESOURCE_LABEL[privilege.good]).number(pay));
}

/** `sell`: the guild's sell rates of the privilege's generation (the forecast for the next one) */
export function privilegeModel(game: IGame, privilege: PrivilegeData, sell: ExchangePrices): PrivilegeModel {
  return {
    generation: privilege.generation,
    good: privilege.good,
    amount: privilege.amount,
    pay: privilege.takenBy === undefined ? privilegePayAt(privilege, sell) : privilege.pay,
    worth: NORMAL_SELL[privilege.good] * privilege.amount,
    takenBy: privilege.takenBy === undefined ? undefined : game.getPlayerById(privilege.takenBy).color,
  };
}
