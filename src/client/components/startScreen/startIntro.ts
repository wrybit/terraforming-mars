/* Intro der Startseite (Ablauf und Zeiten in start_intro.less): nur einmal je Browser-Sitzung, nicht bei
   reduzierter Bewegung und nicht in automatisierten Browsern (Screenshots des TM Screen-Viewers). */

const SEEN_KEY = 'tm-start-intro-seen';
// so lange läuft das Intro insgesamt (muss zu den Zeiten in start_intro.less passen)
export const INTRO_DURATION = 4600;

export function shouldPlayIntro(): boolean {
  if (navigator.webdriver) {
    return false;
  }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  try {
    return sessionStorage.getItem(SEEN_KEY) === null;
  } catch {
    // ohne Speicher (privates Fenster o. Ä.) lieber einmal zu oft zeigen als nie
    return true;
  }
}

export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Speicher nicht verfügbar: dann kommt das Intro beim nächsten Laden erneut
  }
}

/** Versatz vom Platz des Logos zur Bildschirmmitte: dort zoomt es zuerst hinein, dann fährt es an seinen Platz. */
export function logoOffsetToCenter(logo: HTMLElement): {x: number, y: number} {
  const rect = logo.getBoundingClientRect();
  return {
    x: window.innerWidth / 2 - (rect.left + rect.width / 2),
    y: window.innerHeight / 2 - (rect.top + rect.height / 2),
  };
}
