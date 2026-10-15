import {expect} from 'chai';
import {testGame} from '../TestGame';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {SelectAmount} from '../../src/server/inputs/SelectAmount';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {Mine} from '../../src/server/cards/base/Mine';
import {RoboticWorkforce} from '../../src/server/cards/base/RoboticWorkforce';
import {clearFollowUpPlan, followUpChoices, plannedFollowUp, plannedResponse, setFollowUpPlan} from '../../src/server/ai/followUpPlan';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';

describe('AI follow-up plan', () => {
  it('answers the next OR question with the planned option once', () => {
    const [, player] = testGame(2);
    const question = new OrOptions(new SelectOption('first'), new SelectOption('second'));
    setFollowUpPlan(player, [1]);
    expect(plannedFollowUp(question, player)).deep.eq({type: 'or', index: 1, response: {type: 'option'}});
    expect(plannedFollowUp(question, player)).is.undefined;
  });

  it('drops a plan that does not fit the question', () => {
    const [, player] = testGame(2);
    const question = new OrOptions(new SelectOption('only'), new SelectOption('other'));
    setFollowUpPlan(player, [5]);
    expect(plannedFollowUp(question, player)).is.undefined;
    setFollowUpPlan(player, [0]);
    clearFollowUpPlan(player);
    expect(plannedFollowUp(question, player)).is.undefined;
  });

  afterEach(() => clearPlayerTunings());

  it('answers a single-card choice with the planned card', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'followUpCards');
    const cards = [new Mine(), new RoboticWorkforce()];
    const input = new SelectCard('Select builder card to copy', 'Copy', cards);
    expect(plannedResponse(input, 1, player)).deep.eq({type: 'card', cards: [cards[1].name]});
    expect(plannedResponse(input, 5, player)).is.undefined;
  });

  it('tries the smallest, middle and largest X, also inside an OR question', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'followUpAmounts');
    const question = new OrOptions(new SelectAmount('Spend 2X M€', 'Spend', 1, 29), new SelectOption('Decrease energy production'));
    expect(followUpChoices(question, player)?.length).eq(4);
    expect(plannedResponse(question, 1, player)).deep.eq({type: 'or', index: 0, response: {type: 'amount', amount: 15}});
    expect(plannedResponse(question, 3, player)).deep.eq({type: 'or', index: 1, response: {type: 'option'}});
  });

  it('leaves X to the quick rule without the variant', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'noFollowUpAmounts');
    expect(followUpChoices(new SelectAmount('X', 'Spend', 1, 29), player)).is.undefined;
  });
});
