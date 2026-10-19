import {reactive} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {Message} from '@/common/logs/Message';
import {DUNE_ACTIONS_TITLE} from '@/common/dune/duneActionTitles';

// Dune modules: the module tabs at the board show the state, the moves are made in the action menu. A button in a
// tab (or a tap on a bazaar ware) leaves a path of option titles here; the action menu (OrOptions.vue, on the phone
// MobilePlayerHome.vue) selects the matching options level by level. The player confirms as always.


/** One step of the path: a title (or its beginning), optionally a value inside the title (e.g. the name of a ware) */
export type DuneActionStep = {title: string, value?: string};

/** How long a request holds: only the inputs that appear right after it take it over */
const REQUEST_LIFETIME_MILLISECONDS = 4000;

/** Deepest level searched for a step (action menu, module group, choice, sub-choice) */
const MAXIMUM_DEPTH = 4;

export const duneActionRequest = reactive({
  path: [] as Array<DuneActionStep>,
  // Time of the request; changes with every tap, also when the same path is asked for again
  at: 0,
});

function titleText(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

function titleValues(title: string | Message): Array<string> {
  return typeof title === 'string' ? [] : title.data.map((entry) => String(entry.value));
}

function matches(input: PlayerInputModel, step: DuneActionStep): boolean {
  if (!titleText(input.title).startsWith(step.title)) {
    return false;
  }
  return step.value === undefined || titleValues(input.title).includes(step.value);
}

/** Index of the option matching the running request; -1 without a fresh request or a match */
export function requestedOptionIndex(options: ReadonlyArray<PlayerInputModel>): number {
  if (Date.now() - duneActionRequest.at > REQUEST_LIFETIME_MILLISECONDS) {
    return -1;
  }
  for (const step of duneActionRequest.path) {
    const index = options.findIndex((option) => matches(option, step));
    if (index !== -1) {
      return index;
    }
  }
  return -1;
}

/** Whether the waiting input offers the step somewhere (enables the button of a tab) */
export function isOffered(input: PlayerInputModel | undefined, step: DuneActionStep, depth = 0): boolean {
  if (input === undefined || depth > MAXIMUM_DEPTH) {
    return false;
  }
  const options: ReadonlyArray<PlayerInputModel> = 'options' in input && Array.isArray(input.options) ? input.options : [];
  return matches(input, step) || options.some((option) => isOffered(option, step, depth + 1));
}

/** Asks the action menu for the path */
export function requestDuneAction(path: ReadonlyArray<DuneActionStep>): void {
  duneActionRequest.path = [{title: DUNE_ACTIONS_TITLE}, ...path];
  duneActionRequest.at = Date.now();
}
