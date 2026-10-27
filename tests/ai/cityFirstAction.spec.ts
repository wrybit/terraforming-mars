import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {cityFirstActionAdjustment} from '../../src/server/ai/cityFirstAction';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectSpace} from '../../src/server/inputs/SelectSpace';
import {SelectStandardProjectToPlay} from '../../src/server/inputs/SelectStandardProjectToPlay';
import {Phase} from '../../src/common/Phase';
import {CardName} from '../../src/common/cards/CardName';
import {InputResponse} from '../../src/common/inputs/InputResponse';
import {IPlayer} from '../../src/server/IPlayer';

// While own cities do not lead own greeneries, the city comes first and plants wait for it: greeneries placed with
// a city lead were 15 % for the AI and 29 % for humans, and the space choice alone (cityFirst) did not change it.
describe('AI cityFirstAction', () => {
  afterEach(() => clearPlayerTunings());

  function actionMenu(player: IPlayer): OrOptions {
    const game = player.game;
    game.generation = 5;
    game.phase = Phase.ACTION;
    player.takeAction();
    return player.getWaitingFor() as OrOptions;
  }

  function convertPlants(menu: OrOptions): InputResponse {
    const index = menu.options.findIndex((option) => option instanceof SelectSpace);
    const option = menu.options[index] as SelectSpace;
    return {type: 'or', index, response: {type: 'space', spaceId: option.spaces[0].id}};
  }

  function cityProject(menu: OrOptions): InputResponse {
    const index = menu.options.findIndex((option) => option instanceof SelectStandardProjectToPlay);
    return {type: 'or', index, response: {type: 'projectCard', card: CardName.CITY_STANDARD_PROJECT}};
  }

  it('lowers a greenery without an own city and raises the city while cities do not lead', () => {
    const [game, player] = testGame(2);
    game.addGreenery(player, game.board.getAvailableSpacesForGreenery(player)[0]);
    player.plants = 8;
    player.megaCredits = 30;
    const menu = actionMenu(player);
    expect(cityFirstActionAdjustment(player, menu, convertPlants(menu))).eq(0);
    expect(cityFirstActionAdjustment(player, menu, cityProject(menu))).eq(0);
    setPlayerTuning(player.id, 'cityFirstAction');
    expect(cityFirstActionAdjustment(player, menu, convertPlants(menu))).to.be.lessThan(0);
    expect(cityFirstActionAdjustment(player, menu, cityProject(menu))).to.be.greaterThan(0);
  });

  it('leaves the order alone once own cities lead', () => {
    const [game, player] = testGame(2);
    const spaces = game.board.getAvailableSpacesForCity(player);
    game.addCity(player, spaces[0]);
    player.plants = 8;
    player.megaCredits = 30;
    setPlayerTuning(player.id, 'cityFirstAction');
    const menu = actionMenu(player);
    expect(cityFirstActionAdjustment(player, menu, cityProject(menu))).eq(0);
  });
});
