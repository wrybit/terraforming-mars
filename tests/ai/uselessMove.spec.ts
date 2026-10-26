import {expect} from 'chai';
import {testGame} from '../TestGame';
import {setTemperature} from '../TestingUtils';
import {chooseAction} from '../../src/server/ai/actionLookahead';
import {isUselessMove} from '../../src/server/ai/uselessMove';
import {describeResponse} from '../../src/server/ai/decisionLabels';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {SelectStandardProjectToPlay} from '../../src/server/inputs/SelectStandardProjectToPlay';
import {CardName} from '../../src/common/cards/CardName';
import {IPlayer} from '../../src/server/IPlayer';
import {Phase} from '../../src/common/Phase';

// Human game: the AI converted 8 heat 13 times at maximum temperature instead of passing.
describe('AI useless moves', () => {
  const convertHeatOption = (player: IPlayer) => {
    const menu = player.getActions() as OrOptions;
    return menu.options.find((option) => option instanceof SelectOption && JSON.stringify(option.title).includes('Convert 8 heat'));
  };

  it('passes instead of converting heat at maximum temperature', () => {
    const [game, player] = testGame(2);
    game.generation = 5;
    setTemperature(game, game.max.temperature);
    player.heat = 39;
    game.phase = Phase.ACTION;
    player.takeAction();
    const menu = player.getWaitingFor() as OrOptions;
    const option = convertHeatOption(player);
    expect(option).not.to.be.undefined;
    expect(isUselessMove(option!, {type: 'option'})).is.true;
    const evaluated: Array<string> = [];
    const chosen = chooseAction(menu, player, {noise: 0, onEvaluated: (response) => evaluated.push(describeResponse(menu, response, game))});
    expect(chosen).not.to.be.undefined;
    expect(describeResponse(menu, chosen!, game)).not.to.include('Convert 8 heat');
    // Not even a candidate: the pass lookahead can no longer lose to it.
    expect(evaluated.some((label) => label.includes('Convert 8 heat'))).is.false;
  });

  it('still converts heat below maximum temperature', () => {
    const [game, player] = testGame(2);
    setTemperature(game, 0);
    player.heat = 39;
    const option = convertHeatOption(player);
    expect(option).not.to.be.undefined;
    expect(isUselessMove(option!, {type: 'option'})).is.false;
  });

  it('drops the asteroid standard project at maximum temperature', () => {
    const [game, player] = testGame(2);
    setTemperature(game, game.max.temperature);
    player.megaCredits = 30;
    const projects = player.getStandardProjectOption() as SelectStandardProjectToPlay;
    const asteroid = {type: 'projectCard' as const, card: CardName.ASTEROID_STANDARD_PROJECT, payment: {} as any};
    const city = {type: 'projectCard' as const, card: CardName.CITY_STANDARD_PROJECT, payment: {} as any};
    expect(isUselessMove(projects, asteroid)).is.true;
    expect(isUselessMove(projects, city)).is.false;
  });
});
