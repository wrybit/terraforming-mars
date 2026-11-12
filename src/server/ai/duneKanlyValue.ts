import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {battleWinner} from '../../common/dune/kanlyBattle';
import {battleTargets, garrisonOf} from '../dune/Kanly';
import {registerValueExtension, ValuePrices} from './valueExtensions';
import {duneTuningOf} from './duneTuning';

// Kanly (dune/Kanly.ts): a battle is decided at the end of the generation, so the move search never saw the tile change
// hands and the AI never opened one (round 201: 0 battles in 93 games with all modules). Late in the game a city with
// six greeneries around it is 6 VP for one action (Jens, 12 Nov 2026). Two terms:
// - kanlyBattle: the running battle as the current troops would decide it – the tile's VP move from owner to winner.
// - kanlyGarrison: Sardaukar in the garrison are worth a share of the best tile they could take now (an opponent's
//   tile whose owner has fewer Sardaukar at home), while a battle can still be opened. Recruiting to defend lowers
//   the opponents' term the same way, so it counts too.

/** VP a tile gives its owner: greenery 1, city 1 per adjacent greenery; other tiles 0 (card points stay with the cards). */
export function tileVictoryPoints(board: Board, space: Space): number {
  if (Board.isGreenerySpace(space)) {
    return 1;
  }
  if (Board.isCitySpace(space)) {
    return board.getAdjacentSpaces(space).filter((neighbour) => Board.isGreenerySpace(neighbour)).length;
  }
  return 0;
}

/** M€ the running battle moves to (+) or away from (−) `player`; 0 without a battle. */
export function battleValue(player: IPlayer, victoryPointValue: number): number {
  const battle = player.game.duneData?.kanly?.battle;
  if (battle === undefined) {
    return 0;
  }
  const space = player.game.board.getSpaceOrThrow(battle.spaceId);
  const owner = space.player;
  if (owner === undefined) {
    return 0;
  }
  const forces = Object.entries(battle.troops).map(([key, sardaukar]) => ({key, sardaukar}));
  const winner = battleWinner<string>(owner.id, forces);
  if (winner === undefined) {
    return 0;
  }
  const points = tileVictoryPoints(player.game.board, space) * victoryPointValue;
  if (winner === player.id) {
    return points;
  }
  return owner.id === player.id ? -points : 0;
}

/** M€ the own garrison is worth: the VP of the best tile it could take now; 0 when no battle can be opened. */
export function garrisonValue(player: IPlayer, victoryPointValue: number): number {
  const data = player.game.duneData?.kanly;
  if (data === undefined || data.battle !== undefined) {
    return 0;
  }
  const garrison = garrisonOf(data, player);
  if (garrison < 1) {
    return 0;
  }
  let best = 0;
  for (const space of battleTargets(player.game, player)) {
    if (space.player !== undefined && garrisonOf(data, space.player) < garrison) {
      best = Math.max(best, tileVictoryPoints(player.game.board, space));
    }
  }
  return best * victoryPointValue;
}

export function kanlyValue(player: IPlayer, prices: ValuePrices): number {
  const tuning = duneTuningOf(player);
  if (tuning.kanlyBattle <= 0 && tuning.kanlyGarrison <= 0) {
    return 0;
  }
  return tuning.kanlyBattle * battleValue(player, prices.victoryPoint) + tuning.kanlyGarrison * garrisonValue(player, prices.victoryPoint);
}

registerValueExtension(kanlyValue);
