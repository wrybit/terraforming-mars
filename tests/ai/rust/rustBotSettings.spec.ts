import {expect} from 'chai';
import {rustBotSettings} from '../../../src/server/ai/rust/RustMirror';

describe('rustBotSettings', () => {
  let previous: string | undefined;

  beforeEach(() => {
    previous = process.env.AI_HARD_RANDOMNESS;
    process.env.AI_HARD_RANDOMNESS = '20';
  });

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.AI_HARD_RANDOMNESS;
    } else {
      process.env.AI_HARD_RANDOMNESS = previous;
    }
  });

  it('passes randomness only to a bot that announced it', () => {
    expect(rustBotSettings('hard', ['randomness']).randomness).eq(20);
    expect(rustBotSettings('hard', [])).not.to.have.property('randomness');
  });
});
