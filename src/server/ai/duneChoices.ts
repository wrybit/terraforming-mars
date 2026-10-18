import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {InputResponse} from '../../common/inputs/InputResponse';
import {playerView, withCopy} from './gameCopy';
import {relativeValue, valuationContext} from './stateValue';
import {handCardValues} from './cardValue';
import {buyInput} from '../dune/Bazaar';
import {distanceInput} from '../dune/Worm';

// Dune expansion (dune/DuneExpansion.ts): choices of its modules. Each option – "buy nothing" included – is tried
// on a copy of the game and valued like a move (relativeValue: own position against the others), so a ware is
// weighed against what its goods are worth to this player, and the worm goes where it hurts the leader most.

/** Rebuilds the same choice inside the copy; undefined when it does not exist there */
type RebuildChoice = (copy: IGame, copyPlayer: IPlayer) => OrOptions | undefined;

/** The best option of `input`, or undefined when no option could be tried. */
export function chooseByCopy(input: OrOptions, player: IPlayer, rebuild: RebuildChoice): InputResponse | undefined {
  const snapshot = playerView(player);
  const frozen = valuationContext(player.game, player);
  let best: {response: InputResponse, value: number} | undefined;
  input.options.forEach((_option, index) => {
    const response: InputResponse = {type: 'or', index, response: {type: 'option'}};
    const value = withCopy(snapshot, (copy): number | undefined => {
      const copyPlayer = copy.getPlayerById(player.id);
      const menu = rebuild(copy, copyPlayer);
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

export function chooseBazaarWare(input: OrOptions, player: IPlayer): InputResponse | undefined {
  return chooseByCopy(input, player, (copy, copyPlayer) => {
    const bazaar = copy.duneData?.bazaar;
    return bazaar === undefined ? undefined : buyInput(copyPlayer, bazaar);
  });
}

export function chooseWormDistance(input: OrOptions, player: IPlayer): InputResponse | undefined {
  return chooseByCopy(input, player, (copy) => {
    const worm = copy.duneData?.worm;
    return worm === undefined ? undefined : distanceInput(copy, worm);
  });
}
