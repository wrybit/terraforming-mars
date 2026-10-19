import {expect} from 'chai';
import {buildEntries} from '@/client/components/cardlist/cardListEntries';
import {EXPANSION_OPTIONS, TYPE_OPTIONS} from '@/client/components/cardlist/cardListOptions';
import {defaultExpansions, themeEntries, themeExpansionOptions, themeTagOptions, themeTypeOptions} from '@/client/components/cardlist/cardListTheme';
import {GAME_MODULES} from '@/common/cards/GameModule';
import {DUNE_AWARDS, DUNE_MILESTONES} from '@/common/theme/Theme';
import {Tag} from '@/common/cards/Tag';
import {hashToModel} from '@/client/components/cardlist/CardListModel';

describe('cardListTheme', () => {
  const entries = buildEntries();

  it('leaves the Mars card list exactly as before', () => {
    expect(themeEntries(entries, 'mars')).eq(entries);
    expect(themeTypeOptions('mars')).eq(TYPE_OPTIONS);
    expect(themeExpansionOptions('mars')).eq(EXPANSION_OPTIONS);
    const expansions = hashToModel('', 'mars').expansions;
    expect(expansions.dune).is.false;
    expect(GAME_MODULES.filter((module) => module !== 'dune').every((module) => expansions[module])).is.true;
  });

  it('shows only what a Dune game can hold', () => {
    const dune = themeEntries(entries, 'dune');
    const modules = new Set(dune.map((entry) => entry.module));
    expect([...modules].sort()).deep.eq(['base', 'corpera', 'dune', 'prelude', 'prelude2']);
    expect(dune.some((entry) => ['colonyTiles', 'globalEvents', 'agendas', 'ceo'].includes(entry.type))).is.false;
    // No Venus in Dune: neither its cards nor cards of other expansions that need it (e.g. Prelude 2 "Venus Shuttles")
    expect(dune.some((entry) => entry.card?.tags.includes(Tag.VENUS) || entry.card?.compatibility.includes('venus'))).is.false;
    expect(dune.filter((entry) => entry.type === 'milestones').map((entry) => entry.name).sort()).deep.eq([...DUNE_MILESTONES].sort());
    expect(dune.filter((entry) => entry.type === 'awards').map((entry) => entry.name).sort()).deep.eq([...DUNE_AWARDS].sort());
  });

  it('offers the Dune expansion as a filter and leaves out tags no Dune card carries', () => {
    expect(themeExpansionOptions('dune').map((option) => option.key)).deep.eq(['base', 'corpera', 'prelude', 'prelude2', 'dune']);
    expect(themeTagOptions('dune', themeEntries(entries, 'dune')).map((option) => option.key)).not.includes('moon');
    expect(defaultExpansions('dune', GAME_MODULES).dune).is.true;
    expect(hashToModel('', 'dune').expansions.dune).is.true;
  });
});
