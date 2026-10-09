import {expect} from 'chai';
import {testGame} from '../TestGame';
import {BASELINE_TUNING, HARD_LEVEL_TUNING, TWO_PLAYER_TUNING, clearPlayerTunings, setPlayerTuning, tuningOf} from '../../src/server/ai/aiTuning';

describe('AI tuning', () => {
  afterEach(() => clearPlayerTunings());

  it('uses the baseline plus the two-player tuning with two players', () => {
    const [, twoPlayer] = testGame(2);
    const [, threePlayer] = testGame(3);
    expect(tuningOf(twoPlayer)).deep.eq({...BASELINE_TUNING, ...TWO_PLAYER_TUNING});
    expect(tuningOf(threePlayer)).deep.eq(BASELINE_TUNING);
  });

  it('searches wider on level hard', () => {
    const [, player] = testGame(3);
    player.aiLevel = 'hard';
    expect(tuningOf(player).secondStepCandidates).eq(HARD_LEVEL_TUNING.secondStepCandidates);
    expect(tuningOf(player).opponentReplies).eq(HARD_LEVEL_TUNING.opponentReplies);
  });

  it('applies a test variant on top of the two-player tuning', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'noPrior');
    expect(tuningOf(player).cardPriorWeight).eq(0);
    expect(tuningOf(player).secondStepCandidates).eq(BASELINE_TUNING.secondStepCandidates);
  });
});
