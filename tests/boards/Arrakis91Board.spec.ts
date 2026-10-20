import {expect} from 'chai';
import {DEFAULT_GAME_OPTIONS} from '../../src/server/game/GameOptions';
import {Arrakis91Board} from '../../src/server/boards/Arrakis91Board';
import {Arrakis61Board} from '../../src/server/boards/Arrakis61Board';
import {SeededRandom} from '../../src/common/utils/Random';
import {SpaceBonus} from '../../src/common/boards/SpaceBonus';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {ARRAKIS_91_LAYOUT} from '../../src/common/dune/arrakisLayout';
import {arrakisCoordinate, arrakisSpaceIds} from '../../src/common/dune/arrakisCoordinates';
import {wormDirection, wormPath} from '../../src/server/dune/Worm';
import {MarsBoard} from '../../src/server/boards/MarsBoard';

// The large Arrakis grows the standard one by 91 / 61 spaces: every total grows with it (scripts/make-arrakis-91.ts)
function totals(board: MarsBoard) {
  const count = (bonus: SpaceBonus) => board.spaces.reduce((sum, space) => sum + space.bonus.filter((b) => b === bonus).length, 0);
  return {
    spaces: board.spaces.filter((space) => space.spaceType !== SpaceType.COLONY).length,
    oceans: board.spaces.filter((space) => space.spaceType === SpaceType.OCEAN).length,
    volcanic: board.spaces.filter((space) => space.volcanic === true).length,
    steel: count(SpaceBonus.STEEL),
    titanium: count(SpaceBonus.TITANIUM),
    cards: count(SpaceBonus.DRAW_CARD),
    // Plant-like bonuses change kind with the terrain under them (scripts/arrakisGeography.ts), their sum grows
    plantLike: count(SpaceBonus.PLANT) + count(SpaceBonus.HEAT) + count(SpaceBonus.ENERGY),
  };
}

describe('Arrakis91Board', () => {
  const large = Arrakis91Board.newInstance(DEFAULT_GAME_OPTIONS, new SeededRandom(0));
  const standard = Arrakis61Board.newInstance(DEFAULT_GAME_OPTIONS, new SeededRandom(0));

  it('has 91 spaces and the standard totals grown by 91 / 61', () => {
    const grown = Object.fromEntries(Object.entries(totals(standard)).map(([key, value]) => [key, Math.round(value * 91 / 61)]));
    expect(totals(large)).deep.eq({...grown, spaces: 91, volcanic: 4});
  });

  it('reserves Arrakeen like Noctis City, with the bonus of the standard Arrakeen', () => {
    const arrakeen = large.getSpaceOrThrow(large.noctisCitySpaceId!);
    expect(arrakeen.spaceType).eq(SpaceType.LAND);
    expect(arrakeen.bonus).deep.eq([SpaceBonus.PLANT, SpaceBonus.PLANT]);
    expect(ARRAKIS_91_LAYOUT.zones[arrakeen.id]).eq('city');
  });

  it('has terrain for every space and spice fields exactly on the oceans', () => {
    expect(Object.keys(ARRAKIS_91_LAYOUT.zones).sort()).deep.eq(arrakisSpaceIds(ARRAKIS_91_LAYOUT).sort());
    const oceans = large.spaces.filter((space) => space.spaceType === SpaceType.OCEAN).map((space) => space.id).sort();
    const spicefields = Object.entries(ARRAKIS_91_LAYOUT.zones).filter(([, zone]) => zone === 'spicefield').map(([id]) => id).sort();
    expect(spicefields).deep.eq(oceans);
  });

  it('labels its spaces A1 … K6', () => {
    expect(large.A9['03' as never]).eq('A1');
    expect(large.A9['93' as never]).eq('K6');
  });

  // Jens, 20 Oct 2026: the centre band of the large board, not the spaces of the standard one
  it('lets the worm start in the centre band, on land it can leave in every direction', () => {
    const labels = ARRAKIS_91_LAYOUT.wormStartSpaces.map((id) => arrakisCoordinate(ARRAKIS_91_LAYOUT, id));
    expect(labels).deep.eq(['F4', 'F5', 'F6', 'F7', 'G5', 'G6', 'H4', 'H5', 'H6', 'I3', 'I4', 'I5', 'J3', 'J4', 'J5']);
    const board = Arrakis91Board.newInstance(DEFAULT_GAME_OPTIONS, new SeededRandom(0));
    for (const id of ARRAKIS_91_LAYOUT.wormStartSpaces) {
      expect(board.getSpaceOrThrow(id).spaceType, id).eq(SpaceType.LAND);
      for (let roll = 1; roll <= 6; roll++) {
        const direction = wormDirection(board, id, roll);
        expect(wormPath(board, id, direction, 1).length, id + ' roll ' + roll).eq(1);
      }
    }
  });
});
