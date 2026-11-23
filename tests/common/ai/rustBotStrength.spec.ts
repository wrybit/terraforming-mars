import {expect} from 'chai';
import {DEFAULT_RUST_BOT_STRENGTH, rustBotStrength, rustBotStrengthKey} from '../../../src/common/ai/rustBotStrength';

describe('rustBotStrength', () => {
  it('names the .env keys after strength and value', () => {
    expect(rustBotStrengthKey('hard', 'rollouts')).eq('AI_HARD_ROLLOUTS');
    expect(rustBotStrengthKey('easy', 'timeLimit')).eq('AI_EASY_THINKING_MS');
  });

  it('takes the admin values and keeps the defaults for empty, broken or out-of-range ones', () => {
    const strength = rustBotStrength('normal', {AI_NORMAL_ROLLOUTS: '32', AI_NORMAL_RANDOMNESS: '15', AI_NORMAL_CANDIDATES: 'ten', AI_NORMAL_THREADS: '0', AI_NORMAL_HORIZON: ''});
    expect(strength).deep.eq({...DEFAULT_RUST_BOT_STRENGTH.normal, rollouts: 32, randomness: 15});
    expect(rustBotStrength('easy', {AI_EASY_RANDOMNESS: '101'}).randomness).eq(0);
  });

  it('never gives more threads than the machine has cores', () => {
    expect(rustBotStrength('hard', {AI_HARD_THREADS: '8'}, 4).threads).eq(4);
    expect(rustBotStrength('hard', {AI_HARD_THREADS: '3'}, 4).threads).eq(3);
    expect(rustBotStrength('hard', {}, 1).threads).eq(1);
  });
});
