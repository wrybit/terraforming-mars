import {expect} from 'chai';
import {DEFAULT_GAME_OPTIONS} from '../../src/server/game/GameOptions';
import {Arrakis61Board} from '../../src/server/boards/Arrakis61Board';
import {TharsisBoard} from '../../src/server/boards/TharsisBoard';
import {MarsBoard} from '../../src/server/boards/MarsBoard';
import {SeededRandom} from '../../src/common/utils/Random';
import {SpaceBonus} from '../../src/common/boards/SpaceBonus';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {SpaceName} from '../../src/common/boards/SpaceName';

// Arrakis must stay as strong as Tharsis: same spaces and the same bonus totals. Plant bonuses where nothing grows
// became heat or energy one to one, so plants + heat + energy together equal the plants of Tharsis.
function totals(board: MarsBoard) {
  const count = (bonus: SpaceBonus) => board.spaces.reduce((sum, space) => sum + space.bonus.filter((b) => b === bonus).length, 0);
  return {
    spaces: board.spaces.filter((space) => space.spaceType !== SpaceType.COLONY).length,
    oceans: board.spaces.filter((space) => space.spaceType === SpaceType.OCEAN).length,
    volcanic: board.spaces.filter((space) => space.volcanic === true).length,
    doubleBonuses: board.spaces.filter((space) => space.bonus.length === 2).length,
    steel: count(SpaceBonus.STEEL),
    titanium: count(SpaceBonus.TITANIUM),
    cards: count(SpaceBonus.DRAW_CARD),
    plantLike: count(SpaceBonus.PLANT) + count(SpaceBonus.HEAT) + count(SpaceBonus.ENERGY),
  };
}

describe('Arrakis61Board', () => {
  const arrakis = Arrakis61Board.newInstance(DEFAULT_GAME_OPTIONS, new SeededRandom(0));
  const tharsis = TharsisBoard.newInstance(DEFAULT_GAME_OPTIONS, new SeededRandom(0));

  it('has the same totals as Tharsis', () => {
    expect(totals(arrakis)).to.deep.eq(totals(tharsis));
  });

  it('reserves Arrakeen like Noctis City', () => {
    expect(arrakis.noctisCitySpaceId).eq(SpaceName.ARRAKEEN);
    const arrakeen = arrakis.getSpaceOrThrow(SpaceName.ARRAKEEN);
    expect(arrakeen.spaceType).eq(SpaceType.LAND);
    expect(arrakeen.bonus).deep.eq([SpaceBonus.PLANT, SpaceBonus.PLANT]);
  });
});
