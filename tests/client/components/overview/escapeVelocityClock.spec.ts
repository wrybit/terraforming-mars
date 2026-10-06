import {expect} from 'chai';
import {clockText, escapeVelocityState} from '@/client/components/overview/escapeVelocityClock';

const options = {thresholdMinutes: 30, bonusSectionsPerAction: 0, penaltyPeriodMinutes: 2, penaltyVPPerPeriod: 1};

describe('escapeVelocityClock', () => {
  it('is within the limit', () => {
    const state = escapeVelocityState(15 * 60_000, 0, options);
    expect(state).deep.include({over: false, penalty: 0, share: 0.5});
  });

  it('counts the penalty per started period like the server', () => {
    const state = escapeVelocityState((34 * 60 + 10) * 1000, 0, options);
    expect(state.over).is.true;
    expect(state.penalty).eq(2);
  });

  it('gives bonus seconds per action', () => {
    expect(escapeVelocityState(0, 60, {...options, bonusSectionsPerAction: 30}).limitMs).eq(60 * 60_000);
  });

  it('formats the clock', () => {
    expect(clockText((34 * 60 + 10) * 1000)).eq('34:10');
    expect(clockText((3600 + 5) * 1000)).eq('1:00:05');
  });
});
