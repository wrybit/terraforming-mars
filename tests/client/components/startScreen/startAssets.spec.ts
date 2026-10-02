import {expect} from 'chai';
import {vi} from 'vitest';
import {PRELOAD_TIMEOUT, preloadStartAssets} from '@/client/components/startScreen/startAssets';

describe('startAssets', () => {
  it('never blocks the start screen longer than the timeout', async () => {
    vi.useFakeTimers();
    try {
      let finished = false;
      const loading = preloadStartAssets(() => {}).then(() => finished = true);
      await vi.advanceTimersByTimeAsync(PRELOAD_TIMEOUT + 10);
      await loading;
      expect(finished).to.be.true;
    } finally {
      vi.useRealTimers();
    }
  });
});
