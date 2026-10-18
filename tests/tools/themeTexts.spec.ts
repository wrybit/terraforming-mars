import {expect} from 'chai';
import {applyRules, compileRules, themeTexts} from '../../src/tools/themeTexts';

describe('themeTexts', () => {
  const rules = compileRules([
    ['~TR', 'influence', 'case'],
    ['(?<![\\p{N}])([-−+]?\\d+) ?°? ?C(?![\\p{L}])', '$T1 %', 'case'],
    ['~ocean tiles|oceans', 'spice fields'],
    ['~ocean', 'spice field'],
    ['~heat', 'water'],
  ]);

  it('swaps whole words only and keeps the case of the match', () => {
    expect(applyRules('Place an ocean. OCEANS left: 3. Ocean', rules)).eq('Place an spice field. SPICE FIELDS left: 3. Spice field');
    expect(applyRules('Heat and heatwave', rules)).eq('Water and heatwave');
  });

  it('keeps the replacement as written for abbreviations', () => {
    expect(applyRules('Raise your TR', rules)).eq('Raise your influence');
  });

  it('turns temperatures into water storage percent', () => {
    expect(applyRules('Temperature must be -20 C or lower', rules)).eq('Temperature must be 10 % or lower');
    expect(applyRules('Requires +4 °C', rules)).eq('Requires 34 %');
  });

  it('only lists changed texts, names and exact texts win', () => {
    const texts = themeTexts(['Gain 1 heat', 'Pass', 'Algae'], {'Gain 1 heat': 'Erhalte 1 Wärme'},
      compileRules([['~Wärme', 'Wasser']]), rules, {'Algae': 'Gewürzgras'}, {'Pass': 'Passen'}, false);
    expect(texts).deep.eq({'Gain 1 heat': 'Erhalte 1 Wasser', 'Algae': 'Gewürzgras', 'Pass': 'Passen'});
  });

  it('applies the English rules to texts a language does not translate', () => {
    const texts = themeTexts(['Gain 1 heat'], {}, compileRules([]), rules, {}, {}, false);
    expect(texts).deep.eq({'Gain 1 heat': 'Gain 1 water'});
  });
});
