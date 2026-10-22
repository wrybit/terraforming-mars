import {BaseMilestone} from '../../milestones/IMilestone';
import {IPlayer} from '../../IPlayer';

// Milestone of the CHOAM module (common/dune/duneGoals.ts): contracts closed, as buyer or as seller (Choam.ts counts)
export class ChoamPartner extends BaseMilestone {
  constructor() {
    super(
      'CHOAM Partner',
      'Close 2 CHOAM contracts',
      2);
  }

  public getScore(player: IPlayer): number {
    return player.game.duneData?.choam?.deals?.[player.id] ?? 0;
  }
}
