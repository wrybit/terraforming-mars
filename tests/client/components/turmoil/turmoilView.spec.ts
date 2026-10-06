import {expect} from 'chai';
import {PartyName} from '@/common/turmoil/PartyName';
import {delegateForecast, seatedDelegates} from '@/client/components/turmoil/turmoilView';
import {fakeTurmoil} from './turmoilFixtures';

describe('turmoilView', () => {
  it('seats all delegates except the leader', () => {
    const reds = fakeTurmoil().parties.find((party) => party.name === PartyName.REDS)!;
    expect(seatedDelegates(reds)).deep.eq(['neutral']);
  });

  it('forecasts leadership, dominance and influence of a new delegate', () => {
    const turmoil = fakeTurmoil();
    // Empty Unity: you lead it, but 1 delegate does not beat the Reds' 2
    expect(delegateForecast(turmoil, PartyName.UNITY, 'blue')).deep.eq({becomesLeader: true, becomesDominant: false, influenceGain: 0});
    // Greens (red leads with 1): a second red delegate makes it dominant (2 > 2? no) – equal stays Reds
    expect(delegateForecast(turmoil, PartyName.GREENS, 'red').becomesDominant).is.false;
    // Reds already dominant: blue joins with one delegate there → +1 influence
    expect(delegateForecast(turmoil, PartyName.REDS, 'blue')).deep.eq({becomesLeader: false, becomesDominant: false, influenceGain: 1});
  });
});
