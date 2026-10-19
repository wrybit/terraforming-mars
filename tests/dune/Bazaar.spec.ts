import {expect} from 'chai';
import {testGame} from '../TestGame';
import {TestPlayer} from '../TestPlayer';
import {IGame} from '../../src/server/IGame';
import {Game} from '../../src/server/Game';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {Phase} from '../../src/common/Phase';
import {TileType} from '../../src/common/TileType';
import {BoardName} from '../../src/common/boards/BoardName';
import {BAZAAR_TITLE, BazaarData, buyWare, slideAndRefill} from '../../src/server/dune/Bazaar';
import {SelectPayment} from '../../src/server/inputs/SelectPayment';
import {Payment} from '../../src/common/inputs/Payment';
import {DuneExpansion} from '../../src/server/dune/DuneExpansion';
import {BAZAAR_WARES, bazaarBasePrice, bazaarPrice, bazaarWare, bazaarWareCount} from '../../src/common/dune/bazaarWares';
import {cast} from '../../src/common/utils/utils';
import {doWait} from '../TestingUtils';

function bazaarOf(game: IGame): BazaarData {
  const bazaar = game.duneData?.bazaar;
  if (bazaar === undefined) {
    throw new Error('no bazaar');
  }
  return bazaar;
}

/** The bazaar purchases among the action tabs of the action menu: one payment per affordable ware */
function bazaarActions(player: TestPlayer): Array<SelectPayment> {
  return DuneExpansion.tabActions(player).filter((option): option is SelectPayment => option instanceof SelectPayment);
}

