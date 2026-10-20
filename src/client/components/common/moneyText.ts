import {translateText} from '@/client/directives/i18n';

// Amounts of money inside labels (tab titles, buttons, option tiles) are drawn as the coin with the number in it, the
// same as the counters in buttons (ButtonCount.vue), instead of "(14 M€)" as text (Jens, 20 Oct 2026). The label is
// split after translation, so the theme's currency name is found too ("Solari" in Dune: translateText('M€')).

export type MoneyTextPart = {kind: 'text', text: string} | {kind: 'coin', value: number};

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits a translated label into text and coins: "Award (14 M€)" → "Award " + coin 14. Brackets around the amount
 * go, the currency name goes; an amount without a number ("M€ production") stays text.
 */
export function splitMoney(text: string, currencies: ReadonlyArray<string>): Array<MoneyTextPart> {
  const names = [...new Set(currencies.filter((name) => name.trim() !== ''))].map((name) => escape(name.trim()));
  if (names.length === 0) {
    return [{kind: 'text', text}];
  }
  const currency = `(?:${names.join('|')})`;
  // Either "(14 M€)" or "14 M€"; the currency must not run on into a longer word
  const pattern = new RegExp(`\\(\\s*(\\d+)\\s?${currency}\\s*\\)|(\\d+)\\s?${currency}(?![\\p{L}\\p{N}])`, 'giu');
  const parts: Array<MoneyTextPart> = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) {
      parts.push({kind: 'text', text: text.slice(last, start)});
    }
    parts.push({kind: 'coin', value: Number(match[1] ?? match[2])});
    last = start + match[0].length;
  }
  if (last < text.length) {
    parts.push({kind: 'text', text: text.slice(last)});
  }
  return parts.length === 0 ? [{kind: 'text', text}] : parts;
}

/** The currency names of the current theme and language: always "M€", in Dune also its "Solari" */
export function currencyNames(): Array<string> {
  return ['M€', translateText('M€')];
}

export function moneyParts(text: string): Array<MoneyTextPart> {
  return splitMoney(text, currencyNames());
}
