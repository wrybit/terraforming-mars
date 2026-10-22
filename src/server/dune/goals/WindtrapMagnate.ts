import {IAward} from '../../awards/IAward';
import {IPlayer} from '../../IPlayer';

// Goals module of the Dune expansion (common/dune/duneGoals.ts): the highest moisture production
export class WindtrapMagnate implements IAward {
  public readonly name = 'Windtrap Magnate';
  public readonly description = 'Have the highest energy production';

  public getScore(player: IPlayer): number {
    return player.production.energy;
  }
}
