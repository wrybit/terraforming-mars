import {expect} from 'chai';
import {cardDescriptionText, inputSourceCard, isGenericTitle} from '@/client/components/inputSourceCard';
import {CardName} from '@/common/cards/CardName';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

function input(title: string, sourceCard?: CardName): PlayerInputModel {
  return {type: 'option', title, buttonLabel: '', sourceCard};
}

describe('inputSourceCard', () => {
  it('prefers the card sent by the server', () => {
    expect(inputSourceCard(input('Select one option', CardName.SABOTAGE))).eq(CardName.SABOTAGE);
  });

  it('finds the card named in the title', () => {
    expect(inputSourceCard(input('Select an option for Olympus Conference'))).eq(CardName.OLYMPUS_CONFERENCE);
    expect(inputSourceCard(input('Select player'))).is.undefined;
  });

  it('finds the card text', () => {
    expect(cardDescriptionText(CardName.OLYMPUS_CONFERENCE)).contains('science tag');
  });

  it('tells generic questions apart', () => {
    expect(isGenericTitle('Select one option')).is.true;
    expect(isGenericTitle('Select an option for Olympus Conference')).is.true;
    expect(isGenericTitle('Select player to remove up to 4 M€ from')).is.false;
  });
});
