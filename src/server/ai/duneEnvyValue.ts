import {IPlayer} from '../IPlayer';
import {suspicionPenalty} from '../../common/dune/DuneModel';
import {suspicionOf} from '../dune/Smuggling';
import {registerValueExtension} from './valueExtensions';
import {duneTuningOf} from './duneTuning';

// CHOAM envy (dune/Smuggling.ts): every CHOAM move raises the envy of the great houses; from 3 on the houses vote
// against the player at the end of the generation and take TR. The move search only sees the envy, not the vote that
// follows, so the TR the current envy will cost counts against the position (envyAversion of that TR).

/** M€ the current envy of `player` will cost at the end of the generation; 0 without CHOAM or below the costly level. */
export function envyCost(player: IPlayer, terraformRatingValue: number): number {
  const weight = duneTuningOf(player).envyAversion;
  const data = player.game.duneData?.smuggling;
  if (weight <= 0 || data === undefined) {
    return 0;
  }
  return weight * suspicionPenalty(suspicionOf(data, player)) * terraformRatingValue;
}

registerValueExtension((player, prices) => -envyCost(player, prices.terraformRating));