describe('Bazaar of Arrakeen (Dune module A)', () => {
  let game: IGame;
  let player1: TestPlayer;
  let player2: TestPlayer;
  let player3: TestPlayer;

  beforeEach(() => {
    [game, player1, player2, player3] = testGame(3, {theme: 'dune', boardName: BoardName.ARRAKIS, duneModules: ['bazaar']});
    for (const player of [player1, player2, player3]) {
      player.megaCredits = 100;
    }
  });

  it('has 32 wares, each at least 20 M€ and never below 0 in any slot', () => {
    expect(BAZAAR_WARES).has.length(32);
    for (const ware of BAZAAR_WARES) {
      expect(bazaarBasePrice(ware), ware.name).gte(20);
      expect(bazaarPrice(ware, 4, true)).gte(0);
    }
    expect(new Set(BAZAAR_WARES.map((ware) => ware.name)).size).eq(32);
  });

  it('lays out one ware fewer than players, between 1 and 5', () => {
    expect(bazaarWareCount(1)).eq(1);
    expect(bazaarWareCount(3)).eq(2);
    expect(bazaarWareCount(8)).eq(5);
  });

  it('is not part of a game without the module', () => {
    const [plain] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS});
    expect(plain.duneData).is.undefined;
  });

  it('slides the wares right and refills from the left', () => {
    const bazaar = bazaarOf(game);
    expect(bazaar.deck).has.length(32);
    slideAndRefill(bazaar, 3, game.rng);
    expect(bazaar.slots.slice(0, 2).every((ware) => ware !== null)).is.true;
    const [first, second] = bazaar.slots;
    // Nobody bought: the same two wares, one slot further right and cheaper, and still one new ware on the left
    slideAndRefill(bazaar, 3, game.rng);
    const third = bazaar.slots[0];
    expect(third).is.not.null;
    expect(bazaar.slots.slice(1)).deep.eq([first, second, null, null]);
    // One bought: again one new ware on the left
    bazaar.slots[1] = null;
    slideAndRefill(bazaar, 3, game.rng);
    expect(bazaar.slots[0]).is.not.null;
    expect(bazaar.slots[3]).eq(second);
  });

  it('lays out a new ware every generation, even when a ware is left unsold', () => {
    const bazaar = bazaarOf(game);
    slideAndRefill(bazaar, 2, game.rng);
    expect(bazaar.slots.filter((ware) => ware !== null)).has.length(1);
    slideAndRefill(bazaar, 2, game.rng);
    expect(bazaar.slots.filter((ware) => ware !== null)).has.length(2);
    expect(bazaar.slots[0]).is.not.null;
  });

  it('discards the ware pushed out on the right', () => {
    const bazaar = bazaarOf(game);
    bazaar.slots = [null, null, null, null, 'Seed Bales'];
    slideAndRefill(bazaar, 3, game.rng);
    expect(bazaar.discard).deep.eq(['Seed Bales']);
  });

  it('makes the bazaar tile owner pay less', () => {
    const bazaar = bazaarOf(game);
    bazaar.slots = ['Bene Gesserit Dossier', null, null, null, null];
    const space = game.board.getAvailableSpacesOnLand(player1)[0];
    game.simpleAddTile(player1, space, {tileType: TileType.COMMERCIAL_DISTRICT});
    buyWare(player1, bazaar, 0);
    expect(player1.megaCredits).eq(100 - bazaarPrice(bazaarWare('Bene Gesserit Dossier'), 0, true));
  });

  it('pays out a ware at once', () => {
    const bazaar = bazaarOf(game);
    bazaar.slots = ['Bene Gesserit Dossier', 'Cistern of Tabr', null, null, 'Water Rings'];
    const tr = player1.terraformRating;
    const cards = player1.cardsInHand.length;
    buyWare(player1, bazaar, 0);
    expect(player1.megaCredits).eq(100 - bazaarPrice(bazaarWare('Bene Gesserit Dossier'), 0));
    expect(player1.terraformRating).eq(tr + 2);
    expect(player1.cardsInHand).has.length(cards + 4);
    buyWare(player1, bazaar, 4);
    expect(player1.heat).eq(24);
    expect(bazaar.slots).deep.eq([null, 'Cistern of Tabr', null, null, null]);
    expect(bazaar.discard).deep.eq(['Bene Gesserit Dossier', 'Water Rings']);
  });

  it('lays out new wares after research and goes straight to the action phase', () => {
    for (const player of [player1, player2, player3]) {
      game.playerIsFinishedWithResearchPhase(player);
    }
    const bazaar = bazaarOf(game);
    expect(bazaar.slots.filter((ware) => ware !== null)).has.length(2);
    expect(bazaar.buyers).is.empty;
    expect(game.phase).eq(Phase.ACTION);
    expect(game.activePlayer).eq(game.first);
  });

  it('offers buying a ware as an action, once per generation', () => {
    const bazaar = bazaarOf(game);
    bazaar.slots = ['Bene Gesserit Dossier', 'Cistern of Tabr', null, null, null];
    const actions = bazaarActions(player1);
    expect(actions).has.length(2);
    const price = bazaarPrice(bazaarWare('Cistern of Tabr'), 1);
    expect(actions[1].amount).eq(price);
    actions[1].process({type: 'payment', payment: Payment.of({megacredits: price})}, player1);
    expect(player1.megaCredits).eq(100 - price);
    expect(bazaar.slots).deep.eq(['Bene Gesserit Dossier', null, null, null, null]);
    expect(bazaarActions(player1)).is.empty;
    expect(bazaarActions(player2)).has.length(1);
    // A new generation lifts the limit
    DuneExpansion.beforeActionPhase(game, () => {});
    expect(bazaarActions(player1)).is.not.empty;
  });

  it('offers no bazaar action without an affordable ware', () => {
    bazaarOf(game).slots = ['Bene Gesserit Dossier', null, null, null, null];
    player2.megaCredits = 0;
    expect(bazaarActions(player2)).is.empty;
  });

  it('continues a bazaar phase of the former rules after a reload', () => {
    // Generation 1 without corporations reloads into the corporation choice (test games skip it)
    game.generation = 2;
    for (const player of [player1, player2, player3]) {
      game.playerIsFinishedWithResearchPhase(player);
    }
    const bazaar = bazaarOf(game);
    bazaar.buyers = [player2.id];
    const restored = Game.deserialize(JSON.parse(JSON.stringify(game.serialize())));
    expect(cast(restored.getPlayerById(player2.id).getWaitingFor(), OrOptions).title).eq(BAZAAR_TITLE);
  });
});
