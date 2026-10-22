import {BaseMilestone} from '../../milestones/IMilestone';
import {IPlayer} from '../../IPlayer';

// Milestone of the Kanly module (common/dune/duneGoals.ts): Sardaukar in the garrison and on the war field together
export class SardaukarCommander extends BaseMilestone {
  constructor() {
    super(
      'Sardaukar Commander',
      'Have 3 Sardaukar in your garrison and on the war field',
      3);
  }

  public getScore(player: IPlayer): number {
    const kanly = player.game.duneData?.kanly;
    if (kanly === undefined) {
      return 0;
    }
    return (kanly.garrison[player.id] ?? 0) + (kanly.battle?.troops[player.id] ?? 0);
  }
}
