import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {unplayableHandCards} from '@/client/utils/playableCards';

const playerView = {
  cardsInHand: [{name: CardName.ANTS}, {name: CardName.BIRDS}, {name: CardName.MOSS}],
} as unknown as PlayerViewModel;

function input(title: string, cards: Array<CardName>): PlayerInputModel {
  return {type: 'projectCard', title, cards: cards.map((name) => ({name}))} as unknown as PlayerInputModel;
}

describe('playableCards', () => {
  it('lists the hand cards the build tab does not offer', () => {
    const cards = unplayableHandCards(playerView, input('Play project card', [CardName.BIRDS]));
    expect(cards.map((card) => card.name)).deep.eq([CardName.ANTS, CardName.MOSS]);
  });

  it('lists nothing for card effects with their own choice', () => {
    expect(unplayableHandCards(playerView, input('Select a card to discard', [CardName.BIRDS]))).deep.eq([]);
    // Odyssey: events from the tableau, not from the hand
    expect(unplayableHandCards(playerView, input('Play project card', [CardName.COMET]))).deep.eq([]);
  });
});
