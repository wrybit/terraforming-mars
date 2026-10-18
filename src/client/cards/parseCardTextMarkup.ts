// Markup of a restructured card text (see cardTextMarkup.ts); every translation keeps the same tags:
//   "Main text with <opp>from any player</opp>.<note>Rule sentence with <b>the key words</b>.</note>"
// <note> = the rule behind the "*" in the icon row, shown set apart below the main text
// <b>    = the decisive words of that rule (highlighted)
// <opp>  = the words naming the other player who is hit (red)
// Plain tags instead of a separate key per part, so each language may order its sentences freely.

export type TextStyle = 'plain' | 'rule' | 'opponent';
export type TextSegment = {text: string, style: TextStyle};
export type CardTextParts = {main: ReadonlyArray<TextSegment>, note: ReadonlyArray<TextSegment> | undefined};

const NOTE = /<note>([\s\S]*?)<\/note>/;
const STYLED = /<(b|opp)>([\s\S]*?)<\/\1>/g;
const ANY_TAG = /<\/?[a-z]+>/g;
const STYLE_OF_TAG: Record<string, TextStyle> = {b: 'rule', opp: 'opponent'};

function segments(text: string): Array<TextSegment> {
  const result: Array<TextSegment> = [];
  let position = 0;
  for (const match of text.matchAll(STYLED)) {
    const index = match.index ?? 0;
    if (index > position) {
      result.push({text: text.slice(position, index), style: 'plain'});
    }
    result.push({text: match[2], style: STYLE_OF_TAG[match[1]]});
    position = index + match[0].length;
  }
  if (position < text.length) {
    result.push({text: text.slice(position), style: 'plain'});
  }
  // Stray tags would show up as literal text; the i18n lint keeps them out, this is the safety net
  return result
    .map((segment) => ({...segment, text: segment.text.replace(ANY_TAG, '')}))
    .filter((segment) => segment.text !== '');
}

export function parseCardTextMarkup(text: string): CardTextParts {
  const match = text.match(NOTE);
  const index = match?.index ?? text.length;
  const main = (text.slice(0, index) + ' ' + text.slice(index + (match?.[0].length ?? 0))).replace(/\s+/g, ' ').trim();
  return {main: segments(main), note: match === null ? undefined : segments(match[1].trim())};
}
