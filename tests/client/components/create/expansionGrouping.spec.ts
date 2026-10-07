import {expect} from 'chai';
import {EXPANSION_GROUPINGS, EXPANSION_TILES, groupExpansions} from '@/client/components/create/expansionGrouping';
import {contentLine} from '@/client/components/create/expansionContentLine';

describe('expansionGrouping', () => {
  for (const grouping of EXPANSION_GROUPINGS) {
    it(`${grouping}: every tile lands in exactly one group`, () => {
      const modules = groupExpansions(grouping).flatMap((group) => group.tiles.map((tile) => tile.module));
      expect(modules).has.members(EXPANSION_TILES.map((tile) => tile.module));
      expect(modules).has.length(EXPANSION_TILES.length);
    });
  }

  it('groups by source as official and fan-made', () => {
    expect(groupExpansions('source').map((group) => group.title)).deep.eq(['Official', 'Fan-made']);
  });

  it('puts expansions with corporations first and lights the count in the content line', () => {
    const [withGroup, withoutGroup] = groupExpansions('corporation');
    expect(withGroup.tiles.map((tile) => tile.module)).includes('venus');
    expect(withoutGroup.tiles.map((tile) => tile.module)).includes('starwars');
    const venus = withGroup.tiles.find((tile) => tile.module === 'venus')!;
    const line = contentLine(venus, withGroup.highlight, true);
    expect(line[0].text).eq('Official');
    expect(line[1].highlighted).is.true;
    expect(line[1].text).matches(/corp/);
  });
});
