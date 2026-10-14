import {expect} from 'chai';
import {testGame} from '../TestGame';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {clearFollowUpPlan, plannedFollowUp, setFollowUpPlan} from '../../src/server/ai/followUpPlan';

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
});
