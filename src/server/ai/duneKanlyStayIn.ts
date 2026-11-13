import {IPlayer} from '../IPlayer';
import {battleTargets, garrisonOf, OPEN_KANLY_COST} from '../dune/Kanly';
import {registerPassExtension} from './passExtensions';
import {tileVictoryPoints} from './duneKanlyValue';
import {duneTuningOf} from './duneTuning';

// Kanly (dune/Kanly.ts): the owner of a tile only defends by sending Sardaukar, and only while he has not passed; a
// battle opened after the owner passed cannot be answered (round 203 logs: taken with 1 Sardaukar against 2 at home).
// Battles come at the end of the game, so who acts when, and with how much M€ and Sardaukar left, decides them. Passing
// early gives that up – better stay in the generation with small moves such as selling one card (Jens, 13 Nov 2026).

/** VP of the best tile `attacker` could open a battle on that belongs to `owner` (any owner when undefined). */
function bestTarget(attacker: IPlayer, owner: IPlayer | undefined): number {
  let best = 0;
  for (const space of battleTargets(attacker.game, attacker)) {
    if (owner === undefined || space.player?.id === owner.id) {
      best = Math.max(best, tileVictoryPoints(attacker.game.board, space));
    }
  }
  return best;
}

/**
 * VP passing would put at stake this generation: the best own tile an opponent still in the generation could attack
 * (defence needs to be there), the best tile the own garrison could still take, or the tile of the running battle the
 * own garrison could still reinforce. 0 without Kanly or once the battle of this generation is over.
 */
export function stayInStake(player: IPlayer): number {
  const data = player.game.duneData?.kanly;
  if (data === undefined) {
    return 0;
  }
  const game = player.game;
  const ownGarrison = garrisonOf(data, player);
  const battle = data.battle;
  if (battle !== undefined) {
    if (ownGarrison < 1) {
      return 0;
    }
    const space = game.board.getSpaceOrThrow(battle.spaceId);
    return tileVictoryPoints(game.board, space);
  }
  if (data.foughtThisGeneration) {
    return 0;
  }
  let stake = 0;
  for (const opponent of player.opponents) {
    if (!game.hasPassedThisActionPhase(opponent) && garrisonOf(data, opponent) >= 1 && opponent.megaCredits >= OPEN_KANLY_COST) {
      stake = Math.max(stake, bestTarget(opponent, player));
    }
  }
  if (ownGarrison >= 1) {
    stake = Math.max(stake, bestTarget(player, undefined));
  }
  return stake;
}

export function kanlyStayInPenalty(player: IPlayer, victoryPointValue: number): number {
  const weight = duneTuningOf(player).kanlyStayIn;
  return weight > 0 ? weight * stayInStake(player) * victoryPointValue : 0;
}

registerPassExtension(kanlyStayInPenalty);
