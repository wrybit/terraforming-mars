import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {IProjectCard} from '../cards/IProjectCard';
import {CardName} from '../../common/cards/CardName';
import {pickSome} from './randomChoice';
import {tuningOf} from './aiTuning';

// The "later" value of a card plays a guessed future tableau on a game copy first (cardValue.ts). That guess
// used random deck cards only, so a card whose production grows with own tags (Gyropolis, Medical Lab, Cloud
// Tourism …) never saw the tags already waiting in the own hand. Against humans the AI gains far less late
// production from such cards (from generation 8: 11.9 vs 31.6 M€ production from cards, incomeGap.py).

/**
 * futureTableauCards: `count` cards standing for what the player will still play – a share
 * (aiTuning.ts futureHandShare) from the own hand without the valued card, the rest from the deck.
 */
export function futureTableauCards(copy: IGame, copyPlayer: IPlayer, count: number, valued: CardName): Array<IProjectCard> {
  const share = tuningOf(copyPlayer).futureHandShare;
  const hand = share > 0 ? copyPlayer.cardsInHand.filter((card) => card.name !== valued) : [];
  const fromHand = pickSome(Math.random, hand, Math.min(hand.length, Math.round(share * count)));
  return [...fromHand, ...pickSome(Math.random, copy.projectDeck.drawPile, count - fromHand.length)];
}
