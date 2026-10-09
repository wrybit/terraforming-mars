import {Message} from '@/common/logs/Message';
import {isNoEffect} from '@/client/components/selectPlayerResource';

// What an option yields besides resources: global parameters, TR, oceans, cards
// ("Remove 2 microbes to raise temperature 1 step" → +2 °C). The choice tile shows it after the red
// action arrow, like the card itself: cost → result (ChoiceOptionTile.vue).

export type ResultGainKind = 'temperature' | 'oxygen' | 'venus' | 'tr' | 'ocean' | 'card';

export type ResultGain = {
  kind: ResultGainKind,
  // Shown next to the icon, already with unit ("+2 °C", "+1 %")
  label: string,
};

type GainPattern = {
  kind: ResultGainKind,
  pattern: RegExp,
  // Steps → label; one step of temperature is 2 °C, of Venus 2 %
  label: (steps: number) => string,
};

const STEPS = '(\\d+|an?|one) steps?';

const GAIN_PATTERNS: ReadonlyArray<GainPattern> = [
  {kind: 'temperature', pattern: new RegExp(`\\b(?:raise|increase) (?:the )?temperature ${STEPS}`, 'i'), label: (steps) => `+${2 * steps} °C`},
  {kind: 'oxygen', pattern: new RegExp(`\\b(?:raise|increase) (?:the )?oxygen(?: level)? ${STEPS}`, 'i'), label: (steps) => `+${steps} %`},
  {kind: 'venus', pattern: new RegExp(`\\b(?:raise|increase) (?:the )?Venus(?: scale)? ${STEPS}`, 'i'), label: (steps) => `+${2 * steps} %`},
  {kind: 'tr', pattern: new RegExp(`\\b(?:raise|increase) (?:your )?(?:terraform rating|TR) ${STEPS}`, 'i'), label: (steps) => `+${steps}`},
  {kind: 'tr', pattern: /\bgain (\d+|an?|one) TR\b/i, label: (steps) => `+${steps}`},
  {kind: 'ocean', pattern: /\bplace (\d+|an?|one) ocean\b/i, label: (count) => `+${count}`},
  {kind: 'card', pattern: /\bdraw (\d+|an?|one) (?:\w+ )?cards?\b/i, label: (count) => `+${count}`},
];

function count(word: string): number {
  return /^\d+$/.test(word) ? Number(word) : 1;
}

// Text with text parameters filled in, so "${0} steps" counts like "2 steps"
function filledText(title: string | Message): string {
  if (typeof title === 'string') {
    return title;
  }
  return title.message.replace(/\$\{(\d+)\}/g, (placeholder, index) => {
    const value = title.data[Number(index)]?.value;
    return typeof value === 'string' ? value : placeholder;
  });
}

// Gains in title order; only the part after "to" counts, so a cost clause is never read as a gain.
// Titles without "to" ("Raise temperature 1 step") are read whole.
export function resultGains(title: string | Message): Array<ResultGain> {
  if (isNoEffect(title)) {
    return [];
  }
  const text = filledText(title);
  const toIndex = text.search(/\bto\b/i);
  const resultPart = toIndex < 0 ? text : text.slice(toIndex);
  const found: Array<{index: number, gain: ResultGain}> = [];
  for (const {kind, pattern, label} of GAIN_PATTERNS) {
    const match = pattern.exec(resultPart);
    if (match !== null && !found.some((entry) => entry.gain.kind === kind)) {
      found.push({index: match.index, gain: {kind, label: label(count(match[1]))}});
    }
  }
  return found.sort((a, b) => a.index - b.index).map((entry) => entry.gain);
}
