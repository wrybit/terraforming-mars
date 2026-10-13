import {expect} from 'chai';
import {bulkDeleteIds, STALE_AGE_MS} from '@/client/components/admin/bulkDelete';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

describe('bulkDelete', () => {
  const now = 100 * STALE_AGE_MS;
  const game = (id: string, ageMs: number, generation: number, playedCardCount: number | undefined) =>
    ({id, createdTimeMs: now - ageMs, generation, playedCardCount, players: [{}, {}]}) as AdminGameSummary;
  const games = [
    game('fresh-unplayed', 0, 1, 0),
    game('old-played', STALE_AGE_MS, 5, 20),
    game('gen2-busy', 0, 2, 5),
    game('imported', STALE_AGE_MS * 2, 1, undefined),
  ];

  it('all open games', () => {
    expect(bulkDeleteIds(games, 'all', now)).deep.eq(['fresh-unplayed', 'old-played', 'gen2-busy', 'imported']);
  });

  it('only games at least 12 h old', () => {
    expect(bulkDeleteIds(games, 'stale', now)).deep.eq(['old-played', 'imported']);
  });

  it('unplayed: generation 1–2 and at most two project cards per player; imports never', () => {
    expect(bulkDeleteIds(games, 'unplayed', now)).deep.eq(['fresh-unplayed']);
  });
});
