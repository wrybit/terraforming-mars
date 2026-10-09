import {expect} from 'chai';
import {resultGains} from '@/client/components/choiceResultGains';

describe('choiceResultGains', () => {
  it('temperature in °C, two per step', () => {
    expect(resultGains('Remove 2 microbes to raise temperature 1 step')).deep.eq([{kind: 'temperature', label: '+2 °C'}]);
  });

  it('oxygen, Venus and TR', () => {
    expect(resultGains('Spend 3 energy to raise oxygen 1 step.')).deep.eq([{kind: 'oxygen', label: '+1 %'}]);
    expect(resultGains('Remove 2 floaters to raise Venus 1 step')).deep.eq([{kind: 'venus', label: '+2 %'}]);
    expect(resultGains('Remove 3 microbes to increase your terraform rating 1 step')).deep.eq([{kind: 'tr', label: '+1'}]);
  });

  it('keeps title order for alternatives', () => {
    expect(resultGains('Remove 3 floaters from this card to raise Venus 1 step or raise oxygen 1 step').map((gain) => gain.kind)).deep.eq(['venus', 'oxygen']);
  });

  it('ocean and cards', () => {
    expect(resultGains('Remove 1 asteroid here to place an ocean')).deep.eq([{kind: 'ocean', label: '+1'}]);
    expect(resultGains('Remove a science resource from this card to draw a card')).deep.eq([{kind: 'card', label: '+1'}]);
  });

  it('nothing for plain resource options', () => {
    expect(resultGains('Add 1 microbe to this card')).is.empty;
    expect(resultGains('Do not remove plants')).is.empty;
  });
});
