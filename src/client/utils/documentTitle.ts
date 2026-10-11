import {$t} from '../directives/i18n';
import {Phase} from '@/common/Phase';
import {turnTask} from './turnTask';
import {titleLong, titleShort} from './serverIdentity';

// Only what the title needs – fits the player, spectator and end views.
export type TitleView = {
  game: {name: string, generation: number, phase: Phase};
  thisPlayer?: {name: string};
  waitingFor?: {optional?: boolean};
};

// Without a title: the long server title (start page); otherwise "<page> | <short server title>", e.g. "Cards List | TM".
// Short at the end so the page name stays visible in a narrow tab
export function setDocumentTitle(title?: string): void {
  document.title = title === undefined ? titleLong() : `${$t(title)} | ${titleShort()}`;
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

// Shared structure of all game titles: parts joined with " · ", empty parts dropped, "| <short server title>" at the end.
export function shortDocumentTitle(parts: ReadonlyArray<string | undefined>): string {
  return `${parts.filter((part) => part !== undefined && part !== '').join(' · ')} | ${titleShort()}`;
}
