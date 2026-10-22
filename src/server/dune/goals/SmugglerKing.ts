import {BaseMilestone} from '../../milestones/IMilestone';
import {IPlayer} from '../../IPlayer';

// Milestone of the smuggling module (common/dune/duneGoals.ts): smuggling deals made (Smuggling.ts counts)
export class SmugglerKing extends BaseMilestone {
  constructor() {
    super(
      'Smuggler King',
      'Make 3 smuggling deals',
      3);
  }

  public getScore(player: IPlayer): number {
    return player.game.duneData?.smuggling?.deals?.[player.id] ?? 0;
  }
}
