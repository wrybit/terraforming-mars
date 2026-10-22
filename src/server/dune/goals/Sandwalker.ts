import {BaseMilestone} from '../../milestones/IMilestone';
import {IPlayer} from '../../IPlayer';
import {Board} from '../../boards/Board';

// Milestone of the worm module (common/dune/duneGoals.ts): living right next to Shai-Hulud, where its levies hit
export class Sandwalker extends BaseMilestone {
  constructor() {
    super(
      'Sandwalker',
      'Own 2 tiles next to the worm',
      2);
  }

  public getScore(player: IPlayer): number {
    const worm = player.game.duneData?.worm;
    if (worm === undefined) {
      return 0;
    }
    const board = player.game.board;
    return board.getAdjacentSpaces(board.getSpaceOrThrow(worm.spaceId))
      .filter((space) => space.player?.id === player.id && Board.hasRealTile(space)).length;
  }
}
