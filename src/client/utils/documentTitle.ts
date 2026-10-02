import {APP_NAME} from '@/common/constants';
import {$t} from '../directives/i18n';
import {Phase} from '@/common/Phase';
import {turnTask} from './turnTask';

// Short form in the game tab: status, player and generation should stay visible in the narrow tab.
const SHORT_APP_NAME = 'TM';

// Only what the title needs – fits the player, spectator and end views.
export type TitleView = {
  game: {name: string, generation: number, phase: Phase};
  thisPlayer?: {name: string};
  waitingFor?: {optional?: boolean};
};

export function setDocumentTitle(title?: string): void {
  if (title === undefined) {
    document.title = $t(APP_NAME);
  } else {
    document.title = `${$t(title)} | ${$t(APP_NAME)}`;
  }
}

// "Your turn" only for mandatory input – the same condition as for the title animation.
export function isOwnTurn(view: TitleView): boolean {
  return view.waitingFor !== undefined && view.waitingFor.optional !== true;
}

// Status part for your own turn: task emoji plus task, e.g. "🛒 Buying".
// When animated, WaitingFor replaces the emoji with the spinning symbols.
export function turnTitleState(view: TitleView, marker?: string): string {
  const task = turnTask(view.game);
  return `${marker ?? task.icon} ${$t(task.label)}`;
}

// Title in the game: <task> · <player> · G<generation> · <game name> | TM
// e.g. "🛒 Buying · Daniel · G2 · Remote Plasma Trace | TM"; empty parts are dropped.
export function gameDocumentTitle(view: TitleView, state: string | undefined = isOwnTurn(view) ? turnTitleState(view) : undefined): string {
  return shortDocumentTitle([state, view.thisPlayer?.name, `G${view.game.generation}`, view.game.name]);
}

// Shared structure of all game titles: parts joined with " · ", empty parts dropped, "| TM" at the end.
export function shortDocumentTitle(parts: ReadonlyArray<string | undefined>): string {
  return `${parts.filter((part) => part !== undefined && part !== '').join(' · ')} | ${SHORT_APP_NAME}`;
}
