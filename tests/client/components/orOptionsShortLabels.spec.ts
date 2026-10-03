import {expect} from 'chai';
import {optionTone, tabButtonCentered, tabHighlighted} from '@/client/components/orOptionsShortLabels';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

function option(title: string, buttonLabel: string): PlayerInputModel {
  return {type: 'option', title, buttonLabel};
}

describe('orOptionsShortLabels', () => {
  it('highlights milestone, greenery and temperature tabs', () => {
    expect(tabHighlighted('Claim a milestone')).is.true;
    expect(tabHighlighted({message: 'Convert ${0} plants into greenery', data: []})).is.true;
    expect(tabHighlighted('Convert 8 heat into temperature')).is.true;
    expect(tabHighlighted('Convert 6 heat into temperature')).is.true;
  });

  it('does not highlight other tabs', () => {
    expect(tabHighlighted('Standard projects')).is.false;
    expect(tabHighlighted('Play project card')).is.false;
  });

  it('centers the button of every content-free option except pass/end', () => {
    expect(tabButtonCentered(option('Take first action of ${0} corporation', 'Place a city tile'))).is.true;
    expect(tabButtonCentered(option('Convert 8 heat into temperature', 'Convert heat'))).is.true;
    expect(tabButtonCentered(option('End Turn', 'Pass'))).is.false;
    expect(tabButtonCentered({type: 'space', title: 'Select space for city tile', buttonLabel: '', spaces: []} as PlayerInputModel)).is.false;
  });

  it('colors a content-free option like the tile its button places', () => {
    expect(optionTone(option('Take first action of ${0} corporation', 'Place a city tile'))).eq('city');
    expect(optionTone(option('Take first action of ${0} corporation', 'Place an ocean tile'))).eq('ocean');
    expect(optionTone(option('Convert 8 heat into temperature', 'Convert heat'))).eq('heat');
    expect(optionTone(option('Take first action of ${0} corporation', 'Fund an award for free'))).is.undefined;
  });
});
