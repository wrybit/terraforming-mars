import {expect} from 'chai';
import fs from 'fs';
import path from 'path';
import {compileRules, ThemeTerms} from '../../src/tools/themeTexts';
import {CardName} from '../../src/common/cards/CardName';
import {ALL_MODULE_MANIFESTS} from '../../src/server/cards/AllManifests';
import {CardManifest} from '../../src/server/cards/ModuleManifest';
import {DUNE_EXPANSIONS, themeAllowsExpansion} from '../../src/common/theme/Theme';
import {asArray} from '../../src/common/utils/utils';

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

  it('names every card a Dune game can deal, with a story line', () => {
    // Project cards, houses and preludes of the base game and the covered expansions, without those needing Venus, Colonies or Turmoil
    const modules = ['base', ...DUNE_EXPANSIONS];
    const dealt = ALL_MODULE_MANIFESTS
      .filter((manifest) => modules.includes(manifest.module))
      .flatMap((manifest) => [manifest.projectCards, manifest.corporationCards, manifest.preludeCards].flatMap((cards) => CardManifest.entries(cards)))
      .filter(([, spec]) => asArray(spec.compatibility ?? []).every((expansion) => themeAllowsExpansion('dune', expansion)))
      .map(([name]) => name);
    expect(dealt.length).to.be.greaterThan(250);
    expect(dealt.filter((name) => english[name] === undefined || english[`flavor:${name}`] === undefined)).deep.eq([]);
  });

  it('never mentions Turmoil in the Landsraad Voice milestone', () => {
    // Dune has no Turmoil, so the milestone drops the "(or 26 with Turmoil.)" of Terraformer in every language
    for (const lang of LANGUAGES) {
      const terms: ThemeTerms = read(`terms/${lang}.json`);
      expect(terms.exact?.['Have a terraform rating of 35 (or 26 with Turmoil.)'], lang).to.match(/35/);
    }
  });
});
