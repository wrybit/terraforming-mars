import {expect} from 'chai';
import {cardResourceCount, cardResourceEffect} from '@/client/components/cardResourceEffect';
import {CardResource} from '@/common/CardResource';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';

describe('cardResourceEffect', () => {
  const source = CardName.NITRITE_REDUCING_BACTERIA;

  it('reads adding to this card', () => {
    expect(cardResourceEffect('Add 1 microbe to this card', source)).deep.eq({
      resource: CardResource.MICROBE, direction: 'gain', amount: 1, card: source,
    });
  });

  it('takes the first verb: removing to gain something else is a loss on the card', () => {
    const effect = cardResourceEffect('Remove 3 microbes to increase your terraform rating 1 step', source);
    expect(effect?.direction).eq('loss');
    expect(effect?.amount).eq(3);
  });

  it('takes the card from the title parameter', () => {
    const title: Message = {
      message: 'Add ${0} floaters to ${1}',
      data: [{type: LogMessageDataType.RAW_STRING, value: '2'}, {type: LogMessageDataType.CARD, value: CardName.DIRIGIBLES}],
    };
    expect(cardResourceEffect(title)).deep.eq({resource: CardResource.FLOATER, direction: 'gain', amount: 2, card: CardName.DIRIGIBLES});
  });

  it('only takes the amount written in front of the resource', () => {
    const sulphur = cardResourceEffect('Remove any number of microbes to gain 3 M€ per microbe removed', CardName.SULPHUR_EATING_BACTERIA);
    expect(sulphur?.amount).is.undefined;
    expect(sulphur?.direction).eq('loss');
    expect(cardResourceEffect('Add a microbe to this card')?.amount).eq(1);
  });

  it('leaves the card open for a card still to be chosen', () => {
    expect(cardResourceEffect('Add 2 animals to a card', CardName.IMPORTED_HYDROGEN)?.card).is.undefined;
    expect(cardResourceEffect('Remove 3 microbes to increase your terraform rating 1 step', source)?.card).eq(source);
  });

  it('ignores titles without card resources and card names in placeholders', () => {
    expect(cardResourceEffect('Increase steel production 1 step')).is.undefined;
    expect(cardResourceEffect({message: 'Play ${0}', data: [{type: LogMessageDataType.CARD, value: CardName.ASTEROID}]})).is.undefined;
  });

  it('counts the resources on the card before and after, never below 0', () => {
    const tableau = [{name: source, resources: 2} as CardModel];
    expect(cardResourceCount({resource: CardResource.MICROBE, direction: 'gain', amount: 1, card: source}, tableau)).deep.eq({before: 2, after: 3});
    expect(cardResourceCount({resource: CardResource.MICROBE, direction: 'loss', amount: 3, card: source}, tableau)).deep.eq({before: 2, after: 0});
    expect(cardResourceCount({resource: CardResource.MICROBE, card: CardName.DIRIGIBLES}, tableau)).is.undefined;
  });
});
