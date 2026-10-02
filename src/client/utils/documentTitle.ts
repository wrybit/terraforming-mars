import {APP_NAME} from '@/common/constants';
import {$t} from '../directives/i18n';
import {Phase} from '@/common/Phase';
import {turnTaskLabel} from './turnTaskLabel';

// Kurzform im Spiel-Tab: Status, Spieler und Generation sollen im schmalen Tab sichtbar bleiben.
const SHORT_APP_NAME = 'TM';

// Statisches Zeichen für "am Zug"; animiert wird es durch die Drehsymbole in WaitingFor ersetzt.
export const TURN_MARKER = '●';

// Nur das, was der Titel braucht – passt auf Spieler-, Zuschauer- und Endansicht.
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

// "Am Zug" nur bei einer Pflichteingabe – dieselbe Bedingung wie für die Titel-Animation.
export function isOwnTurn(view: TitleView): boolean {
  return view.waitingFor !== undefined && view.waitingFor.optional !== true;
}

// Status-Teil für den eigenen Zug: Marker plus aktuelle Aufgabe, z.B. "● Kaufen".
export function turnTitleState(view: TitleView, marker: string = TURN_MARKER): string {
  return `${marker} ${$t(turnTaskLabel(view.game))}`;
}

// Titel im Spiel: <Aufgabe> · <Spieler> · G<Generation> · <Spielname> | TM
// z.B. "● Kaufen · Daniel · G2 · Remote Plasma Trace | TM"; leere Teile entfallen.
export function gameDocumentTitle(view: TitleView, state: string | undefined = isOwnTurn(view) ? turnTitleState(view) : undefined): string {
  return shortDocumentTitle([state, view.thisPlayer?.name, `G${view.game.generation}`, view.game.name]);
}

// Gemeinsamer Aufbau aller Spiel-Titel: Teile mit " · " verbunden, leere Teile entfallen, "| TM" am Ende.
export function shortDocumentTitle(parts: ReadonlyArray<string | undefined>): string {
  return `${parts.filter((part) => part !== undefined && part !== '').join(' · ')} | ${SHORT_APP_NAME}`;
}
