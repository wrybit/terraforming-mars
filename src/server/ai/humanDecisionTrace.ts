import {IPlayer} from '../IPlayer';
import {InputResponse} from '../../common/inputs/InputResponse';
import {emitDecision, globalsOf, isRecordingDecisions, snapshot, titleText} from './decisionTrace';

// Records what a human was asked and what they answered, in the same format as AI decisions.
// The game log only shows the outcome; for training we need the offer too (cards on hand,
// cards that could be bought, all options) next to the choice that was made.

export type PendingHumanDecision = () => void;

/**
 * Takes the snapshot BEFORE the input is processed (afterwards hand and offer have changed).
 * Returns a callback that writes the record; call it only when the input was accepted.
 */
export function prepareHumanDecision(player: IPlayer, response: InputResponse, thinkingMilliseconds: number | undefined): PendingHumanDecision | undefined {
  const waitingFor = player.getWaitingFor();
  if (!isRecordingDecisions() || waitingFor === undefined) {
    return undefined;
  }
  const game = player.game;
  const base = {
    gameId: game.id,
    generation: game.generation,
    phase: game.phase,
    player: player.name,
    title: titleText(waitingFor),
    state: snapshot(player),
    globals: globalsOf(player),
    input: waitingFor.toModel(player),
    saveId: game.lastSaveId,
  };
  return () => emitDecision({
    ...base,
    kind: 'human',
    human: true,
    options: [],
    chosen: JSON.stringify(response),
    response,
    milliseconds: Math.round(thinkingMilliseconds ?? 0),
  });
}
