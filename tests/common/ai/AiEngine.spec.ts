import {expect} from 'chai';
import {aiEngineOfGame, aiVersionOfGame} from '../../../src/common/ai/AiEngine';

describe('AiEngine', () => {
  it('version of the Rust AI that played, only from Rust AI seats', () => {
    expect(aiVersionOfGame([{aiLevel: undefined}, {aiLevel: 'hard', aiEngine: 'rust', aiVersion: '1.4'}])).eq('1.4');
    expect(aiVersionOfGame([{aiLevel: 'hard', aiEngine: 'ts', aiVersion: '1.4'}])).is.undefined;
    // games from before versions existed
    expect(aiVersionOfGame([{aiLevel: 'hard', aiEngine: 'rust'}])).is.undefined;
    expect(aiVersionOfGame([{aiLevel: undefined}])).is.undefined;
  });

  it('program of a game with AI players', () => {
    expect(aiEngineOfGame([{aiLevel: 'hard', aiEngine: 'rust'}])).eq('rust');
    expect(aiEngineOfGame([{aiLevel: 'hard', aiEngine: 'ts'}])).eq('typescript');
    expect(aiEngineOfGame([{aiLevel: undefined}])).is.undefined;
  });
});
