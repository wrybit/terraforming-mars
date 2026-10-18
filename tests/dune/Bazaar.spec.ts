import {expect} from 'chai';
import {testGame} from '../TestGame';
import {TestPlayer} from '../TestPlayer';
import {IGame} from '../../src/server/IGame';
import {Game} from '../../src/server/Game';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {Phase} from '../../src/common/Phase';
import {TileType} from '../../src/common/TileType';
import {BoardName} from '../../src/common/boards/BoardName';
import {BAZAAR_TITLE, BazaarData, buyingOrder, buyWare, slideAndRefill} from '../../src/server/dune/Bazaar';
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

function buy(player: TestPlayer, index: number) {
  doWait(player, OrOptions, (options) => {
    expect(options.title).eq(BAZAAR_TITLE);
    options.process({type: 'or', index, response: {type: 'option'}}, player);
  });
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
    // Nobody bought: the same two wares, one slot further right and cheaper
    slideAndRefill(bazaar, 3, game.rng);
    expect(bazaar.slots).deep.eq([null, first, second, null, null]);
    // One bought: one new ware on the left
    bazaar.slots[1] = null;
    slideAndRefill(bazaar, 3, game.rng);
    expect(bazaar.slots[0]).is.not.null;
    expect(bazaar.slots[3]).eq(second);
  });

  it('discards the ware pushed out on the right', () => {
    const bazaar = bazaarOf(game);
    bazaar.slots = [null, null, null, null, 'Seed Bales'];
    slideAndRefill(bazaar, 3, game.rng);
    expect(bazaar.discard).deep.eq(['Seed Bales']);
  });

  it('lets the least influence buy first, the bazaar tile owner before everyone', () => {
    player1.setTerraformRating(25);
    player2.setTerraformRating(20);
    player3.setTerraformRating(22);
    expect(buyingOrder(game).map((player) => player.name)).deep.eq(['player2', 'player3', 'player1']);
    const space = game.board.getAvailableSpacesOnLand(player1)[0];
    game.simpleAddTile(player1, space, {tileType: TileType.COMMERCIAL_DISTRICT});
    expect(buyingOrder(game)[0]).eq(player1);
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

  it('runs between research and the action phase, one ware per player', () => {
    player1.setTerraformRating(22);
    player2.setTerraformRating(20);
    player3.setTerraformRating(21);
    for (const player of [player1, player2, player3]) {
      game.playerIsFinishedWithResearchPhase(player);
    }
    const bazaar = bazaarOf(game);
    expect(bazaar.buyers).deep.eq([player2.id, player3.id, player1.id]);
    expect(player1.getWaitingFor()).is.undefined;
    const ware = bazaar.slots[0];
    buy(player2, 0);
    expect(bazaar.discard).deep.eq([ware]);
    // "Buy nothing" is always the last choice
    const choices = cast(player3.getWaitingFor(), OrOptions);
    buy(player3, choices.options.length - 1);
    buy(player1, 0);
    expect(bazaar.buyers).is.empty;
    expect(game.phase).eq(Phase.ACTION);
    expect(game.activePlayer).eq(game.first);
  });

  it('skips a player who cannot afford any ware', () => {
    player2.megaCredits = 0;
    player2.setTerraformRating(10);
    for (const player of [player1, player2, player3]) {
      game.playerIsFinishedWithResearchPhase(player);
    }
    expect(player2.getWaitingFor()).is.undefined;
    expect(bazaarOf(game).buyers[0]).not.eq(player2.id);
  });

  it('continues the bazaar after a reload', () => {
    // Generation 1 without corporations reloads into the corporation choice (test games skip it)
    game.generation = 2;
    for (const player of [player1, player2, player3]) {
      game.playerIsFinishedWithResearchPhase(player);
    }
    const buyer = bazaarOf(game).buyers[0];
    const restored = Game.deserialize(JSON.parse(JSON.stringify(game.serialize())));
    expect(restored.duneData?.bazaar?.buyers[0]).eq(buyer);
    expect(cast(restored.getPlayerById(buyer).getWaitingFor(), OrOptions).title).eq(BAZAAR_TITLE);
  });
});
