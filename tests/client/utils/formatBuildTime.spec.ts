import {expect} from 'chai';
import {formatBuildTime} from '@/client/utils/formatBuildTime';

describe('formatBuildTime', () => {
  it('formats as day.month.year @ time', () => {
    expect(formatBuildTime(new Date(2026, 9, 2, 11, 19, 27).toString())).eq('02.10.2026 @ 11:19:27');
  });

  it('keeps unreadable values', () => {
    expect(formatBuildTime('unknown')).eq('unknown');
  });
});
