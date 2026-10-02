import {APP_NAME} from '@/common/constants';
import {$t} from '../directives/i18n';

// Kurzform im Spiel-Tab: Status und Generation sollen im schmalen Tab sichtbar bleiben.
const SHORT_APP_NAME = 'TM';

// Statisches Zeichen für "am Zug"; animiert wird es durch die Drehsymbole in WaitingFor ersetzt.
export const TURN_MARKER = '●';

export function setDocumentTitle(title?: string): void {
  if (title === undefined) {
    document.title = $t(APP_NAME);
  } else {
    document.title = `${$t(title)} | ${$t(APP_NAME)}`;
  }
}

// Präfix für den eigenen Zug, z.B. "● Am Zug".
export function turnTitlePrefix(marker: string = TURN_MARKER): string {
  return `${marker} ${$t('Your turn')}`;
}

// Titel im Spiel, z.B. "● Am Zug · Gen. 5 | TM" oder "Gen. 5 | TM".
// Statt des zufälligen Spielnamens zählt hier, was man im Tab wissen will: Status und Generation.
export function gameDocumentTitle(game: {generation: number}, prefix?: string): string {
  const parts = [`${$t('Gen')} ${game.generation}`];
  if (prefix !== undefined) {
    parts.unshift(prefix);
  }
  return `${parts.join(' · ')} | ${SHORT_APP_NAME}`;
}
