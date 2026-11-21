import {Color} from '@/common/Color';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {ReplayState} from './reconstructReplay';

// The replay moves in steps, not log lines: one step per action of a player (a card, an action, a standard project,
// passing ...) with all lines it caused. The slider and the graph of the replay panel work with these steps.

const STEP_STARTS = new Set([
  '${0} played ${1}', '${0} used ${1} action', '${0} used ${1} standard project', '${0} used ${1} standard action',
  '${0} passed', '${0} ended turn', '${0} claimed ${1} milestone', '${0} funded ${1} award',
  '${0} ${1} ${2} card(s)', '${0} kept ${1} project cards', 'Final greenery placement',
]);

export type ReplayParameter = 'temperature' | 'oxygen' | 'oceans';

export type ReplayStep = {
  // Index of the state after the step (reconstructReplay: one state per log line)
  state: number,
  // First line of the step: what happened
  line: number,
  generation: number,
  actor: Color | undefined,
};

export type ReplayRaise = {step: number, parameter: ReplayParameter, index: number};
export type ReplayMark = {step: number, kind: 'milestone' | 'award', name: string, color: Color};
export type ReplayGeneration = {number: number, start: number, count: number};

export function replaySteps(source: ReplaySourceModel, states: ReadonlyArray<ReplayState>): Array<ReplayStep> {
  const starts: Array<number> = [];
  source.log.forEach((message, line) => {
    const newGeneration = message.type === LogMessageType.NEW_GENERATION || message.message === 'Generation ${0}';
    if ((STEP_STARTS.has(message.message) || newGeneration) && message.viewer === undefined) {
      starts.push(line);
    }
  });
  if (starts[0] !== 0) {
    starts.unshift(0);
  }
  return starts.map((line, index) => {
    const end = (starts[index + 1] ?? source.log.length) - 1;
    const actor = source.log[line].data[0]?.value;
    return {
      state: end,
      line,
      generation: states[end]?.generation ?? 1,
      actor: source.players.some((player) => player.color === actor) ? actor as Color : undefined,
    };
  });
}

export function replayGenerations(steps: ReadonlyArray<ReplayStep>): Array<ReplayGeneration> {
  const generations: Array<ReplayGeneration> = [];
  steps.forEach((step, index) => {
    const last = generations[generations.length - 1];
    if (last === undefined || last.number !== step.generation) {
      generations.push({number: step.generation, start: index, count: 1});
    } else {
      last.count++;
    }
  });
  return generations;
}

// One entry per raised step of a global parameter: the dots of the timeline
export function replayRaises(steps: ReadonlyArray<ReplayStep>, states: ReadonlyArray<ReplayState>): Array<ReplayRaise> {
  const raises: Array<ReplayRaise> = [];
  steps.forEach((step, index) => {
    if (index === 0) {
      return;
    }
    const before = states[steps[index - 1].state];
    const after = states[step.state];
    const add = (parameter: ReplayParameter, count: number) => {
      for (let n = 0; n < count; n++) {
        raises.push({step: index, parameter, index: n});
      }
    };
    add('temperature', (after.temperature - before.temperature) / 2);
    add('oxygen', after.oxygenLevel - before.oxygenLevel);
    add('oceans', after.oceans - before.oceans);
  });
  return raises;
}

export function replayMarks(steps: ReadonlyArray<ReplayStep>, states: ReadonlyArray<ReplayState>): Array<ReplayMark> {
  const marks: Array<ReplayMark> = [];
  steps.forEach((step, index) => {
    const before = index === 0 ? undefined : states[steps[index - 1].state];
    const after = states[step.state];
    after.milestones.slice(before?.milestones.length ?? 0).forEach((milestone) => marks.push({step: index, kind: 'milestone', ...milestone}));
    after.awards.slice(before?.awards.length ?? 0).forEach((award) => marks.push({step: index, kind: 'award', ...award}));
  });
  return marks;
}
