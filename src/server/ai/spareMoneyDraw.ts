import {IPlayer} from '../IPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {InputResponse} from '../../common/inputs/InputResponse';
import {CardName} from '../../common/cards/CardName';
import {tuningOf} from './aiTuning';
import {drawnCardValue, immediateDraws} from './drawPriority';
import {cardsDrawnByAction} from './stateValue';
import {remainingProductionPhases} from './gameProgress';

// About 130 M€ per game stay unused at the end of generations, for the AI and for humans alike, but the AI spends
// 95 M€ on standard projects (humans 56) and draws 8.1 cards outside the research phase (humans 28.9). When no hand
// card can be played, the rest of the money either waits or goes into a standard project; a draw action or a draw card
// turns it into cards that can be played next – what humans do. Only then (no playable hand card) the draw move gets
// the value of the cards it draws, so it wins over passing.

const ACTION_TITLE = 'Perform an action from a played card';

function titleOf(option: {title: string | {message: string}}): string {
  return typeof option.title === 'string' ? option.title : option.title.message;
}

/** Cards a move draws: a hand card that draws when played, or a card action that draws. 0 otherwise. */
export function cardsDrawnByMove(player: IPlayer, menu: OrOptions, response: InputResponse): number {
  if (response.type !== 'or') {
    return 0;
  }
  const inner = response.response;
  if (inner.type === 'projectCard') {
    const card = player.cardsInHand.find((handCard) => handCard.name === inner.card);
    return card === undefined ? 0 : immediateDraws(card);
  }
  const option = menu.options[response.index];
  if (option !== undefined && titleOf(option) === ACTION_TITLE && inner.type === 'card' && inner.cards.length === 1) {
    const card = player.playedCards.get(inner.cards[0] as CardName);
    return card === undefined ? 0 : cardsDrawnByAction(card);
  }
  return 0;
}

/**
 * M€ added to a draw move when no hand card is playable: spareMoneyDraw × cards drawn × value of a drawn card.
 * 0 when the rule is off or a hand card can be played.
 */
export function spareMoneyDrawBonus(player: IPlayer, menu: OrOptions, response: InputResponse, handCardPlayable: boolean): number {
  const weight = tuningOf(player).spareMoneyDraw;
  if (weight <= 0 || handCardPlayable) {
    return 0;
  }
  const draws = cardsDrawnByMove(player, menu, response);
  return draws > 0 ? weight * draws * drawnCardValue(player, remainingProductionPhases(player.game, player)) : 0;
}
