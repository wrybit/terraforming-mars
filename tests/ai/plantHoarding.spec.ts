import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {hasCityPlan, plantHoardDiscount} from '../../src/server/ai/plantHoardDecay';
import {lonelyGreeneryFactor} from '../../src/server/ai/lonelyGreeneryOdds';
import {cityFirstActionAdjustment} from '../../src/server/ai/cityFirstAction';
import {chooseAction} from '../../src/server/ai/actionLookahead';
import {describeResponse} from '../../src/server/ai/decisionLabels';
import {expectedLaterCities} from '../../src/server/ai/cityNeighbourOdds';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectSpace} from '../../src/server/inputs/SelectSpace';
import {Phase} from '../../src/common/Phase';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {IPlayer} from '../../src/server/IPlayer';
import {InputResponse} from '../../src/common/inputs/InputResponse';

// Human game: the AI held 61 plants in generation 10 with no city and no money for one and passed instead of placing
// greeneries; it also put its Commercial District where no city was next to it.
describe('AI plant hoarding', () => {
  afterEach(() => clearPlayerTunings());

  function actionMenu(player: IPlayer, generation: number): OrOptions {
    const game = player.game;
    game.generation = generation;
    game.phase = Phase.ACTION;
    player.takeAction();
    return player.getWaitingFor() as OrOptions;
  }

  function convertPlants(menu: OrOptions): InputResponse {
    const index = menu.options.findIndex((option) => option instanceof SelectSpace);
    const option = menu.options[index] as SelectSpace;
    return {type: 'or', index, response: {type: 'space', spaceId: option.spaces[0].id}};
  }

  it('discounts waiting plants only without a city plan', () => {
    const [, player] = testGame(2);
    player.plants = 30;
    player.megaCredits = 0;
    // Round 156: adopted in the baseline; the check variant switches it off.
    setPlayerTuning(player.id, 'noPlantHoardDecay');
    expect(plantHoardDiscount(player, 5)).eq(0);
    setPlayerTuning(player.id, 'plantHoardDecay');
    expect(hasCityPlan(player)).is.false;
    const withoutPlan = plantHoardDiscount(player, 5);
    expect(withoutPlan).to.be.greaterThan(0);
    player.megaCredits = 30;
    expect(hasCityPlan(player)).is.true;
    expect(plantHoardDiscount(player, 5)).to.be.lessThan(withoutPlan);
  });

  it('values plants the remaining generations cannot convert at nothing', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'plantHoardDecay');
    player.megaCredits = 30;
    player.plants = 100;
    // Last generation: one round of conversions (3 × 8 plants) at most.
    expect(plantHoardDiscount(player, 0)).to.be.greaterThan(60);
  });

  it('lifts city first while no city is planned', () => {
    const [, player] = testGame(2);
    player.plants = 24;
    player.megaCredits = 0;
    const menu = actionMenu(player, 5);
    setPlayerTuning(player.id, 'noPlantHoardDecay');
    expect(cityFirstActionAdjustment(player, menu, convertPlants(menu))).to.be.lessThan(0);
    setPlayerTuning(player.id, 'plantHoardDecay');
    expect(cityFirstActionAdjustment(player, menu, convertPlants(menu))).eq(0);
  });

  it('converts 24+ plants without an own city and without a city plan', () => {
    const [game, player] = testGame(2);
    setPlayerTuning(player.id, 'plantHoardDecay');
    player.plants = 31;
    player.megaCredits = 0;
    const menu = actionMenu(player, 8);
    const chosen = chooseAction(menu, player, {noise: 0});
    expect(chosen).not.to.be.undefined;
    expect(describeResponse(menu, chosen!, game)).to.include('plants into greenery');
  });

  it('weights the lonely greenery penalty by the chance an opponent still builds there', () => {
    const [, player] = testGame(2);
    expect(lonelyGreeneryFactor(player)).eq(1);
    setPlayerTuning(player.id, 'lonelyGreeneryOdds');
    const factor = lonelyGreeneryFactor(player);
    expect(factor).to.be.greaterThan(0);
    expect(factor).to.be.lessThan(1);
  });

  it('counts open spots around a Commercial District below one real city', () => {
    const [game, player] = testGame(2);
    game.generation = 8;
    const board = game.board;
    // A space whose land neighbours are all free: five or six open city spots around it.
    const lonely = board.getAvailableSpacesOnLand(player).find((space) =>
      board.getAdjacentSpaces(space).filter((neighbour) => neighbour.spaceType === SpaceType.LAND && neighbour.tile === undefined).length >= 5)!;
    expect(lonely).not.to.be.undefined;
    // Before: 5 × 0.4 = 2 expected cities, more than a city already next door. Now at most 3 fit, at a lower chance.
    expect(expectedLaterCities(board.getAdjacentSpaces(lonely), 0, player)).to.be.lessThan(1);
    expect(expectedLaterCities(board.getAdjacentSpaces(lonely), 3, player)).eq(0);
  });
});
