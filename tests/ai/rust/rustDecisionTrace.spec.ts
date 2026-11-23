import {expect} from 'chai';
import {testGame} from '../../TestGame';
import {OrOptions} from '../../../src/server/inputs/OrOptions';
import {SelectOption} from '../../../src/server/inputs/SelectOption';
import {snapshot, setDecisionRecorder, DecisionRecord} from '../../../src/server/ai/decisionTrace';
import {contractLabel, optionsOf, rustDecisionSummary, RustDecisionRecord} from '../../../src/server/ai/rust/rustDecisionTrace';

describe('Rust AI decision trace (analysis games)', () => {
  afterEach(() => setDecisionRecorder(undefined));

  const record: RustDecisionRecord = {
    kind: 'action',
    generation: 3,
    chosen: 1,
    milliseconds: 812.4,
    candidates: [
      {move: {kind: 'menu', option: 'Pass'}, mean: 2.04, rollouts: 24, adjustment: 0},
      {move: {kind: 'menu', option: 'Play project card', card: 'Research'}, mean: 4.5, rollouts: 24, adjustment: 0.5},
      {move: {kind: 'menu', option: 'Standard projects', project: 'City:SP'}, mean: null, rollouts: 0, prior: 0.3},
    ],
  };

  it('labels contract choices like the TS AI', () => {
    const [/* game */, player] = testGame(2);
    expect(contractLabel({kind: 'menu', option: 'Fund an award', name: 'Banker'}, player)).eq('Fund an award: Banker');
    expect(contractLabel({kind: 'cards', cards: []}, player)).eq('(keine)');
    expect(contractLabel({kind: 'cards', cards: ['Ants', 'Birds']}, player)).eq('Ants, Birds');
    expect(contractLabel({kind: 'initial', corporation: 'Teractor', preludes: ['Donation', 'Loan'], cards: ['Ants']}, player))
      .eq('Teractor + Donation + Loan | Ants');
  });

  it('values are mean plus correction, unsearched options have none', () => {
    const [/* game */, player] = testGame(2);
    const options = optionsOf(record, player);
    expect(options.map((option) => option.value)).deep.eq([2, 5, undefined]);
    expect(options.map((option) => option.samples)).deep.eq([24, 24, undefined]);
    expect(options.map((option) => option.chosen)).deep.eq([false, true, false]);
    expect(options[1].label).eq('Play project card: Research');
  });

  it('builds the summary and writes the decision with the raw records', () => {
    const [game, player] = testGame(2);
    const written: Array<DecisionRecord> = [];
    setDecisionRecorder((line) => written.push(line));
    const input = new OrOptions(new SelectOption('Pass'));
    const summary = rustDecisionSummary(player, input, [record], snapshot(player), game.lastSaveId);
    expect(summary?.valueUnit).eq('points');
    expect(summary?.kind).eq('action');
    expect(summary?.options[0].label).eq('Play project card: Research');
    expect(summary?.state?.possibleActions).is.not.undefined;
    expect(written).has.length(1);
    expect(written[0].engine).eq('rust');
    expect(written[0].decisionId).eq(summary?.id);
    expect(written[0].chosen).eq('Play project card: Research');
    expect(written[0].rustTraces).deep.eq([record]);
  });

  it('gives nothing without records (bot in lookahead mode or older bot)', () => {
    const [game, player] = testGame(2);
    expect(rustDecisionSummary(player, new SelectOption('Pass'), undefined, snapshot(player), game.lastSaveId)).is.undefined;
  });
});
