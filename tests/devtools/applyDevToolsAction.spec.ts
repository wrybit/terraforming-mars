import {expect} from 'chai';
import {testGame} from '../TestGame';
import {applyDevToolsAction} from '../../src/server/devtools/applyDevToolsAction';
import {isDevToolsAction} from '../../src/common/devtools/devToolsAction';
import {CardName} from '../../src/common/cards/CardName';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {TileType} from '../../src/common/TileType';
import {BoardName} from '../../src/common/boards/BoardName';
import {Board} from '../../src/server/boards/Board';
import {DevToolsTrigger, PLANET_SPACE_TYPES} from '../../src/common/devtools/devToolsAction';
import {Tag} from '../../src/common/cards/Tag';
import {Research} from '../../src/server/cards/base/Research';
import {Game} from '../../src/server/Game';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {SelectSpace} from '../../src/server/inputs/SelectSpace';
import {SelectPayment} from '../../src/server/inputs/SelectPayment';

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

  it('places tiles by the placement rules and leaves no space free when full', () => {
    const [game] = testGame(2);
    applyDevToolsAction(game, {type: 'terraform', share: 0.5});
    const cities = game.board.spaces.filter((space) => space.tile?.tileType === TileType.CITY);
    expect(cities.length).greaterThan(0);
    // Cities apart, oceans only on ocean spaces
    for (const city of cities) {
      expect(game.board.getAdjacentSpaces(city).some((adjacent) => Board.isCitySpace(adjacent))).is.false;
    }
    for (const space of game.board.getOceanSpaces()) {
      expect(space.spaceType).not.eq(SpaceType.LAND);
    }
    // Now and then a special tile
    applyDevToolsAction(game, {type: 'terraform', share: 0.9});
    const kinds = new Set(game.board.spaces.map((space) => space.tile?.tileType));
    expect(kinds.has(TileType.NATURAL_PRESERVE) || kinds.has(TileType.ECOLOGICAL_ZONE) || kinds.has(TileType.INDUSTRIAL_CENTER)).is.true;

    applyDevToolsAction(game, {type: 'terraform', share: 1});
    const planet = game.board.spaces.filter((space) => PLANET_SPACE_TYPES.includes(space.spaceType));
    expect(planet.filter((space) => space.tile === undefined)).is.empty;
    expect(game.board.getOceanSpaces().length).eq(game.max.oceans);

    applyDevToolsAction(game, {type: 'terraform', share: 0});
    expect(planet.filter((space) => space.tile !== undefined)).is.empty;
  });

  it('sets the number of oceans', () => {
    const [game] = testGame(2);
    applyDevToolsAction(game, {type: 'oceans', count: 4});
    expect(game.board.getOceanSpaces().length).eq(4);
    applyDevToolsAction(game, {type: 'oceans', count: 99});
    expect(game.board.getOceanSpaces().length).eq(game.max.oceans);
    applyDevToolsAction(game, {type: 'oceans', count: 1});
    expect(game.board.getOceanSpaces().length).eq(1);
    expect(lastLog(game)).eq('🛠 DevTools: oceans set to ${0}');
  });

  it('builds the game anew on another board and theme, keeping the tiles that fit', () => {
    const [game, player] = testGame(2);
    const space = game.board.getAvailableSpacesOnLand(player)[0];
    game.simpleAddTile(player, space, {tileType: TileType.GREENERY});
    const rebuilt = applyDevToolsAction(game, {type: 'setup', boardName: BoardName.ARRAKIS_61, theme: 'dune'});
    expect(rebuilt).not.eq(game);
    expect(rebuilt.gameOptions.boardName).eq(BoardName.ARRAKIS_61);
    expect(rebuilt.gameOptions.theme).eq('dune');
    expect(rebuilt.id).eq(game.id);
    expect(rebuilt.gameLog.slice(-2).map((entry) => entry.message)).deep.eq([
      '🛠 DevTools: board changed to ${0} (${1} tiles did not fit)', '🛠 DevTools: theme changed to ${0}']);
    const moved = rebuilt.board.spaces.find((candidate) => candidate.id === space.id);
    if (moved?.spaceType === SpaceType.LAND) {
      expect(moved.tile?.tileType).eq(TileType.GREENERY);
    }
    // Nothing to change: the same game
    expect(applyDevToolsAction(rebuilt, {type: 'setup', boardName: BoardName.ARRAKIS_61})).eq(rebuilt);
  });

  it('sets rating, points, tags and discounts of a player as the bars show them', () => {
    const [game, player] = testGame(2);
    applyDevToolsAction(game, {type: 'player', color: player.color, terraformRating: 33, tags: {[Tag.SCIENCE]: 4},
      tagDiscounts: {[Tag.SCIENCE]: 2}, cardDiscount: 1});
    expect(player.terraformRating).eq(33);
    expect(player.tags.count(Tag.SCIENCE, 'raw')).eq(4);
    expect(player.tags.countAllTags()[Tag.SCIENCE]).eq(4);
    // A science card costs 3 less: 1 for every card, 2 for its science tag
    const card = new Research();
    expect(player.getCardCost(card)).eq(card.cost - 3);
    applyDevToolsAction(game, {type: 'player', color: player.color, victoryPoints: 50});
    expect(player.getVictoryPoints().total).eq(50);
    // Kept through a save
    const restored = Game.deserialize(game.serialize()).getPlayerById(player.id);
    expect(restored.tags.count(Tag.SCIENCE, 'raw')).eq(4);
    expect(restored.getVictoryPoints().total).eq(50);
  });

  it('protects the plants and sets the worth of steel and titanium', () => {
    const [game, player] = testGame(2);
    expect(player.plantsAreProtected()).is.false;
    applyDevToolsAction(game, {type: 'player', color: player.color, protectedHabitats: true, steelValue: 4, titaniumValue: 5});
    expect(player.plantsAreProtected()).is.true;
    expect(player.getSteelValue()).eq(4);
    expect(player.getTitaniumValue()).eq(5);
  });

  it('sets the generation', () => {
    const [game] = testGame(2);
    applyDevToolsAction(game, {type: 'globals', generation: 7});
    expect(game.generation).eq(7);
  });

  it('asks a placement right now and then returns to the earlier question', () => {
    const [game, player] = testGame(2);
    const earlier = new SelectOption('Earlier question');
    player.setWaitingFor(earlier);
    applyDevToolsAction(game, {type: 'trigger', color: player.color, trigger: 'city'});
    const asked = player.getWaitingFor();
    expect(asked).instanceOf(SelectSpace);
    const space = (asked as SelectSpace).spaces[0];
    player.process({type: 'space', spaceId: space.id});
    expect(space.tile?.tileType).eq(TileType.CITY);
    expect(player.getWaitingFor()).eq(earlier);
  });

  it('claims a milestone for free', () => {
    const [game, player] = testGame(2);
    player.megaCredits = 0;
    applyDevToolsAction(game, {type: 'trigger', color: player.color, trigger: 'milestone'});
    player.process({type: 'or', index: 0, response: {type: 'option'}});
    expect(game.claimedMilestones.map((claim) => claim.player)).deep.eq([player]);
    expect(player.megaCredits).eq(0);
  });

  it('asks a payment that pays too much, and one with four currencies', () => {
    const [game, player] = testGame(2);
    applyDevToolsAction(game, {type: 'trigger', color: player.color, trigger: 'overpay'});
    const overpay = player.getWaitingFor() as SelectPayment;
    expect(overpay.preset).deep.eq({titanium: 2});
    expect(2 * player.getTitaniumValue()).greaterThan(overpay.amount);
    expect(player.titanium).gte(2);
    applyDevToolsAction(game, {type: 'trigger', color: player.color, trigger: 'pay'});
    expect(player.getWaitingFor()).instanceOf(SelectPayment);
    expect([player.steel, player.titanium, player.heat].every((amount) => amount > 0)).is.true;
  });

  it('asks the worm move with its distances and moves the worm', () => {
    const [game, player] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['worm']});
    const worm = game.duneData?.worm;
    if (worm === undefined) {
      throw new Error('no worm');
    }
    const start = worm.spaceId;
    applyDevToolsAction(game, {type: 'trigger', color: player.color, trigger: 'worm'});
    // The distances go to the client only with a chooser: they open the move tab
    expect(worm.chooser).eq(player.id);
    player.process({type: 'or', index: 0, response: {type: 'option'}});
    expect(worm.chooser).is.undefined;
    expect(worm.trail?.length ?? 0).eq(1);
    expect(worm.path).is.not.undefined;
    expect(start).is.a('string');
  });

  it('asks every card and player question with a real dialog', () => {
    const expected: Array<[DevToolsTrigger, string]> = [
      ['specialTile', 'or'], ['resources', 'resources'], ['player', 'player'], ['discard', 'card'], ['draft', 'card'],
      ['addResource', 'card'], ['removeResource', 'card'], ['resourceChoice', 'or'], ['moveResource', 'card'], ['takeResource', 'card'],
    ];
    for (const [trigger, type] of expected) {
      const [game, player] = testGame(2);
      applyDevToolsAction(game, {type: 'trigger', color: player.color, trigger});
      expect(player.getWaitingFor()?.type, trigger).eq(type);
    }
  });

  it('places a special tile in two steps', () => {
    const [game, player] = testGame(2);
    applyDevToolsAction(game, {type: 'trigger', color: player.color, trigger: 'specialTile'});
    player.process({type: 'or', index: 0, response: {type: 'option'}});
    const select = player.getWaitingFor() as SelectSpace;
    expect(select).instanceOf(SelectSpace);
    const space = select.spaces[0];
    player.process({type: 'space', spaceId: space.id});
    expect(space.tile?.tileType).eq(TileType.NATURAL_PRESERVE);
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
    expect(isDevToolsAction({type: 'oceans', count: 3})).is.true;
    expect(isDevToolsAction({type: 'oceans', count: 1.5})).is.false;
    expect(isDevToolsAction({type: 'setup', boardName: BoardName.HELLAS, theme: 'mars'})).is.true;
    expect(isDevToolsAction({type: 'setup', boardName: 'flat earth'})).is.false;
    expect(isDevToolsAction({type: 'resources', color: 'red', stock: {gold: 1}, production: {}})).is.false;
    expect(isDevToolsAction({type: 'delete everything'})).is.false;
  });
});
