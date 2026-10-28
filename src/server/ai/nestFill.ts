import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {tuningOf} from './aiTuning';

// A free spot next to two or more own greeneries is a "nest": whoever puts a city there scores every one of those
// greeneries. In games against people the AI leaves 1.6–1.9 such nests per game to the opponent (people 1.2), and
// people place cities on 2–3 foreign greeneries on purpose. Avoiding greeneries (nest guard) cost points, so this
// variant fills the nest itself: the own city there scores the greeneries anyway, and the bonus counts what the
// opponent would have taken – the points the opponent no longer gets.

/** Own greeneries around a spot from which on it counts as a nest. */
const NEST_SIZE = 2;

/** Own greeneries next to the space. */
function ownGreeneriesAround(space: Space, player: IPlayer): number {
  return player.game.board.getAdjacentSpaces(space)
    .filter((neighbour) => Board.isGreenerySpace(neighbour) && neighbour.player === player).length;
}

/** VP to add for an own city on a nest of own greeneries (the points an opponent city there would score). */
export function nestFillBonus(space: Space, player: IPlayer): number {
  const weight = tuningOf(player).nestFill;
  if (weight <= 0 || player.opponents.length === 0) {
    return 0;
  }
  const greeneries = ownGreeneriesAround(space, player);
  return greeneries >= NEST_SIZE ? weight * greeneries : 0;
}
