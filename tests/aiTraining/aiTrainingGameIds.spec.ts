import {expect} from 'chai';
import {withoutAiTrainingGames} from '../../src/server/aiTraining/aiTrainingGameIds';
import {memoryTrainingStorage, StoredAiTrainingGame} from '../../src/server/aiTraining/aiTrainingStore';
import {GameId} from '../../src/common/Types';

describe('withoutAiTrainingGames', () => {
  it('keeps the AI training games out of every list but the lobby', () => {
    const storage = memoryTrainingStorage([{gameId: 'gtraining' as GameId} as StoredAiTrainingGame]);
    const ledger = [{gameId: 'gplayed' as GameId, participantIds: []}, {gameId: 'gtraining' as GameId, participantIds: []}];
    expect(withoutAiTrainingGames(ledger, storage).map((entry) => entry.gameId)).deep.eq(['gplayed']);
  });

  it('keeps everything when nothing was imported', () => {
    const ledger = [{gameId: 'gplayed' as GameId}];
    expect(withoutAiTrainingGames(ledger, memoryTrainingStorage())).deep.eq(ledger);
  });
});
