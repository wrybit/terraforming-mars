import {expect} from 'chai';
import {draftedCardsInInput, showsDraftedCardsBlock} from '@/client/utils/draftedCards';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {CardName} from '@/common/cards/CardName';
import {asComplete} from '../components/utils/models';

function view(waitingFor: PlayerInputModel | undefined, drafted: Array<CardName>): PlayerViewModel {
  return asComplete<PlayerViewModel>({waitingFor, draftedCards: drafted.map((name) => asComplete<CardModel>({name}))});
}

describe('draftedCards', () => {
  const draft = asComplete<PlayerInputModel>({type: 'card', title: 'Select a card to keep and pass the rest to ${0}'});

  it('moves kept cards into the draft tab while a card is to be chosen', () => {
    expect(draftedCardsInInput(view(draft, [CardName.MOSS]))).length(1);
    expect(showsDraftedCardsBlock(view(draft, [CardName.MOSS]))).is.false;
  });

  it('keeps the separate block while waiting for the others', () => {
    expect(draftedCardsInInput(view(undefined, [CardName.MOSS]))).length(0);
    expect(showsDraftedCardsBlock(view(undefined, [CardName.MOSS]))).is.true;
    expect(showsDraftedCardsBlock(view(undefined, []))).is.false;
  });
});
