import {expect} from 'chai';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {battleValue, garrisonValue, kanlyValue} from '../../src/server/ai/duneKanlyValue';

// Round 203: Kanly is decided at the end of the generation, so its outcome and the garrison's chances count early.
describe('AI Dune Kanly value', () => {
  afterEach(() => clearPlayerTunings());

  it('values the garrison by the best tile it could take and the running battle by its outcome', () => {
    const [game, player, opponent] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['kanly']});
    const kanly = game.duneData!.kanly!;
    const space = game.board.getAvailableSpacesForGreenery(opponent)[0];
    game.addGreenery(opponent, space);
    expect(garrisonValue(player, 10)).eq(0);
    kanly.garrison[player.id] = 1;
    expect(garrisonValue(player, 10)).eq(10);
    // The owner holds as many Sardaukar at home: no easy target any more
    kanly.garrison[opponent.id] = 1;
    expect(garrisonValue(player, 10)).eq(0);

    kanly.battle = {spaceId: space.id, opener: player.id, troops: {[player.id]: 2}};
    expect(garrisonValue(player, 10)).eq(0);
    expect(battleValue(player, 10)).eq(10);
    expect(battleValue(opponent, 10)).eq(-10);
    // A tie keeps the tile with the owner
    kanly.battle.troops[opponent.id] = 2;
    expect(battleValue(player, 10)).eq(0);
    expect(battleValue(opponent, 10)).eq(0);
  });

  it('counts only with the variant', () => {
    const [game, player, opponent] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['kanly']});
    const space = game.board.getAvailableSpacesForGreenery(opponent)[0];
    game.addGreenery(opponent, space);
    game.duneData!.kanly!.garrison[player.id] = 1;
    const prices = {terraformRating: 12, victoryPoint: 10};
    // Baseline since round 206 = variant kanly.
    expect(kanlyValue(player, prices)).eq(5);
    setPlayerTuning(player.id, 'noKanly');
    expect(kanlyValue(player, prices)).eq(0);
    setPlayerTuning(player.id, 'kanly');
    expect(kanlyValue(player, prices)).eq(5);
    setPlayerTuning(player.id, 'kanlyGarrison1');
    expect(kanlyValue(player, prices)).eq(10);
    setPlayerTuning(player.id, 'kanlyBattleOnly');
    expect(kanlyValue(player, prices)).eq(0);
  });
});
