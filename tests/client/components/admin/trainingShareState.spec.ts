import {expect} from 'chai';
import {gameShareState} from '@/client/components/admin/trainingShareState';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';
import {TrainingShareStatus} from '@/common/trainingShare/TrainingShareModel';

const finished = {id: 'g1', source: 'local', isFinished: true} as AdminGameSummary;
const on: TrainingShareStatus = {mode: 'manual', anonymous: true, serverKeyStart: undefined, sharedGameIds: [], pendingGameIds: [], lastSharedAtMs: undefined, lastError: undefined};

describe('gameShareState', () => {
  it('offers sharing only for finished games of this server while it is on', () => {
    expect(gameShareState(finished, on, [])).eq('available');
    expect(gameShareState(finished, {...on, mode: 'off'}, [])).is.undefined;
    expect(gameShareState(finished, undefined, [])).is.undefined;
    expect(gameShareState({...finished, isFinished: false}, on, [])).is.undefined;
    expect(gameShareState({...finished, source: 'imported'}, on, [])).is.undefined;
  });

  it('shows a running upload and a shared game', () => {
    expect(gameShareState(finished, on, ['g1'])).eq('busy');
    expect(gameShareState(finished, {...on, sharedGameIds: ['g1']}, [])).eq('shared');
  });
});
