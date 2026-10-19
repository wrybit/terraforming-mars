import {expect} from 'chai';
import {DEFAULT_GAME_OPTIONS} from '../../src/server/game/GameOptions';
import {ArrakisLargeBoard} from '../../src/server/boards/ArrakisLargeBoard';
import {ArrakisBoard} from '../../src/server/boards/ArrakisBoard';
import {SeededRandom} from '../../src/common/utils/Random';
import {SpaceBonus} from '../../src/common/boards/SpaceBonus';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {ARRAKIS_LARGE_LAYOUT} from '../../src/common/dune/arrakisLayout';
import {arrakisSpaceIds} from '../../src/common/dune/arrakisCoordinates';
import {MarsBoard} from '../../src/server/boards/MarsBoard';

// The large Arrakis grows the standard one by 91 / 61 spaces: every total grows with it (scripts/make-arrakis-large.ts)
function totals(board: MarsBoard) {
  const count = (bonus: SpaceBonus) => board.spaces.reduce((sum, space) => sum + space.bonus.filter((b) => b === bonus).length, 0);
  return {
    spaces: board.spaces.filter((space) => space.spaceType !== SpaceType.COLONY).length,
    oceans: board.spaces.filter((space) => space.spaceType === SpaceType.OCEAN).length,
    volcanic: board.spaces.filter((space) => space.volcanic === true).length,
    steel: count(SpaceBonus.STEEL),
    titanium: count(SpaceBonus.TITANIUM),
    cards: count(SpaceBonus.DRAW_CARD),
    plants: count(SpaceBonus.PLANT),
    heat: count(SpaceBonus.HEAT),
    energy: count(SpaceBonus.ENERGY),
  };
}

describe('ArrakisLargeBoard', () => {
  const large = ArrakisLargeBoard.newInstance(DEFAULT_GAME_OPTIONS, new SeededRandom(0));
  const standard = ArrakisBoard.newInstance(DEFAULT_GAME_OPTIONS, new SeededRandom(0));

  it('has 91 spaces and the standard totals grown by 91 / 61', () => {
    const grown = Object.fromEntries(Object.entries(totals(standard)).map(([key, value]) => [key, Math.round(value * 91 / 61)]));
    expect(totals(large)).deep.eq({...grown, spaces: 91, volcanic: 4});
  });

  it('reserves Arrakeen like Noctis City, with the bonus of the standard Arrakeen', () => {
    const arrakeen = large.getSpaceOrThrow(large.noctisCitySpaceId!);
    expect(arrakeen.spaceType).eq(SpaceType.LAND);
    expect(arrakeen.bonus).deep.eq([SpaceBonus.PLANT, SpaceBonus.PLANT]);
    expect(ARRAKIS_LARGE_LAYOUT.zones[arrakeen.id]).eq('city');
  });

  it('has terrain for every space and spice fields exactly on the oceans', () => {
    expect(Object.keys(ARRAKIS_LARGE_LAYOUT.zones).sort()).deep.eq(arrakisSpaceIds(ARRAKIS_LARGE_LAYOUT).sort());
    const oceans = large.spaces.filter((space) => space.spaceType === SpaceType.OCEAN).map((space) => space.id).sort();
    const spicefields = Object.entries(ARRAKIS_LARGE_LAYOUT.zones).filter(([, zone]) => zone === 'spicefield').map(([id]) => id).sort();
    expect(spicefields).deep.eq(oceans);
  });

  it('labels its spaces A1 … K6', () => {
    expect(large.A9['03' as never]).eq('A1');
    expect(large.A9['93' as never]).eq('K6');
  });
});
