// DevTools: a project card into the hand (then it is played by the normal rules) or straight into play without its
// effect (to look at a tableau), in the log
import {IPlayer} from '../IPlayer';
import {newProjectCard} from '../createCard';
import {DevToolsCardAction} from '../../common/devtools/devToolsAction';
import {RouteError} from '../routes/RouteError';

export function applyCard(player: IPlayer, action: DevToolsCardAction): void {
  const card = newProjectCard(action.card);
  if (card === undefined) {
    throw RouteError.badRequest('Unknown project card');
  }
  if (action.to === 'hand') {
    player.cardsInHand.push(card);
    player.game.log('🛠 DevTools: ${0} got ${1} into the hand', (b) => b.player(player).card(card));
  } else {
    player.playedCards.push(card);
    player.game.log('🛠 DevTools: ${0} got ${1} into play without its effect', (b) => b.player(player).card(card));
  }
}
