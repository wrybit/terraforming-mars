import {expect} from 'chai';
import {relativeTimeText} from '@/client/utils/relativeTime';

describe('relativeTime', () => {
  const now = Date.UTC(2026, 10, 7, 18);
  const minutes = (count: number) => now - count * 60 * 1000;

  it('minutes, then hours, from two days on days', () => {
    expect(relativeTimeText(minutes(12), now, 'en')).eq('12 min. ago');
    expect(relativeTimeText(minutes(3 * 60 + 20), now, 'en')).eq('3 hr. ago');
    expect(relativeTimeText(minutes(47 * 60), now, 'en')).eq('47 hr. ago');
    expect(relativeTimeText(minutes(3 * 24 * 60), now, 'en')).eq('3 days ago');
  });

  it('in the viewer language', () => {
    expect(relativeTimeText(minutes(3 * 60), now, 'de')).eq('vor 3 Std.');
  });

  it('a server clock ahead of the browser shows "now", not the future', () => {
    expect(relativeTimeText(now + 5000, now, 'en')).eq('this minute');
  });
});
