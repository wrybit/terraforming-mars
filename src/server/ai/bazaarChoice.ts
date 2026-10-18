import {IPlayer} from '../IPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {InputResponse} from '../../common/inputs/InputResponse';
import {playerView, withCopy} from './gameCopy';
import {relativeValue, valuationContext} from './stateValue';
import {handCardValues} from './cardValue';
import {buyInput} from '../dune/Bazaar';

// Dune expansion, bazaar of Arrakeen (dune/Bazaar.ts): which ware to buy, or none. Each choice – "buy nothing"
// included – is tried on a copy of the game and valued like a move, so the price is weighed against what the
// goods are worth to this player right now (a water ware is little use without a heat engine).

/** The best bazaar choice, or undefined when no choice could be tried. */
export function chooseBazaarWare(input: OrOptions, player: IPlayer): InputResponse | undefined {
  const snapshot = playerView(player);
  const frozen = valuationContext(player.game, player);
  let best: {response: InputResponse, value: number} | undefined;
  input.options.forEach((_option, index) => {
    const response: InputResponse = {type: 'or', index, response: {type: 'option'}};
    const value = withCopy(snapshot, (copy): number | undefined => {
      const copyPlayer = copy.getPlayerById(player.id);
      const bazaar = copy.duneData?.bazaar;
      const menu = bazaar === undefined ? undefined : buyInput(copyPlayer, bazaar);
      if (menu === undefined || menu.options.length !== input.options.length) {
        return undefined;
      }
      try {
        menu.process(response, copyPlayer);
      } catch {
        return undefined;
      }
      return relativeValue(copyPlayer, {...frozen, handValues: handCardValues(copyPlayer), handOwner: copyPlayer.id});
    });
    if (value !== undefined && (best === undefined || value > best.value)) {
      best = {response, value};
    }
  });
  return best?.response;
}
