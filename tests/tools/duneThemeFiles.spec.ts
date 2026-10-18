import {expect} from 'chai';
import fs from 'fs';
import path from 'path';
import {compileRules, ThemeTerms} from '../../src/tools/themeTexts';
import {CardName} from '../../src/common/cards/CardName';

// The Dune theme files of every language must match: the same names, rules that compile, and names of real cards
const FOLDER = path.resolve('src/themes/dune');
const LANGUAGES = ['en', 'de', 'fr', 'ru', 'cn', 'pl', 'es', 'br', 'it', 'ko', 'nl', 'hu', 'jp', 'bg', 'nb', 'ua', 'fi'];
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(FOLDER, file), 'utf8'));

describe('Dune theme files', () => {
  const english: Record<string, string> = read('names/en.json');

  for (const lang of LANGUAGES) {
    it(`${lang}: names for exactly the English keys, rules compile`, () => {
      const names: Record<string, string> = read(`names/${lang}.json`);
      expect(Object.keys(names).sort()).deep.eq(Object.keys(english).sort());
      expect(Object.values(names).filter((name) => name.trim() === '')).deep.eq([]);
      const terms: ThemeTerms = read(`terms/${lang}.json`);
      expect(() => compileRules(terms.rules)).not.to.throw();
    });
  }

  it('names cards that exist', () => {
    const cards = new Set<string>(Object.values(CardName));
    const nonCards = ['Terraformer', 'Mayor', 'Gardener', 'Builder', 'Planner', 'Landlord', 'Banker', 'Scientist', 'Thermalist', 'Miner',
      'Tharsis Tholus', 'Ascraeus Mons', 'Pavonis Mons', 'Arsia Mons'];
    const unknown = Object.keys(english).filter((key) => !key.includes(':') && !cards.has(key) && !nonCards.includes(key));
    expect(unknown).deep.eq([]);
  });
});
