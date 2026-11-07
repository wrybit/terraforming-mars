import {IGame} from '../IGame';
import {GlobalParameter} from '../../common/GlobalParameter';
import {LogMessageDataType} from '../../common/logs/LogMessageDataType';
import {LobbyGameMark, LobbyGeneration, LobbyParameter, LOBBY_PARAMETERS} from '../../common/lobby/LobbyModel';
import {MIN_OXYGEN_LEVEL, MIN_TEMPERATURE, MIN_VENUS_SCALE} from '../../common/constants';
import {Phase} from '../../common/Phase';
import {remainingProductionPhases} from '../ai/gameProgress';

// Course of a running game for the lobby list (LobbyGameTimeline.vue): how long each generation took, how much was
// terraformed in it, when milestones were claimed and awards funded, and roughly how long the game still runs.
// Everything comes from what the game keeps anyway: the log (timestamps) and globalsPerGeneration.

export type LobbyGameTimeline = {
  generations: Array<LobbyGeneration>;
  marks: Array<LobbyGameMark>;
  remainingMs: number;
};

type ParameterLevels = Partial<Record<GlobalParameter, number>>;

/** Temperature and Venus move in steps of 2: the lobby counts steps, as the players do */
const STEP_SIZE: Record<LobbyParameter, number> = {temperature: 2, oxygen: 1, oceans: 1, venus: 2};
const START_LEVEL: Record<LobbyParameter, number> = {temperature: MIN_TEMPERATURE, oxygen: MIN_OXYGEN_LEVEL, oceans: 0, venus: MIN_VENUS_SCALE};
/** Generations the estimate averages over: the recent pace says more than the slow start */
const RECENT_GENERATIONS = 3;

function currentLevels(game: IGame): ParameterLevels {
  const levels: ParameterLevels = {
    temperature: game.getTemperature(),
    oxygen: game.getOxygenLevel(),
    oceans: game.board.getOceanSpaces().length,
  };
  if (game.gameOptions.venusNextExtension) {
    levels.venus = game.getVenusScaleLevel();
  }
  return levels;
}

function stepsBetween(before: ParameterLevels | undefined, after: ParameterLevels, venus: boolean): Partial<Record<LobbyParameter, number>> {
  const steps: Partial<Record<LobbyParameter, number>> = {};
  for (const parameter of LOBBY_PARAMETERS) {
    if (parameter === 'venus' && !venus) {
      continue;
    }
    const from = before?.[parameter] ?? START_LEVEL[parameter];
    const to = after[parameter];
    if (to === undefined) {
      continue;
    }
    const count = Math.round((to - from) / STEP_SIZE[parameter]);
    if (count > 0) {
      steps[parameter] = count;
    }
  }
  return steps;
}

/** Start of each generation: the game start, then the "Generation N" lines of the log */
function generationStarts(game: IGame): Array<number> {
  const starts: Array<number> = [];
  for (const message of game.gameLog) {
    if (message.message !== 'Generation ${0}') {
      continue;
    }
    const number = Number(message.data[0]?.value);
    if (number >= 1 && starts[number - 1] === undefined) {
      starts[number - 1] = message.timestamp;
    }
  }
  // Older games or a lost first line: the first log line is the game start
  if (starts[0] === undefined) {
    starts[0] = game.gameLog[0]?.timestamp ?? Date.now();
  }
  return starts;
}

function marksOf(game: IGame, start: number): Array<LobbyGameMark> {
  const marks: Array<LobbyGameMark> = [];
  let generation = 1;
  for (const message of game.gameLog) {
    if (message.message === 'Generation ${0}') {
      generation = Number(message.data[0]?.value) || generation;
      continue;
    }
    const kind = message.message === '${0} claimed ${1} milestone' ? 'milestone' : message.message === '${0} funded ${1} award' ? 'award' : undefined;
    if (kind === undefined) {
      continue;
    }
    const color = message.data.find((data) => data.type === LogMessageDataType.PLAYER)?.value;
    const name = message.data.find((data) => data.type === (kind === 'milestone' ? LogMessageDataType.MILESTONE : LogMessageDataType.AWARD))?.value;
    const player = game.players.find((candidate) => candidate.color === color);
    if (player === undefined || name === undefined) {
      continue;
    }
    marks.push({kind, name: String(name), player: player.name, color: player.color, generation, atMs: Math.max(0, message.timestamp - start)});
  }
  return marks;
}

/** The timeline at the moment `now` (milliseconds since 1970) */
export function lobbyGameTimeline(game: IGame, now: number = Date.now()): LobbyGameTimeline {
  const starts = generationStarts(game);
  const history: Array<ParameterLevels> = Array.isArray(game.globalsPerGeneration) ? game.globalsPerGeneration : [];
  const venus = game.gameOptions.venusNextExtension;
  const generations: Array<LobbyGeneration> = [];
  for (let number = 1; number <= game.generation; number++) {
    const running = number === game.generation;
    // A generation without its own log line (older games): it starts where the one before ended
    const start = starts[number - 1] ?? starts[number - 2] ?? starts[0];
    const end = running ? now : (starts[number] ?? start);
    const after = running ? currentLevels(game) : history[number - 1];
    generations.push({
      number,
      durationMs: Math.max(0, end - start),
      steps: after === undefined ? {} : stepsBetween(number === 1 ? undefined : history[number - 2], after, venus),
    });
  }
  return {generations, marks: marksOf(game, starts[0]), remainingMs: remainingMs(game, generations)};
}

/** Rest of the running generation plus the generations still expected, each as long as the recent ones */
function remainingMs(game: IGame, generations: ReadonlyArray<LobbyGeneration>): number {
  if (game.phase === Phase.END) {
    return 0;
  }
  const running = generations[generations.length - 1];
  const finished = generations.slice(0, -1).slice(-RECENT_GENERATIONS);
  const average = finished.length === 0 ? running.durationMs : finished.reduce((sum, generation) => sum + generation.durationMs, 0) / finished.length;
  return Math.max(0, average - running.durationMs) + remainingProductionPhases(game) * average;
}
