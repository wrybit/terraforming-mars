// An asterisk note marks the rule behind the "*" in a card's icon row. The restructured English
// text (see asteriskNotes.ts) carries it as markup that every translation keeps:
//   "Main text.<note>Rule sentence with <b>the key words</b>.</note>"
// Plain tags instead of a separate key per part, so each language may order its sentences freely.

export type NoteSegment = {text: string, emphasis: boolean};
export type SplitDescription = {main: string, note: ReadonlyArray<NoteSegment> | undefined};

const NOTE = /<note>([\s\S]*?)<\/note>/;
const EMPHASIS = /<b>([\s\S]*?)<\/b>/g;
const ANY_TAG = /<\/?[a-z]+>/g;

function segments(note: string): Array<NoteSegment> {
  const result: Array<NoteSegment> = [];
  let position = 0;
  for (const match of note.matchAll(EMPHASIS)) {
    const index = match.index ?? 0;
    if (index > position) {
      result.push({text: note.slice(position, index), emphasis: false});
    }
    result.push({text: match[1], emphasis: true});
    position = index + match[0].length;
  }
  if (position < note.length) {
    result.push({text: note.slice(position), emphasis: false});
  }
  // Stray tags would show up as literal text; the i18n lint keeps them out, this is the safety net
  return result.map((segment) => ({...segment, text: segment.text.replace(ANY_TAG, '')}));
}

export function splitAsteriskNote(text: string): SplitDescription {
  const match = text.match(NOTE);
  if (match === null) {
    return {main: text.replace(ANY_TAG, '').trim(), note: undefined};
  }
  const main = (text.slice(0, match.index) + ' ' + text.slice((match.index ?? 0) + match[0].length)).replace(ANY_TAG, '');
  return {main: main.replace(/\s+/g, ' ').trim(), note: segments(match[1].trim())};
}
