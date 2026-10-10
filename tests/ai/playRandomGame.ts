import {TestGameOptions} from '../TestGame';
import {TestPlayer} from '../TestPlayer';
import {Game} from '../../src/server/Game';
import {GameId, SpectatorId} from '../../src/common/Types';
import {Phase} from '../../src/common/Phase';
import {IPlayer} from '../../src/server/IPlayer';
import {IGame} from '../../src/server/IGame';
import {PlayerInput} from '../../src/server/PlayerInput';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {RandomSource} from '../../src/server/ai/randomChoice';
import {randomResponse, UnsupportedInputError} from '../../src/server/ai/randomResponse';
import {InputResponse} from '../../src/common/inputs/InputResponse';

/** Strategy of one seat. Default: random valid answers. */
export type Responder = (input: PlayerInput, player: IPlayer) => InputResponse;

export type RandomGameSettings = {
  playerCount: number,
  gameOptions: Partial<TestGameOptions>,
  /** Safety stop: random players terraform slowly, a game must not run forever. */
  maximumGenerations: number,
  /** Safety stop against engine loops in which decisions succeed but the game never advances. */
  maximumDecisions: number,
  /** How many random answers are tried before a decision counts as stuck. */
  maximumAttemptsPerDecision: number,
  random: RandomSource,
  /** Game seed in [0, 1) like the server uses (deck order, board); random when not given. */
  seed?: number,
  /** Strategy per seat (index = seat); seats without one play randomly. */
  responders?: ReadonlyArray<Responder | undefined>,
  /** Called with the finished game, e.g. to print its log. */
  inspect?: (game: IGame) => void,
  /** Called after every accepted decision, e.g. to report live progress. */
  onDecision?: (game: IGame) => void,
};

export type RandomGameResult = {
  milliseconds: number,
  decisions: number,
  rejectedResponses: number,
  generations: number,
  finished: boolean,
  stopReason: 'finished' | 'generationLimit' | 'decisionLimit' | 'stuck' | 'unsupportedInput' | 'engineError',
  stopDetail?: string,
  /** Final VP per seat. */
  victoryPoints: Array<number>,
};

/** Short description of an input for stop reports, e.g. "or[Play project card|Pass for this generation]". */
function describeInput(input: PlayerInput): string {
  const titleOf = (option: PlayerInput) => typeof option.title === 'string' ? option.title : option.title.message;
  if (input instanceof OrOptions) {
    return `or[${input.options.map((option) => `${option.type}:${titleOf(option)}`).join('|')}]`;
  }
  return `${input.type}:${titleOf(input)}`;
}

// Optional inputs (e.g. "change your draft pick") would keep the same player busy forever,
// so players with a mandatory input go first.
function nextWaitingPlayer(players: ReadonlyArray<IPlayer>): IPlayer | undefined {
  return players.find((player) => player.getWaitingFor()?.optional !== true && player.getWaitingFor() !== undefined) ??
    players.find((player) => player.getWaitingFor() !== undefined);
}

/** Plays one complete game with random players directly against the engine (no HTTP, no UI). */
export function playRandomGame(settings: RandomGameSettings): RandomGameResult {
  const start = performance.now();
  // testGame() always uses seed 0, so every game would get the same corporations and cards.
  const colors = [TestPlayer.BLUE, TestPlayer.RED, TestPlayer.YELLOW, TestPlayer.GREEN, TestPlayer.BLACK, TestPlayer.PURPLE];
  const players = colors.slice(0, settings.playerCount).map((color, index) => color.newPlayer({name: `player${index + 1}`}));
  // SeededRandom multiplies the seed by 2^32 and keeps 32 bits: whole numbers all end up as seed 0.
  const seed = settings.seed ?? settings.random();
  const game = Game.newInstance('game-id' as GameId, players, players[0], 'spectator-id' as SpectatorId, settings.gameOptions, seed);
  let decisions = 0;
  let rejectedResponses = 0;

  const result = (stopReason: RandomGameResult['stopReason'], stopDetail?: string): RandomGameResult => {
    settings.inspect?.(game);
    return {
      milliseconds: performance.now() - start,
      decisions,
      rejectedResponses,
      generations: game.generation,
      finished: game.phase === Phase.END,
      stopReason,
      stopDetail,
      victoryPoints: players.map((player) => player.getVictoryPoints().total),
    };
  };

  while (game.phase !== Phase.END) {
    if (game.generation > settings.maximumGenerations) {
      return result('generationLimit');
    }
    const player = nextWaitingPlayer(players);
    if (decisions >= settings.maximumDecisions) {
      const waitingFor = player?.getWaitingFor();
      return result('decisionLimit', waitingFor === undefined ? undefined : `phase ${game.phase}, ${describeInput(waitingFor)}`);
    }
    if (player === undefined) {
      return result('stuck', 'nobody is waiting for input');
    }
    let accepted = false;
    for (let attempt = 0; attempt < settings.maximumAttemptsPerDecision && !accepted; attempt++) {
      const waitingFor = player.getWaitingFor();
      if (waitingFor === undefined) {
        break;
      }
      try {
        // A strategy gets the first try; if its answer is rejected, random answers take over.
        const responder = attempt === 0 ? settings.responders?.[game.players.indexOf(player)] : undefined;
        player.process(responder !== undefined ? responder(waitingFor, player) : randomResponse(waitingFor, player, settings.random));
        accepted = true;
        decisions++;
        settings.onDecision?.(game);
      } catch (error) {
        if (error instanceof UnsupportedInputError) {
          return result('unsupportedInput', error.message);
        }
        // Rejected answers (InputError) are expected for a random player: just try again.
        // Other errors are counted the same way but reported if the decision never succeeds.
        rejectedResponses++;
        if (attempt === settings.maximumAttemptsPerDecision - 1) {
          return result('stuck', `${describeInput(waitingFor)}: ${(error as Error).message}`);
        }
      }
    }
  }
  return result('finished');
}
