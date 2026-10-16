import {expect} from 'chai';
import {afterEach, beforeEach, vi} from 'vitest';
import type {scheduleLayoutJob as ScheduleLayoutJob} from '@/client/utils/layoutBatch';

describe('layoutBatch', () => {
  let frameCallback: ((time: number) => void) | undefined;
  let scheduleLayoutJob: typeof ScheduleLayoutJob;

  beforeEach(async () => {
    // Tests share one module registry (isolate: false): other components may have left a pending
    // frame in layoutBatch's module state. Load a fresh copy so this test controls the frame.
    vi.resetModules();
    ({scheduleLayoutJob} = await import('@/client/utils/layoutBatch'));
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
});
