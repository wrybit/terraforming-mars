import {FEATURE_LOG_DATA_URL} from '@/client/utils/ShowcaseLinks';

// Shape of feature-log.json (written by the showcase site's build, newest day first)
export type FeatureLogText = {en: string, de: string};
export type FeatureLogDay = {
  date: string, // YYYY-MM-DD, Berlin time
  commits: number,
  title: FeatureLogText,
  items: ReadonlyArray<FeatureLogText>,
};

// The feature log only exists in German and English: German page German, every other language English
export type FeatureLogLanguage = keyof FeatureLogText;
export function featureLogLanguage(gameLanguage: string): FeatureLogLanguage {
  return gameLanguage === 'de' ? 'de' : 'en';
}

// One day, ready to show: texts in one language, date parts for the closed row and the calendar sheet
export type PresentedDay = {
  date: string,
  shortDate: string,
  month: string,
  dayOfMonth: number,
  weekday: string,
  sunday: boolean,
  commits: number,
  commitsLabel: string,
  title: string,
  items: ReadonlyArray<string>,
};

const LOCALES: Record<FeatureLogLanguage, string> = {de: 'de-DE', en: 'en-GB'};

export function presentDay(day: FeatureLogDay, language: FeatureLogLanguage): PresentedDay {
  // Read the date as a local day (new Date('YYYY-MM-DD') would be UTC and can slip by a day)
  const [year, month, dayOfMonth] = day.date.split('-').map(Number);
  const date = new Date(year, month - 1, dayOfMonth);
  const locale = LOCALES[language];
  // German short months end with a dot ("Okt."): dropped, the row reads "13. Okt"
  const shortMonth = date.toLocaleDateString(locale, {month: 'short'}).replace('.', '');
  return {
    date: day.date,
    shortDate: language === 'de' ? `${dayOfMonth}. ${shortMonth}` : `${dayOfMonth} ${shortMonth}`,
    month: shortMonth.toUpperCase(),
    dayOfMonth,
    weekday: date.toLocaleDateString(locale, {weekday: 'short'}).replace('.', ''),
    sunday: date.getDay() === 0,
    commits: day.commits,
    commitsLabel: language === 'de' ? 'Commits' : 'commits',
    title: day.title[language],
    items: day.items.map((item) => item[language]),
  };
}

// Header texts of the column, in the feature log's two languages
export const FEATURE_LOG_TEXTS: Record<FeatureLogLanguage, {heading: string, all: string}> = {
  de: {heading: 'Letzte Updates', all: 'Alle'},
  en: {heading: 'Latest updates', all: 'All'},
};

// Missing or broken file (showcase site unreachable, own server without internet): no column, no error
export async function loadFeatureLog(url: string = FEATURE_LOG_DATA_URL): Promise<ReadonlyArray<FeatureLogDay>> {
  try {
    const response = await fetch(url, {cache: 'no-cache'});
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return Array.isArray(data?.days) ? data.days : [];
  } catch {
    return [];
  }
}
