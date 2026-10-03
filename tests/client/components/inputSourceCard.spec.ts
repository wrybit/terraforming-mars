import {expect} from 'chai';
import {cardDescriptionText, inputSourceCard, isGenericTitle, optionSourceCard} from '@/client/components/inputSourceCard';
import {CardName} from '@/common/cards/CardName';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';

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

  it('finds the card of a content-free option in its title data', () => {
    const corporationAction: PlayerInputModel = {
      type: 'option',
      title: {message: 'Take first action of ${0} corporation', data: [{type: LogMessageDataType.CARD, value: CardName.THARSIS_REPUBLIC}]},
      buttonLabel: 'Place a city tile',
    };
    expect(optionSourceCard(corporationAction)).eq(CardName.THARSIS_REPUBLIC);
    expect(optionSourceCard(input('Convert 8 heat into temperature'))).is.undefined;
  });
});
