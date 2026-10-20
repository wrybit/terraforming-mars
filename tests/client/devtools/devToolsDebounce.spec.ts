import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {KeyedDebounce} from '@/client/devtools/devToolsDebounce';

describe('KeyedDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends only the last value once the control rests', () => {
    const debounce = new KeyedDebounce(1000);
    const sent: Array<number> = [];
    debounce.schedule('fill', () => sent.push(10));
    vi.advanceTimersByTime(600);
    debounce.schedule('fill', () => sent.push(20));
    vi.advanceTimersByTime(600);
    expect(sent).toEqual([]);
    expect(debounce.isPending('fill')).toBe(true);
    vi.advanceTimersByTime(400);
    expect(sent).toEqual([20]);
    expect(debounce.isPending('fill')).toBe(false);
  });

  it('keeps one timer per control', () => {
    const debounce = new KeyedDebounce(1000);
    const sent: Array<string> = [];
    debounce.schedule('fill', () => sent.push('fill'));
    vi.advanceTimersByTime(500);
    debounce.schedule('oceans', () => sent.push('oceans'));
    vi.advanceTimersByTime(500);
    expect(sent).toEqual(['fill']);
    vi.advanceTimersByTime(500);
    expect(sent).toEqual(['fill', 'oceans']);
  });

  it('sends what is still waiting when flushed', () => {
    const debounce = new KeyedDebounce(1000);
    const sent: Array<string> = [];
    debounce.schedule('theme', () => sent.push('theme'));
    debounce.flushAll();
    expect(sent).toEqual(['theme']);
    vi.advanceTimersByTime(2000);
    expect(sent).toEqual(['theme']);
  });
});
