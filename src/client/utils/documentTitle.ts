import {APP_NAME} from '@/common/constants';
import {$t} from '../directives/i18n';

// Kurzform im Spiel-Tab: Status, Spieler und Generation sollen im schmalen Tab sichtbar bleiben.
const SHORT_APP_NAME = 'TM';

// Statisches Zeichen für "am Zug"; animiert wird es durch die Drehsymbole in WaitingFor ersetzt.
export const TURN_MARKER = '●';

// Nur das, was der Titel braucht – passt auf Spieler-, Zuschauer- und Endansicht.
export type TitleView = {
  game: {name: string, generation: number};
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

// Status-Teil für den eigenen Zug, z.B. "● Am Zug".
export function turnTitleState(marker: string = TURN_MARKER): string {
  return `${marker} ${$t('Your turn')}`;
}

// Titel im Spiel: <Status> · <Spieler> · <Gen.> · <Spielname> | TM
// z.B. "● Am Zug · Jens · Gen. 5 · Cosmic Pressure Flow | TM"; leere Teile entfallen.
export function gameDocumentTitle(view: TitleView, state: string | undefined = isOwnTurn(view) ? turnTitleState() : undefined): string {
  const parts = [state, view.thisPlayer?.name, `${$t('Gen')} ${view.game.generation}`, view.game.name];
  return `${parts.filter((part) => part !== undefined && part !== '').join(' · ')} | ${SHORT_APP_NAME}`;
}
