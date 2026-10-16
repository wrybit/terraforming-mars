import {expect} from 'chai';
import {afterEach, beforeEach, vi} from 'vitest';
import {scheduleLayoutJob} from '@/client/utils/layoutBatch';

describe('layoutBatch', () => {
  let frameCallback: ((time: number) => void) | undefined;

  beforeEach(() => {
    frameCallback = undefined;
    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => {
      frameCallback = callback;
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('measures afterOthers jobs only after the other jobs have applied', () => {
    const steps: Array<string> = [];
    // Späte Aufträge stehen bewusst zuerst in der Warteschlange
    scheduleLayoutJob({}, {
      measure: () => steps.push('late measure'),
      apply: () => steps.push('late apply'),
      afterOthers: true,
    });
    scheduleLayoutJob({}, {
      prepare: () => steps.push('early prepare'),
      measure: () => steps.push('early measure'),
      apply: () => steps.push('early apply'),
    });
    frameCallback?.(0);
    expect(steps).deep.eq(['early prepare', 'early measure', 'early apply', 'late measure', 'late apply']);
  });

  it('keeps batching when requestAnimationFrame runs the callback synchronously', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => {
      callback(0);
      return 0;
    });
    const steps: Array<string> = [];
    scheduleLayoutJob({}, {measure: () => steps.push('first'), apply: () => {}});
    scheduleLayoutJob({}, {measure: () => steps.push('second'), apply: () => {}});
    expect(steps).deep.eq(['first', 'second']);
  });
});
