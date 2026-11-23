// Connects games with Rust AI players to their mirror (RustMirror.ts): answered inputs and reloaded game objects.
// Games without a Rust player return after one check.
import {IGame} from '../../IGame';
import {IPlayer} from '../../IPlayer';
import {Phase} from '../../../common/Phase';
import {registerGameLoadedHook, registerProcessedHook} from '../aiHook';
import {isSimulating} from '../simulationSandbox';
import {RustMirror} from './RustMirror';

function hasRustPlayer(game: IGame): boolean {
  return game.players.some((player: IPlayer) => player.aiEngine === 'rust');
}

export function installRustAi(): void {
  registerProcessedHook((player, input, response, saveId) => {
    if (isSimulating() || !hasRustPlayer(player.game)) {
      return;
    }
    const mirror = RustMirror.of(player.game);
    mirror?.processed(player, input, response, saveId);
    if (player.game.phase === Phase.END) {
      mirror?.close();
    }
  });
  registerGameLoadedHook((game, loadedSaveId) => {
    if (!isSimulating() && hasRustPlayer(game) && game.phase !== Phase.END) {
      RustMirror.loaded(game, loadedSaveId);
    }
  });
}
