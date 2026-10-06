import {expect} from 'chai';
import {partyChoice} from '@/client/components/turmoil/partyChoice';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PartyName} from '@/common/turmoil/PartyName';

const option = (title: string) => ({type: 'option', title, buttonLabel: 'Select'} as PlayerInputModel);

describe('partyChoice', () => {
  it('reads a ruling party choice (The New Space Race)', () => {
    const cards = partyChoice(Object.values(PartyName).map(option));
    expect(cards?.map((card) => card.party)).deep.eq(Object.values(PartyName));
    expect(cards?.every((card) => !card.stays)).is.true;
  });

  it('maps "Do not move" to the delegate\'s current party', () => {
    const titles = [PartyName.MARS, 'Do not move', PartyName.UNITY, PartyName.KELVINISTS, PartyName.REDS, PartyName.GREENS];
    const cards = partyChoice(titles.map(option));
    expect(cards?.[1]).deep.include({index: 1, party: PartyName.SCIENTISTS, stays: true});
  });

  it('reads bonus and policy of an allied party (Mars Frontier Alliance)', () => {
    const cards = partyChoice([
      option('[Reds] - Bonus: Lose 1 TR -  Policy: Pay 3 M€ per step'),
      option('[Unity] - Bonus: Gain 1 M€ per tag -  Policy: Titanium worth 1 more'),
    ]);
    expect(cards?.[0]).deep.include({party: PartyName.REDS, bonusText: 'Lose 1 TR', policyText: 'Pay 3 M€ per step'});
  });

  it('ignores other choices', () => {
    expect(partyChoice([option('Reds'), option('Gain 3 plants')])).is.undefined;
    expect(partyChoice([option('Reds')])).is.undefined;
  });
});
