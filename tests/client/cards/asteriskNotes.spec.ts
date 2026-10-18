import {expect} from 'chai';
import {ASTERISK_NOTES} from '@/client/cards/asteriskNotes';
import {splitAsteriskNote} from '@/client/cards/splitAsteriskNote';
import cards from '@/genfiles/cards.json';

function collectStrings(value: unknown, into: Set<string>): Set<string> {
  if (typeof value === 'string') {
    into.add(value.replace(/\s+/g, ' ').trim());
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, into));
  } else if (value !== null && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, into));
  }
  return into;
}

describe('ASTERISK_NOTES', () => {
  // Fails when upstream rewords a card text: update the key (and its restructured text) then
  const cardTexts = collectStrings(cards, new Set());
  for (const [original, restructured] of Object.entries(ASTERISK_NOTES)) {
    it(original, () => {
      expect(cardTexts.has(original), 'no card has this text any more').is.true;
      const split = splitAsteriskNote(restructured);
      expect(split.note, 'note missing').is.not.undefined;
      expect(split.note!.some((segment) => segment.emphasis), 'emphasis missing').is.true;
    });
  }
});
