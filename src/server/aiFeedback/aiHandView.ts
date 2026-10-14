import {IPlayer} from '../IPlayer';
import {CardModel} from '../../common/models/CardModel';
import {AiHandModel} from '../../common/models/PlayerModel';
import {cardsToModel} from '../models/ModelUtils';
import {purchaseStillOpen} from './aiLogLines';

/**
 * Hand cards of an AI player for the analysis game: everyone may check whether it could have played a better card.
 * While the reader still buys his own cards the hand stays hidden – it already holds what the AI bought.
 * `reader` undefined = spectator, sees everything.
 */
export function aiHandOf(player: IPlayer, reader: IPlayer | undefined): AiHandModel | undefined {
  if (player.game.gameOptions.aiAnalysis !== true || player.aiLevel === undefined) {
    return undefined;
  }
  if (reader !== undefined && reader !== player && purchaseStillOpen(player.game, reader)) {
    return {cards: [], hidden: true};
  }
  const cards: ReadonlyArray<CardModel> = cardsToModel(player, [...player.preludeCardsInHand, ...Array.from(player.ceoCardsInHand), ...player.cardsInHand], {showCalculatedCost: true});
  return {cards, hidden: false};
}
