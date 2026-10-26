import {expect} from 'chai';
import {capAgainstPass} from '../../src/server/ai/passFairness';

// A move worse than doing nothing on its own may not end up above passing.
describe('AI pass fairness', () => {
  it('caps a move below the current position under the pass value', () => {
    const entries = [{candidate: 'pass', outcome: {value: 451.1}}, {candidate: 'convert', outcome: {value: 459.9}}, {candidate: 'card', outcome: {value: 470}}];
    const plain = new Map([['pass', 451], ['convert', 448], ['card', 460]]);
    capAgainstPass(entries, plain, 450.4, (candidate) => candidate === 'pass');
    expect(entries[1].outcome.value).to.be.below(451.1);
    expect(entries[2].outcome.value).eq(470);
  });

  it('changes nothing without a pass', () => {
    const entries = [{candidate: 'convert', outcome: {value: 459.9}}];
    capAgainstPass(entries, new Map([['convert', 448]]), 450, () => false);
    expect(entries[0].outcome.value).eq(459.9);
  });
});
