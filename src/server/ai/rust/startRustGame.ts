// Creates a game; with Rust AI players its setup goes to their mirror (RustMirror.ts). When this server has no
// Rust AI or the Rust AI does not know the setup, those players are TS AI players.
import {IGame} from '../../IGame';
import {IPlayer} from '../../IPlayer';
import {RustMirror, rustAiOffered} from './RustMirror';
import {recordSetup} from './rustRandom';
import {rustOptionsText, setupOf} from './rustSetup';

export function startGame(players: ReadonlyArray<IPlayer>, create: () => IGame): IGame {
  const rustPlayers = players.filter((player) => player.aiEngine === 'rust');
  if (rustPlayers.length === 0) {
    return create();
  }
  const {result: game, duneDraws} = recordSetup(create);
  const options = rustOptionsText(game.gameOptions, game.players.length);
  if (!rustAiOffered() || 'unsupported' in options) {
    const reason = 'unsupported' in options ? options.unsupported : 'not installed or switched off';
    console.warn(`Rust AI in game ${game.id}: ${reason}; its players are TS AI players`);
    rustPlayers.forEach((player) => player.aiEngine = undefined);
    return game;
  }
  RustMirror.start(game, setupOf(game, options.text, duneDraws));
  return game;
}
