import {expect} from 'chai';
import {currentDraftPicks, draftedCardsInInput, isDraftRepick, showsDraftedCardsBlock} from '@/client/utils/draftedCards';
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

  it('treats the pick of the current round as part of the choice, not as a kept card', () => {
    const repick = asComplete<PlayerInputModel>({
      type: 'card',
      optional: true,
      title: 'You can change your selection until all players have selected a card. Passing to ${0}',
      cards: [CardName.MOSS, CardName.SOLAR_WIND_POWER].map((name) => asComplete<CardModel>({name})),
    });
    const playerView = view(repick, [CardName.ALGAE, CardName.MOSS]);
    expect(Array.from(currentDraftPicks(playerView, repick))).deep.eq([CardName.MOSS]);
    expect(draftedCardsInInput(playerView).map((card) => card.name)).deep.eq([CardName.ALGAE]);
    expect(isDraftRepick(playerView, repick)).is.true;
    expect(isDraftRepick(view(draft, [CardName.MOSS]), draft)).is.false;
  });
});
