// Creates a game; with Rust AI players its setup goes to their mirror (RustMirror.ts). The create route and the lobby
// refuse AI seats the Rust AI cannot play beforehand; should one slip through, the game is not created at all
// rather than handing its AI players to the TypeScript AI without anyone noticing.
import {IGame} from '../../IGame';
import {IPlayer} from '../../IPlayer';
import {RustMirror, rustAiInstalled} from './RustMirror';
import {recordSetup} from './rustRandom';
import {rustOptionsText, setupOf} from './rustSetup';
import {rustAiSupportFile} from './rustAiSupportFile';

export function startGame(players: ReadonlyArray<IPlayer>, create: () => IGame): IGame {
  const rustPlayers = players.filter((player) => player.aiEngine === 'rust');
  if (rustPlayers.length === 0) {
    return create();
  }
  const {result: game, duneDraws} = recordSetup(create);
  const options = rustOptionsText(game.gameOptions, game.players.length);
  if (!rustAiInstalled() || 'unsupported' in options) {
    const reason = 'unsupported' in options ? options.unsupported : 'not installed';
    throw new Error(`Rust AI cannot play game ${game.id}: ${reason}`);
  }
  // the version that plays this game, so admins can tell games of different releases apart
  const support = rustAiSupportFile.get();
  rustPlayers.forEach((player) => player.aiVersion = support.aiVersion ?? support.botVersion);
  RustMirror.start(game, setupOf(game, options.text, duneDraws));
  return game;
}
