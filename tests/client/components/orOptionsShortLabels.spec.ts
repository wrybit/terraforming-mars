import {expect} from 'chai';
import {optionTone, tabButtonCentered, tabDisplayOrder, tabHighlighted} from '@/client/components/orOptionsShortLabels';
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

  it('colors trade and delegate tabs and puts them right before pass/end', () => {
    expect(optionTone({type: 'and', title: 'Trade with a colony tile', buttonLabel: 'Trade'} as PlayerInputModel)).eq('colonies');
    expect(optionTone({type: 'party', title: 'Send a delegate in an area (from lobby)', buttonLabel: 'Send'} as PlayerInputModel)).eq('colonies');
    const titles = ['Pass for this generation', 'Trade with a colony tile', 'Play project card', 'Send a delegate in an area (5 M€)', 'End Turn', 'Standard projects'];
    expect(tabDisplayOrder(titles)).deep.eq([2, 5, 1, 3, 4, 0]);
  });

  it('colors milestone, award, standard project and sell tabs dark yellow', () => {
    expect(optionTone({type: 'or', title: 'Claim a milestone', buttonLabel: 'Claim'} as PlayerInputModel)).eq('gold');
    expect(optionTone({type: 'or', title: {message: 'Fund an award (${0} M€)', data: []}, buttonLabel: 'Fund'} as unknown as PlayerInputModel)).eq('gold');
    expect(optionTone({type: 'projectCard', title: 'Standard projects', buttonLabel: 'Confirm'} as PlayerInputModel)).eq('gold');
    expect(optionTone({type: 'card', title: 'Sell patents', buttonLabel: 'Sell'} as PlayerInputModel)).eq('gold');
  });
});
