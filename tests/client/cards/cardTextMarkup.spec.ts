import {expect} from 'chai';
import {CARD_TEXT_MARKUP} from '@/client/cards/cardTextMarkup';
import {parseCardTextMarkup} from '@/client/cards/parseCardTextMarkup';
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

describe('CARD_TEXT_MARKUP', () => {
  // Fails when upstream rewords a card text: update the key (and its restructured text) then
  const cardTexts = collectStrings(cards, new Set());
  for (const [original, restructured] of Object.entries(CARD_TEXT_MARKUP)) {
    it(original, () => {
      expect(cardTexts.has(original), 'no card has this text any more').is.true;
      const parts = parseCardTextMarkup(restructured);
      const segments = [...parts.main, ...(parts.note ?? [])];
      expect(segments.some((segment) => segment.style !== 'plain'), 'no highlighted words').is.true;
      if (parts.note !== undefined) {
        expect(parts.note.some((segment) => segment.style !== 'plain'), 'note without highlighted words').is.true;
      }
    });
  }
});
