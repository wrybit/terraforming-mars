import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import {Phase} from '@/common/Phase';

// "Next" only from three players on: with two it's clear who is up after the active one
const SHOW_NEXT_LABEL_MIN = 2;

// A player's status for player bar, player table and milestone table – in one place,
// so all views show the same state
export function playerActionLabel(player: PublicPlayerModel, playerView: ViewModel): ActionLabel {
  const game = playerView.game;
  if (game.phase === Phase.DRAFTING) {
    return player.needsToDraft ? 'drafting' : 'none';
  }
  if (game.phase === Phase.RESEARCH) {
    return player.needsToResearch ? 'researching' : 'none';
  }
  if (game.phase === Phase.SOLAR) {
    // World government advisors and Terra enter the solar phase briefly during the active player's turn.
    // Otherwise it's the world government terraforming: the active player is then stale,
    // the running clock shows who decides (taken from the original, #5187)
    const activePlayerIsDeciding = playerView.players.some((candidate) => candidate.isActive && candidate.timer.running);
    if (!activePlayerIsDeciding) {
      return player.timer.running ? 'active' : 'none';
    }
  }
  if (game.passedPlayers.includes(player.color)) {
    return 'passed';
  }
  if (player.isActive) {
    return 'active';
  }
  const notPassedPlayers = playerView.players.filter((candidate) => !game.passedPlayers.includes(candidate.color));
  const currentPlayerIndex = notPassedPlayers.findIndex((candidate) => candidate.color === player.color);
  if (currentPlayerIndex === -1) {
    return 'none';
  }
  const previousPlayerIndex = currentPlayerIndex === 0 ? notPassedPlayers.length - 1 : currentPlayerIndex - 1;
  if (notPassedPlayers[previousPlayerIndex].isActive && playerView.players.length > SHOW_NEXT_LABEL_MIN) {
    return 'next';
  }
  return 'none';
}
