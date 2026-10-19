import {reactive} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import {Message} from '@/common/logs/Message';
import {DuneBoardTabId} from '@/client/components/boardTabs/boardTabs';

// Moves of the Dune modules, made in the module tabs at the board (DuneMovePanel.vue) instead of the action menu
// (Jens: "possibly in the tabs top right, the player chooses the moment himself"). The server offers them as choices
// (server/dune/*.ts, grouped under DUNE_ACTIONS_TITLE in the action menu); the tab finds its move there by the shared
// titles (common/dune/duneActionTitles.ts) and sends the answer through the same channel as the action menu.

/** One step of the path to a move: a title (or its beginning), optionally a value inside the title (e.g. a ware) */
export type DuneMoveStep = {title: string, value?: string};

/** Deepest level searched for a step (action menu, module group, choice, sub-choice, amount) */
const MAXIMUM_DEPTH = 5;

/** The move open in a module tab; undefined = none */
export const openDuneMove = reactive({
  tab: undefined as DuneBoardTabId | undefined,
  path: [] as Array<DuneMoveStep>,
});

export function openMove(tab: DuneBoardTabId, path: ReadonlyArray<DuneMoveStep>): void {
  openDuneMove.tab = tab;
  openDuneMove.path = [...path];
}

export function closeMove(): void {
  openDuneMove.tab = undefined;
  openDuneMove.path = [];
}

function titleText(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

function titleValues(title: string | Message): Array<string> {
  return typeof title === 'string' ? [] : title.data.map((entry) => String(entry.value));
}

function matches(input: PlayerInputModel, step: DuneMoveStep): boolean {
  if (!titleText(input.title).startsWith(step.title)) {
    return false;
  }
  return step.value === undefined || titleValues(input.title).includes(step.value);
}

export function optionsOf(input: PlayerInputModel): ReadonlyArray<PlayerInputModel> {
  return input.type === 'or' ? input.options : [];
}

/**
 * Indices of the choices from the waiting input down to the move: every step of the path matches one input on the
 * way, levels in between (action menu, module group) are passed through. Undefined when the move is not offered now.
 */
export function movePath(input: PlayerInputModel | undefined, steps: ReadonlyArray<DuneMoveStep>, depth = 0): Array<number> | undefined {
  if (input === undefined || steps.length === 0 || depth > MAXIMUM_DEPTH) {
    return undefined;
  }
  const rest = matches(input, steps[0]) ? steps.slice(1) : steps;
  if (rest.length === 0) {
    return [];
  }
  const options = optionsOf(input);
  for (let index = 0; index < options.length; index++) {
    const below = movePath(options[index], rest, depth + 1);
    if (below !== undefined) {
      return [index, ...below];
    }
  }
  return undefined;
}

/** Whether the waiting input offers the move right now (enables the button or ware in the tab) */
export function isMoveOffered(input: PlayerInputModel | undefined, steps: ReadonlyArray<DuneMoveStep>): boolean {
  return movePath(input, steps) !== undefined;
}

/** The input at the end of the indices */
export function inputAt(input: PlayerInputModel, indices: ReadonlyArray<number>): PlayerInputModel | undefined {
  let node: PlayerInputModel | undefined = input;
  for (const index of indices) {
    node = node === undefined ? undefined : optionsOf(node)[index];
  }
  return node;
}

/** The answer to the waiting input: the choices of the indices around the answer of the last input */
export function wrapResponse(indices: ReadonlyArray<number>, response: InputResponse): InputResponse {
  return indices.reduceRight<InputResponse>((inner, index) => ({type: 'or', index, response: inner}), response);
}

// The player's answers go out through WaitingFor (the only place that talks to the server about the own turn)
let sender: ((response: InputResponse) => void) | undefined;

/** WaitingFor offers its way to the server; returns the function that withdraws it */
export function registerMoveSender(send: (response: InputResponse) => void): () => void {
  sender = send;
  return () => {
    if (sender === send) {
      sender = undefined;
    }
  };
}

/** Sends the move; false when no own input is waiting (e.g. spectators) */
export function sendMove(response: InputResponse): boolean {
  if (sender === undefined) {
    return false;
  }
  sender(response);
  closeMove();
  return true;
}
