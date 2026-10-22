import {expect} from 'chai';
import {ALL_DUNE_AWARDS, ALL_DUNE_MILESTONES, DUNE_ONLY_AWARDS, DUNE_ONLY_MILESTONES} from '@/common/dune/duneGoals';
import {buildEntries} from '@/client/components/cardlist/cardListEntries';
import {EXPANSION_OPTIONS, TYPE_OPTIONS} from '@/client/components/cardlist/cardListOptions';
import {defaultExpansions, themeEntries, themeExpansionOptions, themeTagOptions, themeTypeOptions} from '@/client/components/cardlist/cardListTheme';
import {GAME_MODULES} from '@/common/cards/GameModule';
import {Tag} from '@/common/cards/Tag';
import {hashToModel} from '@/client/components/cardlist/CardListModel';

describe('cardListTheme', () => {
  const entries = buildEntries();

  it('leaves the Mars card list exactly as before', () => {
    // Mars: everything except the goals that only exist on Arrakis (common/dune/duneGoals.ts)
    const duneOnly: ReadonlyArray<string> = [...DUNE_ONLY_MILESTONES, ...DUNE_ONLY_AWARDS];
    expect(themeEntries(entries, 'mars')).deep.eq(entries.filter((entry) => !duneOnly.includes(entry.name)));
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
    expect(dune.filter((entry) => entry.type === 'milestones').map((entry) => entry.name).sort()).deep.eq([...ALL_DUNE_MILESTONES].sort());
    expect(dune.filter((entry) => entry.type === 'awards').map((entry) => entry.name).sort()).deep.eq([...ALL_DUNE_AWARDS].sort());
  });

  it('offers the Dune expansion as a filter and leaves out tags no Dune card carries', () => {
    expect(themeExpansionOptions('dune').map((option) => option.key)).deep.eq(['base', 'corpera', 'prelude', 'prelude2', 'dune']);
    expect(themeTagOptions('dune', themeEntries(entries, 'dune')).map((option) => option.key)).not.includes('moon');
    expect(defaultExpansions('dune', GAME_MODULES).dune).is.true;
    expect(hashToModel('', 'dune').expansions.dune).is.true;
  });
});
