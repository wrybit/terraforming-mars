import {expect} from 'chai';
import {testGame} from '../TestGame';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {aiStandIns} from '../../src/server/ai/aiStandIns';
import {processWithFallback} from '../../src/server/ai/aiDriver';
import {InputResponse} from '../../src/common/inputs/InputResponse';
import {PlayerInput} from '../../src/server/PlayerInput';

describe('AI stand-ins', () => {
  it('Rust AI players get the TypeScript AI first, then the quick answer', () => {
    const [, player] = testGame(2);
    player.aiEngine = 'rust';
    const names = aiStandIns(player, new SelectOption('Pass'), {engine: 'rust', typescriptFallback: true}).map((standIn) => standIn.name);
    expect(names).deep.eq(['typescript', 'quick']);
  });

  it('without the TypeScript stand-in a Rust AI player gets only the quick answer', () => {
    const [, player] = testGame(2);
    player.aiEngine = 'rust';
    expect(aiStandIns(player, new SelectOption('Pass'), {engine: 'rust', typescriptFallback: false}).map((standIn) => standIn.name)).deep.eq(['quick']);
  });

  it('TypeScript AI players get only the quick answer (they already decided with the TypeScript AI)', () => {
    const [, player] = testGame(2);
    player.aiEngine = 'typescript';
    expect(aiStandIns(player, new SelectOption('Pass'), {engine: 'rust', typescriptFallback: true}).map((standIn) => standIn.name)).deep.eq(['quick']);
  });

  it('plays the next stand-in when one has no answer or the game refuses it', () => {
    const input = new SelectOption('Pass') as PlayerInput;
    const processed: Array<InputResponse> = [];
    let waiting = true;
    const player = {
      name: 'Bot',
      game: {id: 'g1'},
      getWaitingFor: () => waiting ? input : undefined,
      process: (response: InputResponse) => {
        if ((response as {type: string}).type === 'bad') {
          throw new Error('not an option');
        }
        processed.push(response);
        waiting = false;
      },
    } as any;
    const reasons: Array<string> = [];
    const quick = {type: 'option'} as InputResponse;
    processWithFallback(player, input, {chosen: {type: 'bad'} as unknown as InputResponse, fromRust: true},
      [{name: 'typescript', answer: () => undefined}, {name: 'quick', answer: () => quick}], (reason) => reasons.push(reason));
    expect(processed).deep.eq([quick]);
    expect(reasons).deep.eq(['the game refused its answer: not an option']);
  });
});
