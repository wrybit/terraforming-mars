import * as fs from 'fs';
import * as zlib from 'zlib';
import {Database} from '../database/Database';
import {GameId} from '../../common/Types';
import {SerializedGame} from '../SerializedGame';
import {Phase} from '../../common/Phase';
import {AiFeedbackStore} from '../aiFeedback/AiFeedbackStore';
import {decisionLogFileName} from '../ai/decisionLogFile';
import {aiVersionOfGame} from '../../common/ai/AiEngine';
import {TRAINING_EXPORT_CONTRACT, TrainingExportMeta} from '../../common/trainingShare/TrainingShareModel';
import {TrainingSharePseudonyms} from './TrainingSharePseudonyms';
import {rewriteStrings} from './rewriteStrings';

export type TrainingExportOptions = {
  anonymous: boolean,
  /** This server's share key: the pseudonyms of the ids depend on it */
  secret: string,
  /** Folder of the decision logs (<gameId>.jsonl); undefined: none were recorded */
  decisionDirectory: string | undefined,
  serverVersion: string,
};

export type BuiltTrainingExport = {exportedGameId: string, compressed: Buffer};

/** Refusal with a reason the admin can act on (shown in the games list and the Export tab). */
export class TrainingExportError extends Error {}

function readJsonLines(file: string): Array<unknown> {
  if (!fs.existsSync(file)) {
    return [];
  }
  return fs.readFileSync(file, 'utf8').split('\n').flatMap((line) => {
    if (line.trim() === '') {
      return [];
    }
    try {
      return [JSON.parse(line)];
    } catch {
      // A broken line (e.g. cut off by a crash) is skipped instead of losing the whole game
      return [];
    }
  });
}

/** A save without what never goes out: Discord ids, the link to a cloned game and (anonymous) the game name. */
function cleanSave(game: SerializedGame, anonymous: boolean): unknown {
  const copy: Record<string, unknown> = {...game, clonedGamedId: undefined};
  if (anonymous) {
    copy.name = 'Game';
  }
  copy.players = game.players.map((player) => ({...player, user: undefined}));
  return copy;
}

/**
 * One finished game as the gzip file the receiver takes: every save (the full states, so the training can
 * replay each decision), the decision log of AI and humans and the ratings of AI decisions.
 * Written save by save through gzip: a long game as one JSON string can exceed the maximum string length.
 */
export async function buildTrainingExport(gameId: GameId, options: TrainingExportOptions): Promise<BuiltTrainingExport> {
  const database = Database.getInstance();
  const saveIds = [...await database.getSaveIds(gameId)].sort((a, b) => a - b);
  if (saveIds.length === 0) {
    throw new TrainingExportError(`Game ${gameId} has no saves on this server.`);
  }
  const finalState = await database.getGameVersion(gameId, saveIds[saveIds.length - 1]);
  if (finalState.phase !== Phase.END) {
    throw new TrainingExportError(`Game ${gameId} is not finished yet; only finished games can be shared.`);
  }
  const players = finalState.players.map((player) => ({id: player.id, name: player.name, isHuman: player.aiLevel === undefined}));
  const humanCount = players.filter((player) => player.isHuman).length;
  if (humanCount === 0) {
    throw new TrainingExportError(`Game ${gameId} has no human player; games of AI players alone are not shared.`);
  }
  if (saveIds.length > TRAINING_EXPORT_CONTRACT.limits.saves) {
    throw new TrainingExportError(`Game ${gameId} has ${saveIds.length} saves, more than the ${TRAINING_EXPORT_CONTRACT.limits.saves} the receiver takes.`);
  }
  const pseudonyms = new TrainingSharePseudonyms(options.secret, {id: finalState.id, spectatorId: finalState.spectatorId, players}, options.anonymous);
  const rewrite = (value: unknown) => rewriteStrings(value, (text) => pseudonyms.replace(text));

  const decisions = options.decisionDirectory === undefined ? [] : readJsonLines(decisionLogFileName(options.decisionDirectory, gameId));
  const feedback = AiFeedbackStore.getInstance().records(gameId)
    .map((record) => options.anonymous ? {...record, text: ''} : record);
  const meta: TrainingExportMeta = {
    playerCount: players.length,
    humanCount,
    aiCount: players.length - humanCount,
    players: finalState.players.map((player) => ({name: player.name, color: player.color, aiLevel: player.aiLevel ?? null})),
    generation: finalState.generation,
    board: finalState.gameOptions.boardName,
    createdTimeMs: finalState.createdTimeMs,
    finishedTimeMs: finalState.lastActivityTimeMs,
    saveCount: saveIds.length,
    decisionCount: decisions.length,
    humanDecisionCount: decisions.filter((record) => (record as {human?: boolean}).human === true).length,
    feedbackCount: feedback.length,
    aiAnalysis: finalState.gameOptions.aiAnalysis === true,
    aiVersion: aiVersionOfGame(finalState.players),
    serverVersion: options.serverVersion,
  };

  const chunks: Array<Buffer> = [];
  let size = 0;
  const gzip = zlib.createGzip();
  const done = new Promise<void>((resolve, reject) => {
    gzip.on('data', (chunk: Buffer) => {
      size += chunk.length;
      chunks.push(chunk);
    });
    gzip.on('end', () => resolve());
    gzip.on('error', reject);
  });
  const write = async (text: string) => {
    if (!gzip.write(text)) {
      await new Promise((resolve) => gzip.once('drain', resolve));
    }
  };
  const head = {
    format: TRAINING_EXPORT_CONTRACT.format,
    version: TRAINING_EXPORT_CONTRACT.version,
    gameId: pseudonyms.exportedGameId,
    exportedAt: new Date().toISOString(),
    anonymous: options.anonymous,
    meta: rewrite(meta),
  };
  await write(JSON.stringify(head).slice(0, -1) + ',"saves":[');
  for (let index = 0; index < saveIds.length; index++) {
    const saveId = saveIds[index];
    const game = index === saveIds.length - 1 ? finalState : await database.getGameVersion(gameId, saveId);
    await write((index === 0 ? '' : ',') + JSON.stringify({saveId, game: rewrite(cleanSave(game, options.anonymous))}));
  }
  await write('],"decisions":' + JSON.stringify(rewrite(decisions)) + ',"feedback":' + JSON.stringify(rewrite(feedback)) + '}');
  gzip.end();
  await done;
  if (size > TRAINING_EXPORT_CONTRACT.limits.compressedBytes) {
    throw new TrainingExportError(`Game ${gameId} is ${Math.round(size / 1024 / 1024)} MB packed, more than the receiver takes.`);
  }
  return {exportedGameId: pseudonyms.exportedGameId, compressed: Buffer.concat(chunks)};
}
