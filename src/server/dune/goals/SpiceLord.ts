import {BaseMilestone} from '../../milestones/IMilestone';
import {IPlayer} from '../../IPlayer';

// Goals module of the Dune expansion (common/dune/duneGoals.ts): the mockup's "Spice Baron", 3 spice production
export class SpiceLord extends BaseMilestone {
  constructor() {
    super(
      'Spice Lord',
      'Have 3 titanium production',
      3);
  }

  public getScore(player: IPlayer): number {
    return player.production.titanium;
  }
}
