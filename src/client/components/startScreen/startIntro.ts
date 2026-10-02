/* Intro der Startseite (Ablauf und Zeiten in start_intro.less): bei jedem Laden der Startseite, außer bei
   reduzierter Bewegung und in automatisierten Browsern (Screenshots des TM Screen-Viewers). */

// so lange läuft das Intro insgesamt (muss zu den Zeiten in start_intro.less passen)
export const INTRO_DURATION = 1700;

export function shouldPlayIntro(): boolean {
  if (navigator.webdriver) {
    return false;
  }
  return !(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}
/** Versatz vom Platz des Logos zur Bildschirmmitte: dort zoomt es zuerst hinein, dann fährt es an seinen Platz. */
export function logoOffsetToCenter(logo: HTMLElement): {x: number, y: number} {
  const rect = logo.getBoundingClientRect();
  return {
    x: window.innerWidth / 2 - (rect.left + rect.width / 2),
    y: window.innerHeight / 2 - (rect.top + rect.height / 2),
  };
}
