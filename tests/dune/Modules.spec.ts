import {expect} from 'chai';
import {testGame} from '../TestGame';
import {TestPlayer} from '../TestPlayer';
import {IGame} from '../../src/server/IGame';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {SelectSpace} from '../../src/server/inputs/SelectSpace';
import {SelectAmount} from '../../src/server/inputs/SelectAmount';
import {SelectTrade} from '../../src/server/inputs/SelectTrade';
import {PlayerInput} from '../../src/server/PlayerInput';
import {BoardName} from '../../src/common/boards/BoardName';
import {Resource} from '../../src/common/Resource';
import {TileType} from '../../src/common/TileType';
import {Phase} from '../../src/common/Phase';
import {DuneExpansion} from '../../src/server/dune/DuneExpansion';
import {battleTargets, garrisonOf, resolveBattle, OPEN_KANLY_COST} from '../../src/server/dune/Kanly';
import {NORMAL_BUY, NORMAL_SELL} from '../../src/common/dune/smugglingExchange';
import {chargeSuspicion, exchangeOf, moveExchange, nextPrivilegeOf, openExchange, privilegeOf, prophecyOf, suspicionOf, suspicionPenalty} from '../../src/server/dune/Smuggling';
import {PRIVILEGE_TITLE, PROPHECY_BUY_TITLE, PROPHECY_SELL_TITLE, SMUGGLE_TITLE} from '../../src/common/dune/duneActionTitles';
import {returnOffers} from '../../src/server/dune/Choam';
import {SCHEMES_TITLE, agendaPoints, reductionStep, schemeValue, schemesVictoryPoints} from '../../src/server/dune/Schemes';
import {SCHEME_AGENDAS, schemeAgenda} from '../../src/common/dune/schemeAgendas';
import {cast} from '../../src/common/utils/utils';
import {SelectPayment} from '../../src/server/inputs/SelectPayment';
import {Payment} from '../../src/common/inputs/Payment';
import {formatMessage} from '../TestingUtils';

function duneActions(player: TestPlayer): OrOptions {
  return cast(DuneExpansion.actions(player), OrOptions);
}

// Actions with their own tab in the action menu (CHOAM offer, moving spice, black market)
function tabActions(player: TestPlayer): OrOptions {
  return new OrOptions(...DuneExpansion.tabActions(player));
}

function titleOf(input: PlayerInput): string {
  return typeof input.title === 'string' ? input.title : formatMessage(input.title);
}

function option(input: OrOptions, prefix: string): PlayerInput {
  const found = input.options.find((candidate) => titleOf(candidate).startsWith(prefix));
  if (found === undefined) {
    throw new Error(`no option ${prefix} in ${input.options.map(titleOf).join(' | ')}`);
  }
  return found;
}

/** The CHOAM tab: guild, prophecy, privilege, pacts and tribute in one choice (Jens 24 Oct 2026) */
function choamTab(player: TestPlayer): OrOptions {
  const tab = tabActions(player).options.find((candidate) => titleOf(candidate) === 'CHOAM');
  if (tab === undefined) {
    throw new Error('no CHOAM tab');
  }
  return cast(tab, OrOptions);
}

const smugglingTab = choamTab;

function smuggleTrade(player: TestPlayer): SelectTrade {
  return cast(option(choamTab(player), SMUGGLE_TITLE), SelectTrade);
}

function pick(input: PlayerInput): void {
  cast(input, SelectOption).cb(undefined);
}

