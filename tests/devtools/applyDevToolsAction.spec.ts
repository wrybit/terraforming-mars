import {expect} from 'chai';
import {testGame} from '../TestGame';
import {applyDevToolsAction} from '../../src/server/devtools/applyDevToolsAction';
import {isDevToolsAction} from '../../src/common/devtools/devToolsAction';
import {CardName} from '../../src/common/cards/CardName';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {TileType} from '../../src/common/TileType';

function lastLog(game: ReturnType<typeof testGame>[0]): string {
  return game.gameLog[game.gameLog.length - 1].message;
}

describe('applyDevToolsAction', () => {
  it('sets global parameters directly, within the board, and logs each one', () => {
    const [game] = testGame(2);
    applyDevToolsAction(game, {type: 'globals', temperature: -9, oxygen: 40});
    // Temperature keeps its steps of two, oxygen stops at its maximum
    expect(game.getTemperature()).eq(-8);
    expect(game.getOxygenLevel()).eq(game.max.oxygen);
    expect(game.gameLog.slice(-2).map((entry) => entry.message)).deep.eq(['🛠 DevTools: temperature set to ${0}', '🛠 DevTools: oxygen set to ${0}']);
  });

  it('fills the planet by a share and takes away only its own tiles', () => {
    const [game, player] = testGame(2);
    const ownSpace = game.board.getAvailableSpacesOnLand(player)[0];
    game.simpleAddTile(player, ownSpace, {tileType: TileType.CITY});
    applyDevToolsAction(game, {type: 'terraform', share: 0.5});
    expect(game.board.getOceanSpaces().length).eq(Math.round(game.max.oceans / 2));
    expect(game.devToolsTiles.length).greaterThan(0);
    expect(lastLog(game)).contains('planet filled');

    applyDevToolsAction(game, {type: 'terraform', share: 0});
    expect(game.devToolsTiles).is.empty;
    expect(game.board.getOceanSpaces()).is.empty;
    // The city a player built stays
    const tiles = game.board.spaces.filter((space) => space.spaceType === SpaceType.LAND && space.tile !== undefined);
    expect(tiles.map((space) => space.id)).deep.eq([ownSpace.id]);
  });

  it('sets resources and production of one player as absolute values', () => {
    const [game, player] = testGame(2);
    applyDevToolsAction(game, {type: 'resources', color: player.color, stock: {megacredits: 50, plants: 7}, production: {heat: 3, megacredits: -9}});
    expect(player.megaCredits).eq(50);
    expect(player.plants).eq(7);
    expect(player.production.heat).eq(3);
    // Not below the minimum of the game
    expect(player.production.megacredits).eq(-5);
    expect(lastLog(game)).eq('🛠 DevTools: resources and production of ${0} set');
  });

  it('puts a card into the hand or straight into play', () => {
    const [game, player] = testGame(2);
    applyDevToolsAction(game, {type: 'card', color: player.color, card: CardName.ASTEROID, to: 'hand'});
    expect(player.cardsInHand.map((card) => card.name)).contains(CardName.ASTEROID);
    applyDevToolsAction(game, {type: 'card', color: player.color, card: CardName.ARCTIC_ALGAE, to: 'tableau'});
    expect(player.playedCards.has(CardName.ARCTIC_ALGAE)).is.true;
    expect(lastLog(game)).eq('🛠 DevTools: ${0} got ${1} into play without its effect');
  });

  it('checks the shape of incoming actions', () => {
    expect(isDevToolsAction({type: 'terraform', share: 0.3})).is.true;
    expect(isDevToolsAction({type: 'terraform', share: 2})).is.false;
    expect(isDevToolsAction({type: 'resources', color: 'red', stock: {gold: 1}, production: {}})).is.false;
    expect(isDevToolsAction({type: 'delete everything'})).is.false;
  });
});
