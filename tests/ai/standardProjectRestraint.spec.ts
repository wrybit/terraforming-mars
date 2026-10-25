import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {standardProjectPenalty} from '../../src/server/ai/standardProjectRestraint';

// While a hand card is playable, standard projects give up a fixed amount; never in the last generation.
describe('AI standard project restraint', () => {
  afterEach(() => clearPlayerTunings());

  it('gives up 2 M€ in the baseline (round 137)', () => {
    const [, player] = testGame(2);
    expect(standardProjectPenalty(player, true)).to.eq(2);
  });

  it('is off without the rule', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'noStandardRestraint');
    expect(standardProjectPenalty(player, true)).to.eq(0);
  });

  it('applies only while a hand card is playable', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'standardRestraint5');
    expect(standardProjectPenalty(player, true)).to.eq(5);
    expect(standardProjectPenalty(player, false)).to.eq(0);
  });

  it('is off in the last generation', () => {
    const [game, player] = testGame(2);
    setPlayerTuning(player.id, 'standardRestraint5');
    game.generation = 99;
    game.lastSoloGeneration = 99;
    (game as any).marsIsTerraformed = () => true;
    expect(standardProjectPenalty(player, true)).to.eq(0);
  });
});
