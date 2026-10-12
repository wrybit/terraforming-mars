import {expect} from 'chai';
import {durationToMilliseconds} from '../../src/server/utils/durations';
import {sessionDurationMilliseconds} from '../../src/server/server/auth/sessionDuration';

describe('durations', () => {
  it('sanity', () => {
    expect(durationToMilliseconds('10s')).eq(10_000);
    expect(durationToMilliseconds('4m')).eq(240_000);
    expect(durationToMilliseconds('4m0s')).eq(240_000);
    expect(durationToMilliseconds('4m10s')).eq(250_000);
    expect(durationToMilliseconds('1234s')).eq(1234_000);
    expect(durationToMilliseconds('2h5m')).eq(7500_000);
    expect(durationToMilliseconds('2h')).eq(7_200_000);
    expect(durationToMilliseconds('2H')).eq(7_200_000);
    expect(durationToMilliseconds('2h1m')).eq(7_260_000);
    expect(durationToMilliseconds('2h1m40s')).eq(7_300_000);
    expect(durationToMilliseconds('2h1m33s')).eq(7_293_000);
    expect(durationToMilliseconds('30d')).eq(30 * 86_400_000);
    expect(durationToMilliseconds('1d12h')).eq(129_600_000);
  });

  it('login duration falls back to 30 days', () => {
    expect(sessionDurationMilliseconds(undefined)).eq(30 * 86_400_000);
    expect(sessionDurationMilliseconds('nonsense')).eq(30 * 86_400_000);
    expect(sessionDurationMilliseconds('12h')).eq(43_200_000);
  });

  it('error cases', () => {
    expect(durationToMilliseconds('')).is.NaN;
    expect(durationToMilliseconds(undefined as unknown as string)).is.NaN;
    expect(durationToMilliseconds('1234ss')).is.NaN;
    expect(durationToMilliseconds('1234q')).is.NaN;
    expect(durationToMilliseconds('2s1m33h')).is.NaN;
  });
});
