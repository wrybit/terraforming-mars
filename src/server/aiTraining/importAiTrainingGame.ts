import {Game} from '../Game';
import {IGame} from '../IGame';
import {SerializedGame} from '../SerializedGame';
import {AiLevel} from '../../common/ai/AiLevel';
import {generateRandomId} from '../utils/server-ids';

/**
 * Turns the final state of an AI test batch game into a game of this server that spectators can open.
 * Every batch game has the same ids ("game-id", "p-player1-id" …), so they are replaced by fresh ones;
 * exact JSON strings only, so no other text can be hit. The players become AI players of the batch's
 * strength: that marks them in the game and keeps the game out of the statistics (games of AI players only).
 */
export function importAiTrainingGame(serializedText: string, title: string, level: AiLevel, variants: ReadonlyArray<string> | undefined): IGame {
  const original = JSON.parse(serializedText) as SerializedGame;
  const replacements = new Map<string, string>([
    [original.id, generateRandomId('g')],
    ...original.spectatorId === undefined ? [] : [[original.spectatorId, generateRandomId('s')] as [string, string]],
    ...original.players.map((player): [string, string] => [player.id, generateRandomId('p')]),
  ]);
  let text = serializedText;
  for (const [from, to] of replacements) {
    text = text.split(JSON.stringify(from)).join(JSON.stringify(to));
  }
  const serialized = JSON.parse(text) as SerializedGame;
  serialized.name = title;
  // Saved as a new game: the first save also stores who belongs to it (participant ids)
  serialized.lastSaveId = 0;
  serialized.players.forEach((player, seat) => {
    player.aiLevel = level;
    // The variant tells who is who when a batch compares two versions of the AI
    player.name = variants?.[seat] ?? `AI ${seat + 1}`;
  });
  return Game.deserialize(serialized);
}
