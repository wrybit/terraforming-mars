import {BaseMilestone} from '../../milestones/IMilestone';
import {IPlayer} from '../../IPlayer';

// Milestone of the bazaar module (common/dune/duneGoals.ts): wares bought at the Bazaar of Arrakeen (Bazaar.ts counts)
export class BazaarRegular extends BaseMilestone {
  constructor() {
    super(
      'Bazaar Regular',
      'Buy 3 wares at the Bazaar of Arrakeen',
      3);
  }

  public getScore(player: IPlayer): number {
    return player.game.duneData?.bazaar?.purchases?.[player.id] ?? 0;
  }
}
