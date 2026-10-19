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
import {DuneExpansion} from '../../src/server/dune/DuneExpansion';
import {battleTargets, garrisonOf, resolveBattle} from '../../src/server/dune/Kanly';
import {chargeSuspicion, suspicionOf, suspicionPenalty} from '../../src/server/dune/Smuggling';
import {acceptOffer, returnOffers} from '../../src/server/dune/Choam';
import {SCHEMES_TITLE, agendaPoints, reductionStep, schemeValue, schemesVictoryPoints} from '../../src/server/dune/Schemes';
import {SCHEME_AGENDAS, schemeAgenda} from '../../src/common/dune/schemeAgendas';
import {cast} from '../../src/common/utils/utils';
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

function pick(input: PlayerInput): void {
  cast(input, SelectOption).cb(undefined);
}

describe('Dune modules B, D, E, F', () => {
  let game: IGame;
  let player1: TestPlayer;
  let player2: TestPlayer;

  beforeEach(() => {
    [game, player1, player2] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS, duneModules: ['kanly', 'smuggling', 'choam', 'schemes']});
  });

  describe('Kanly (F)', () => {
    it('recruits Sardaukar with one kind of payment, at most 2 per action', () => {
      player1.megaCredits = 30;
      const recruit = cast(option(duneActions(player1), 'Recruit Sardaukar'), OrOptions);
      expect(recruit.options.map(titleOf)).deep.eq(['1 Sardaukar for 12 M€', '2 Sardaukar for 24 M€']);
      pick(recruit.options[1]);
      expect(player1.megaCredits).eq(6);
      expect(garrisonOf(game.duneData!.kanly!, player1)).eq(2);
    });

    it('lets the majority take the tile over; a tie keeps it with the owner', () => {
      const kanly = game.duneData!.kanly!;
      const space = game.board.getAvailableSpacesForGreenery(player2)[0];
      game.addGreenery(player2, space);
      expect(battleTargets(game, player1)).includes(space);
      expect(battleTargets(game, player2)).not.includes(space);
      kanly.garrison[player1.id] = 3;
      const open = cast(option(duneActions(player1), 'Open Kanly'), SelectSpace);
      const amount = cast(open.cb(space), SelectAmount);
      amount.cb(2);
      expect(kanly.battle?.troops[player1.id]).eq(2);
      // Only one battle per generation
      expect(duneActions(player1).options.map(titleOf).some((title) => title.startsWith('Open Kanly'))).is.false;
      kanly.battle!.troops[player2.id] = 2;
      resolveBattle(game, kanly);
      expect(space.player).eq(player2);

      kanly.battle = {spaceId: space.id, opener: player1.id, troops: {[player1.id]: 3, [player2.id]: 1}};
      resolveBattle(game, kanly);
      expect(space.player).eq(player1);
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

  describe('Smuggling (E)', () => {
    it('moves spice for 5 M€ each and raises the suspicion', () => {
      player1.titanium = 6;
      const move = cast(option(tabActions(player1), 'Smuggling'), SelectTrade);
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
      const market = cast(option(tabActions(player1), 'Smuggling'), SelectTrade);
      expect(() => market.process({type: 'trade', give: Resource.HEAT, giveAmount: 10, get: Resource.PLANTS, getAmount: 5})).to.throw();
      expect(() => market.process({type: 'trade', give: Resource.HEAT, giveAmount: 8, get: Resource.HEAT, getAmount: 4})).to.throw();
      market.process({type: 'trade', give: Resource.HEAT, giveAmount: 8, get: Resource.PLANTS, getAmount: 4});
      expect([player1.heat, player1.plants]).deep.eq([1, 4]);
    });

    it('prices the black market by worth: 6 M€ for 1 spice, never 2', () => {
      player1.megaCredits = 13;
      const market = cast(option(tabActions(player1), 'Smuggling'), SelectTrade);
      expect(() => market.process({type: 'trade', give: Resource.MEGACREDITS, giveAmount: 2, get: Resource.TITANIUM, getAmount: 1})).to.throw();
      market.process({type: 'trade', give: Resource.MEGACREDITS, giveAmount: 12, get: Resource.TITANIUM, getAmount: 2});
      expect([player1.megaCredits, player1.titanium]).deep.eq([1, 2]);
    });

    it('costs TR from suspicion 3 at the end of the generation; bribing lowers it', () => {
      expect([0, 1, 2, 3, 4, 5].map(suspicionPenalty)).deep.eq([0, 0, 0, 1, 2, 3]);
      const smuggling = game.duneData!.smuggling!;
      smuggling.suspicion[player1.id] = 4;
      const tr = player1.terraformRating;
      chargeSuspicion(game, smuggling);
      expect(player1.terraformRating).eq(tr - 2);
      player1.megaCredits = 10;
      pick(option(duneActions(player1), 'Bribe the officials'));
      expect(suspicionOf(smuggling, player1)).eq(3);
      expect(player1.megaCredits).eq(0);
    });

    it('blocks smuggling at suspicion 5', () => {
      game.duneData!.smuggling!.suspicion[player1.id] = 5;
      player1.titanium = 5;
      player1.megaCredits = 0;
      expect(DuneExpansion.tabActions(player1).map(titleOf).some((title) => title.startsWith('Smuggling'))).is.false;
    });
  });

  describe('CHOAM contracts (D)', () => {
    it('offers, accepts with a fee of 1 M€ each, returns what nobody took', () => {
      const choam = game.duneData!.choam!;
      player1.heat = 5;
      player1.megaCredits = 3;
      const offer = cast(option(tabActions(player1), 'CHOAM: make an offer'), SelectTrade);
      // At most the whole stock, at most 30 in return
      expect(() => offer.process({type: 'trade', give: Resource.HEAT, giveAmount: 6, get: Resource.TITANIUM, getAmount: 2})).to.throw();
      expect(() => offer.process({type: 'trade', give: Resource.HEAT, giveAmount: 3, get: Resource.TITANIUM, getAmount: 31})).to.throw();
      expect(offer.give.find((option) => option.resource === Resource.HEAT)?.max).eq(5);
      expect(offer.maxGet).eq(30);
      offer.process({type: 'trade', give: Resource.HEAT, giveAmount: 3, get: Resource.TITANIUM, getAmount: 2});
      expect(player1.heat).eq(2);
      expect(choam.offers).deep.eq([{seller: player1.id, give: Resource.HEAT, giveAmount: 3, want: Resource.TITANIUM, wantAmount: 2}]);

      player2.titanium = 2;
      player2.megaCredits = 1;
      acceptOffer(game, choam, player2, choam.offers[0]);
      expect([player2.heat, player2.titanium, player2.megaCredits]).deep.eq([3, 0, 0]);
      expect([player1.titanium, player1.megaCredits]).deep.eq([2, 2]);

      choam.offers.push({seller: player1.id, give: Resource.STEEL, giveAmount: 2, want: Resource.PLANTS, wantAmount: 1});
      returnOffers(game, choam);
      expect(player1.steel).eq(2);
      expect(choam.offers).deep.eq([]);
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