describe('Dune modules B, D, E, F', () => {
  let game: IGame;
  let player1: TestPlayer;
  let player2: TestPlayer;

  beforeEach(() => {
    [game, player1, player2] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['kanly', 'smuggling', 'choam', 'schemes']});
  });

  describe('Kanly (F)', () => {
    it('recruits only through the standard project – no extra prices in goods, also not for the AI', () => {
      player1.megaCredits = 30;
      player1.heat = 20;
      player1.titanium = 20;
      const actions = DuneExpansion.actions(player1);
      const titles = actions instanceof OrOptions ? actions.options.map(titleOf) : [];
      expect(titles).not.includes('Recruit Sardaukar');
    });

    it('lets the majority take the tile over; a tie keeps it with the owner', () => {
      const kanly = game.duneData!.kanly!;
      const space = game.board.getAvailableSpacesForGreenery(player2)[0];
      game.addGreenery(player2, space);
      expect(battleTargets(game, player1)).includes(space);
      expect(battleTargets(game, player2)).not.includes(space);
      kanly.garrison[player1.id] = 3;
      // Opening costs 8 M€: with less there is no such action
      player1.megaCredits = OPEN_KANLY_COST - 1;
      expect(DuneExpansion.actions(player1)).is.undefined;
      player1.megaCredits = OPEN_KANLY_COST;
      const open = cast(option(duneActions(player1), 'Open Kanly'), SelectSpace);
      const amount = cast(open.cb(space), SelectAmount);
      expect(player1.megaCredits).eq(0);
      amount.cb(2);
      expect(kanly.battle?.troops[player1.id]).eq(2);
      // Only one battle per generation
      const afterOpening = DuneExpansion.actions(player1);
      expect(afterOpening === undefined || !cast(afterOpening, OrOptions).options.map(titleOf).some((title) => title.startsWith('Open Kanly'))).is.true;
      // Sending more Sardaukar has its own action tab (Jens, 25 Oct 2026)
      expect(tabActions(player1).options.map(titleOf)).includes('Send Sardaukar to the war field');
      kanly.battle!.troops[player2.id] = 2;
      resolveBattle(game, kanly);
      expect(space.player).eq(player2);

      kanly.battle = {spaceId: space.id, opener: player1.id, troops: {[player1.id]: 3, [player2.id]: 1}};
      resolveBattle(game, kanly);
      expect(space.player).eq(player1);
      // The forces follow the result line, strongest first (Jens, 25 Oct 2026)
      const forces = game.gameLog.filter((entry) => entry.message === '${0} fought with ${1} Sardaukar in the Kanly').slice(-2);
      expect(forces.map((entry) => entry.data[1].value)).deep.eq(['3', '1']);
      expect(kanly.battle).is.undefined;
      expect(kanly.foughtThisGeneration).is.false;
    });

    it('never targets spice fields or the worm domain', () => {
      const ocean = game.board.getAvailableSpacesForOcean(player2)[0];
      game.addOcean(player2, ocean);
      const preserve = game.board.getAvailableSpacesOnLand(player2)[0];
      game.simpleAddTile(player2, preserve, {tileType: TileType.NATURAL_PRESERVE});
      expect(battleTargets(game, player1)).not.includes(ocean);
      expect(battleTargets(game, player1)).not.includes(preserve);
    });
  });

  // The exchange starts at drawn rates; these tests start at the normal ones
  function normalRates(): void {
    const exchange = exchangeOf(game.duneData!.smuggling!);
    exchange.sell = [{...NORMAL_SELL}];
    exchange.buy = [{...NORMAL_BUY}];
  }

  describe('Smuggling (E)', () => {
    beforeEach(normalRates);

    it('moves spice for 5 M€ each and raises the suspicion', () => {
      player1.titanium = 6;
      const move = smuggleTrade(player1);
      // Only whole multiples of the rate: 1 spice for 5 M€, at most 5 spice per deal
      expect(() => move.process({type: 'trade', give: Resource.TITANIUM, giveAmount: 2, get: Resource.MEGACREDITS, getAmount: 5})).to.throw();
      expect(() => move.process({type: 'trade', give: Resource.TITANIUM, giveAmount: 6, get: Resource.MEGACREDITS, getAmount: 30})).to.throw();
      move.process({type: 'trade', give: Resource.TITANIUM, giveAmount: 5, get: Resource.MEGACREDITS, getAmount: 25});
      expect(player1.titanium).eq(1);
      expect(player1.megaCredits).eq(25);
      expect(suspicionOf(game.duneData!.smuggling!, player1)).eq(1);
    });

    it('trades 2 for 1 on the black market', () => {
      player1.heat = 9;
      const market = smuggleTrade(player1);
      expect(() => market.process({type: 'trade', give: Resource.HEAT, giveAmount: 10, get: Resource.PLANTS, getAmount: 5})).to.throw();
      expect(() => market.process({type: 'trade', give: Resource.HEAT, giveAmount: 8, get: Resource.HEAT, getAmount: 4})).to.throw();
      market.process({type: 'trade', give: Resource.HEAT, giveAmount: 8, get: Resource.PLANTS, getAmount: 4});
      expect([player1.heat, player1.plants]).deep.eq([1, 4]);
    });

    it('prices the black market by worth: 6 M€ for 1 spice, never 2', () => {
      player1.megaCredits = 13;
      const market = smuggleTrade(player1);
      expect(() => market.process({type: 'trade', give: Resource.MEGACREDITS, giveAmount: 2, get: Resource.TITANIUM, getAmount: 1})).to.throw();
      market.process({type: 'trade', give: Resource.MEGACREDITS, giveAmount: 12, get: Resource.TITANIUM, getAmount: 2});
      expect([player1.megaCredits, player1.titanium]).deep.eq([1, 2]);
    });

    it('blocks trading there and back in one generation: what was sold cannot be bought, what was bought cannot be sold', () => {
      player1.heat = 5;
      player1.megaCredits = 0;
      smuggleTrade(player1).process({type: 'trade', give: Resource.HEAT, giveAmount: 3, get: Resource.MEGACREDITS, getAmount: 3});
      const second = smuggleTrade(player1);
      expect(second.get).not.includes(Resource.HEAT);
      expect(second.give.map((option) => option.resource)).includes(Resource.HEAT);
      second.process({type: 'trade', give: Resource.MEGACREDITS, giveAmount: 2, get: Resource.PLANTS, getAmount: 1});
      expect(smuggleTrade(player1).give.map((option) => option.resource)).not.includes(Resource.PLANTS);
      // A new generation starts afresh
      (game as any).generation = game.generation + 1;
      expect(smuggleTrade(player1).get).includes(Resource.HEAT);
    });

    it('trades at the rates of the current generation: what the given one brings, what the received one costs', () => {
      const exchange = exchangeOf(game.duneData!.smuggling!);
      exchange.sell.push({...exchange.sell[0], heat: 2});
      exchange.buy.push({...exchange.buy[0], plants: 2});
      player1.heat = 3;
      const market = smuggleTrade(player1);
      expect(() => market.process({type: 'trade', give: Resource.HEAT, giveAmount: 2, get: Resource.PLANTS, getAmount: 1})).to.throw();
      market.process({type: 'trade', give: Resource.HEAT, giveAmount: 3, get: Resource.PLANTS, getAmount: 3});
      expect([player1.heat, player1.plants]).deep.eq([0, 3]);
    });

    it('sets new rates at the end of a generation and keeps every generation for the graph', () => {
      const smuggling = game.duneData!.smuggling!;
      moveExchange(game, smuggling);
      moveExchange(game, smuggling);
      expect(exchangeOf(smuggling).sell).has.length(3);
      expect(exchangeOf(smuggling).buy).has.length(3);
    });

    it('moves the exchange once at the start of a new generation, not again after a reload', () => {
      const smuggling = game.duneData!.smuggling!;
      const wishes = () => game.gameLog.filter((entry) => entry.message.startsWith('The emperor seeks')).length;
      // Generation 1: no new rates, but the emperor's first wish, once
      openExchange(game, smuggling);
      openExchange(game, smuggling);
      expect(exchangeOf(smuggling).sell).has.length(1);
      expect(wishes()).eq(1);
      game.generation++;
      openExchange(game, smuggling);
      openExchange(game, smuggling);
      expect(exchangeOf(smuggling).sell).has.length(2);
      expect(privilegeOf(game, smuggling).generation).eq(game.generation);
      expect(wishes()).eq(2);
    });

    it('shows the privilege of the next generation ahead, and that one comes true', () => {
      const smuggling = game.duneData!.smuggling!;
      const next = nextPrivilegeOf(game, smuggling);
      expect(next.generation).eq(game.generation + 1);
      game.generation++;
      openExchange(game, smuggling);
      expect(privilegeOf(game, smuggling)).deep.include({good: next.good, amount: next.amount, pay: next.pay, generation: game.generation});
      expect(nextPrivilegeOf(game, smuggling).generation).eq(game.generation + 1);
    });

    it('always offers spice, even without any, but refuses to give it', () => {
      player1.megaCredits = 13;
      player1.titanium = 0;
      const market = smuggleTrade(player1);
      expect(market.give.find((give) => give.resource === Resource.TITANIUM)?.max).eq(0);
      expect(() => market.process({type: 'trade', give: Resource.TITANIUM, giveAmount: 1, get: Resource.MEGACREDITS, getAmount: 5})).to.throw();
    });

    it('costs TR from envy 3 at the end of the generation and resets the marker; 2 stays', () => {
      expect([0, 1, 2, 3, 4, 5].map(suspicionPenalty)).deep.eq([0, 0, 0, 1, 2, 3]);
      const smuggling = game.duneData!.smuggling!;
      smuggling.suspicion[player1.id] = 4;
      smuggling.suspicion[player2.id] = 2;
      const tr = [player1.terraformRating, player2.terraformRating];
      chargeSuspicion(game, smuggling);
      expect([player1.terraformRating, player2.terraformRating]).deep.eq([tr[0] - 2, tr[1]]);
      expect([suspicionOf(smuggling, player1), suspicionOf(smuggling, player2)]).deep.eq([0, 2]);
    });

    it('lowers the suspicion by a bribe paid in the smuggling tab', () => {
      const smuggling = game.duneData!.smuggling!;
      smuggling.suspicion[player1.id] = 3;
      player1.megaCredits = 10;
      const bribe = cast(option(smugglingTab(player1), 'Tribute to the great houses'), SelectPayment);
      expect(bribe.amount).eq(10);
      bribe.process({type: 'payment', payment: Payment.of({megacredits: 10})}, player1);
      expect(suspicionOf(smuggling, player1)).eq(2);
      expect(player1.megaCredits).eq(0);
      // Not in the Dune group of the action menu any more
      expect(DuneExpansion.actions(player1)).is.undefined;
    });

    it('offers one tribute per number of steps the player can pay for (Jens 25 Oct 2026)', () => {
      const smuggling = game.duneData!.smuggling!;
      smuggling.suspicion[player1.id] = 5;
      player1.megaCredits = 25;
      const tributes = smugglingTab(player1).options.filter((input) => titleOf(input).startsWith('Tribute to the great houses'));
      expect(tributes.map((input) => cast(input, SelectPayment).amount)).deep.eq([10, 20]);
      cast(tributes[1], SelectPayment).process({type: 'payment', payment: Payment.of({megacredits: 20})}, player1);
      expect(suspicionOf(smuggling, player1)).eq(3);
      expect(player1.megaCredits).eq(5);
    });

    it('offers only the tribute at envy 5, the top of the track', () => {
      game.duneData!.smuggling!.suspicion[player1.id] = 5;
      player1.titanium = 5;
      player1.megaCredits = 10;
      expect(smugglingTab(player1).options.map((input) => input.type)).deep.eq(['payment']);
    });

    it('caps a level above the track at the top and lowers it to 4 with a tribute', () => {
      const smuggling = game.duneData!.smuggling!;
      smuggling.suspicion[player1.id] = 6;
      player1.megaCredits = 10;
      expect(suspicionOf(smuggling, player1)).eq(5);
      const bribe = cast(option(smugglingTab(player1), 'Tribute to the great houses'), SelectPayment);
      bribe.process({type: 'payment', payment: Payment.of({megacredits: 10})}, player1);
      expect(suspicionOf(smuggling, player1)).eq(4);
    });

    it('has no CHOAM tab without anything to do', () => {
      game.duneData!.smuggling!.suspicion[player1.id] = 5;
      player1.megaCredits = 0;
      expect(DuneExpansion.tabActions(player1).map(titleOf).some((title) => title === 'CHOAM')).is.false;
    });
  });

  describe('CHOAM contracts (D)', () => {
    it('offers, accepts with a fee of 1 M€ each, returns what nobody took', () => {
      const choam = game.duneData!.choam!;
      player1.heat = 5;
      player1.megaCredits = 3;
      const offer = cast(option(choamTab(player1), 'CHOAM: make an offer'), SelectTrade);
      // At most the whole stock, at most 30 in return
      expect(() => offer.process({type: 'trade', give: Resource.HEAT, giveAmount: 6, get: Resource.TITANIUM, getAmount: 2})).to.throw();
      expect(() => offer.process({type: 'trade', give: Resource.HEAT, giveAmount: 3, get: Resource.TITANIUM, getAmount: 31})).to.throw();
      expect(offer.give.find((option) => option.resource === Resource.HEAT)?.max).eq(5);
      expect(offer.maxGet).eq(30);
      offer.process({type: 'trade', give: Resource.HEAT, giveAmount: 3, get: Resource.TITANIUM, getAmount: 2});
      expect(player1.heat).eq(2);
      expect(choam.offers).deep.eq([{seller: player1.id, give: Resource.HEAT, giveAmount: 3, want: Resource.TITANIUM, wantAmount: 2,
        expires: game.generation + 1}]);

      player2.titanium = 2;
      player2.megaCredits = 1;
      // The other player accepts in the same tab; the offerer may withdraw instead
      const pacts = choamTab(player1).options.map(titleOf).filter((title) => title.startsWith('CHOAM: withdraw offer') || title.startsWith('CHOAM: accept'));
      expect(pacts).deep.eq(['CHOAM: withdraw offer 0']);
      // Making and accepting an offer raise the envy like every CHOAM move
      expect(suspicionOf(game.duneData!.smuggling!, player1)).eq(1);
      cast(option(choamTab(player2), 'CHOAM: accept offer 0'), SelectOption).cb(undefined);
      expect([player2.heat, player2.titanium, player2.megaCredits]).deep.eq([3, 0, 0]);
      expect([player1.titanium, player1.megaCredits]).deep.eq([2, 2]);
      expect(suspicionOf(game.duneData!.smuggling!, player2)).eq(1);

      // An offer stands for 2 generations: still there at the end of the first, back at the end of the second
      choam.offers.push({seller: player1.id, give: Resource.STEEL, giveAmount: 2, want: Resource.PLANTS, wantAmount: 1,
        expires: game.generation + 1});
      returnOffers(game, choam);
      expect(choam.offers).has.length(1);
      game.generation++;
      returnOffers(game, choam);
      expect(player1.steel).eq(2);
      expect(choam.offers).deep.eq([]);
    });

    it('withdraws an own offer without a fee', () => {
      const choam = game.duneData!.choam!;
      player1.steel = 4;
      player1.megaCredits = 2;
      cast(option(choamTab(player1), 'CHOAM: make an offer'), SelectTrade)
        .process({type: 'trade', give: Resource.STEEL, giveAmount: 4, get: Resource.PLANTS, getAmount: 3});
      cast(option(choamTab(player1), 'CHOAM: withdraw offer 0'), SelectOption).cb(undefined);
      expect([player1.steel, player1.megaCredits]).deep.eq([4, 2]);
      expect(choam.offers).deep.eq([]);
    });
  });

  describe('CHOAM: one module (Jens 24 Oct 2026)', () => {
    beforeEach(normalRates);

    it('switches on both halves with the former smuggling id alone', () => {
      const [other] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['smuggling']});
      expect(other.duneData?.smuggling).is.not.undefined;
      expect(other.duneData?.choam).is.not.undefined;
      expect(other.duneData?.smuggling?.exchange?.next).is.not.undefined;
    });

    it('closes every move but the tribute at envy 5', () => {
      const smuggling = game.duneData!.smuggling!;
      smuggling.suspicion[player1.id] = 5;
      player1.titanium = 6;
      player1.megaCredits = 20;
      // Only tributes: one step for 10, two for 20
      expect(choamTab(player1).options.map((input) => input.type)).deep.eq(['payment', 'payment']);
    });

    it('delivers the privilege once: 1 Solari per unit over the guild, at least normal + 1, envy +1, then nobody else', () => {
      const smuggling = game.duneData!.smuggling!;
      const privilege = privilegeOf(game, smuggling);
      privilege.good = Resource.TITANIUM;
      privilege.amount = 2;
      player1.titanium = 2;
      player2.titanium = 2;
      // The guild pays 7 for spice this generation (normal 5): the emperor 8 per unit
      const sell = exchangeOf(smuggling).sell;
      sell[sell.length - 1] = {...sell[sell.length - 1], titanium: 7};
      cast(option(choamTab(player1), PRIVILEGE_TITLE), SelectOption).cb(undefined);
      expect([player1.titanium, player1.megaCredits]).deep.eq([0, 16]);
      expect(privilege.pay).eq(16);
      expect(privilege.takenBy).eq(player1.id);
      expect(suspicionOf(smuggling, player1)).eq(1);
      expect(choamTab(player2).options.map(titleOf)).not.includes(PRIVILEGE_TITLE);
      // A new one comes with the next generation
      moveExchange(game, smuggling, game.generation + 1);
      expect(smuggling.privilege?.takenBy).is.undefined;
      expect(smuggling.privilege?.generation).eq(game.generation + 1);
    });

    it('places a sell prophecy on a named rate and pays exactly its column once the rate is reached', () => {
      const smuggling = game.duneData!.smuggling!;
      player1.titanium = 9;
      const sell = cast(option(choamTab(player1), PROPHECY_SELL_TITLE), SelectTrade);
      // 1 unit is too few, the normal rate 5 cannot be named
      expect(() => sell.process({type: 'trade', give: Resource.TITANIUM, giveAmount: 1, get: Resource.MEGACREDITS, getAmount: 7})).to.throw();
      expect(() => sell.process({type: 'trade', give: Resource.TITANIUM, giveAmount: 5, get: Resource.MEGACREDITS, getAmount: 5})).to.throw();
      sell.process({type: 'trade', give: Resource.TITANIUM, giveAmount: 5, get: Resource.MEGACREDITS, getAmount: 7});
      expect(player1.titanium).eq(4);
      expect(suspicionOf(smuggling, player1)).eq(1);
      expect(prophecyOf(smuggling).orders[0].limit).eq(7);
      const exchange = exchangeOf(smuggling);
      player1.megaCredits = 0;
      // Spice only reaches 6: nothing yet
      exchange.next = {sell: {...exchange.sell[0], titanium: 6}, buy: {...exchange.buy[0], titanium: 8}};
      moveExchange(game, smuggling);
      expect(player1.megaCredits).eq(0);
      expect(prophecyOf(smuggling).orders).has.length(1);
      // Spice reaches 8: exactly the column of 7, 5 × 7 = 35 plus the premium 5 × 2 = 10
      exchange.next = {sell: {...exchange.sell[0], titanium: 8}, buy: {...exchange.buy[0], titanium: 8}};
      moveExchange(game, smuggling);
      expect(player1.megaCredits).eq(45);
      expect(prophecyOf(smuggling).orders).deep.eq([]);
    });

    it('places a buy prophecy with a budget on a named rate and brings exactly its column, rounded up', () => {
      const smuggling = game.duneData!.smuggling!;
      player1.megaCredits = 40;
      // 5 spice at the normal 6: a budget of 30 Solari, named rate 4
      cast(option(choamTab(player1), PROPHECY_BUY_TITLE), SelectTrade)
        .process({type: 'trade', give: Resource.MEGACREDITS, giveAmount: 4, get: Resource.TITANIUM, getAmount: 5});
      expect(player1.megaCredits).eq(10);
      expect(prophecyOf(smuggling).orders[0].budget).eq(30);
      // Spice falls to 3: the column of 4, 30 ÷ 4 = 7.5 → 8, premium 5 × 2 = 10 Solari ÷ 4 = 2.5 → 3
      player1.titanium = 0;
      const exchange = exchangeOf(smuggling);
      exchange.next = {sell: {...exchange.sell[0], titanium: 3}, buy: {...exchange.buy[0], titanium: 3}};
      moveExchange(game, smuggling);
      expect([player1.titanium, player1.megaCredits]).deep.eq([11, 10]);

      // Withdrawing gives back half of the budget
      cast(option(choamTab(player1), PROPHECY_BUY_TITLE), SelectTrade)
        .process({type: 'trade', give: Resource.MEGACREDITS, giveAmount: 1, get: Resource.PLANTS, getAmount: 4});
      expect(player1.megaCredits).eq(2);
      const id = prophecyOf(smuggling).orders[0].id;
      cast(option(choamTab(player1), 'CHOAM: withdraw prophecy ' + id), SelectOption).cb(undefined);
      expect(player1.megaCredits).eq(2 + 4);
    });
  });

  describe('House schemes (B)', () => {
    it('deals 2 different agendas to each player', () => {
      const schemes = game.duneData!.schemes!;
      const all = [...schemes.agendas[player1.id], ...schemes.agendas[player2.id]];
      expect(all).has.length(4);
      expect(new Set(all).size).eq(4);
      expect(SCHEME_AGENDAS).has.length(24);
    });

    it('scores the highest level reached of the better agenda', () => {
      const schemes = game.duneData!.schemes!;
      schemes.agendas[player1.id] = ['Imperial Favour', 'Treasurer'];
      player1.setTerraformRating(57);
      expect(schemeValue(player1, schemeAgenda('Imperial Favour').measure)).eq(57);
      expect(agendaPoints(player1, 'Imperial Favour')).eq(5);
      player1.production.override({megacredits: 50});
      expect(schemesVictoryPoints(player1, schemes)).eq(8);
    });

    it('shows the agenda points in an own column, naming the agenda only at game end', () => {
      const schemes = game.duneData!.schemes!;
      schemes.agendas[player1.id] = ['Imperial Favour', 'Treasurer'];
      player1.setTerraformRating(57);
      const running = player1.getVictoryPoints();
      expect(running.schemes).eq(5);
      expect(running.detailsSchemes).deep.eq([]);
      expect(running.detailsCards.map((card) => card.cardName)).not.include('House schemes');
      expect(running.total).eq(57 + 5);

      game.phase = Phase.END;
      expect(player1.getVictoryPoints().detailsSchemes).deep.eq([{agenda: 'Imperial Favour', level: 2, victoryPoint: 5}]);
    });

    it('makes everybody keep one agenda once a player reaches 35 TR', () => {
      const schemes = game.duneData!.schemes!;
      let done = false;
      reductionStep(game, schemes, () => done = true);
      expect(done).is.true;
      expect(schemes.reduced).is.false;

      done = false;
      player2.setTerraformRating(35);
      reductionStep(game, schemes, () => done = true);
      for (const player of game.playersInGenerationOrder as ReadonlyArray<TestPlayer>) {
        const [waitingFor, cb] = player.popWaitingFor2();
        const input = cast(waitingFor, OrOptions);
        expect(input.title).eq(SCHEMES_TITLE);
        const kept = schemes.agendas[player.id][1];
        input.process({type: 'or', index: 1, response: {type: 'option'}}, player);
        cb?.();
        expect(schemes.agendas[player.id]).deep.eq([kept]);
      }
      expect(done).is.true;
      expect(schemes.reduced).is.true;
    });
  });
});
