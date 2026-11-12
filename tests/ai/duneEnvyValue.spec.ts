import {expect} from 'chai';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {clearPlayerTunings, isTuningVariant, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {envyCost} from '../../src/server/ai/duneEnvyValue';
import {extensionValue} from '../../src/server/ai/valueExtensions';

// Round 202: the TR the CHOAM envy will cost at the end of the generation counts against the position.
describe('AI Dune envy value', () => {
  afterEach(() => clearPlayerTunings());

  it('costs the TR of the coming Landsraad vote with the variant', () => {
    const [game, player] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['choam']});
    const data = game.duneData!.smuggling!;
    expect(isTuningVariant('envyAversion1')).eq(true);
    data.suspicion[player.id] = 4;
    expect(envyCost(player, 10)).eq(0);
    setPlayerTuning(player.id, 'envyAversion1');
    // envy 4 → 2 TR
    expect(envyCost(player, 10)).eq(20);
    expect(extensionValue(player, {terraformRating: 10, victoryPoint: 7})).eq(-20);
    data.suspicion[player.id] = 2;
    expect(envyCost(player, 10)).eq(0);
    setPlayerTuning(player.id, 'envyAversion05');
    data.suspicion[player.id] = 3;
    expect(envyCost(player, 10)).eq(5);
  });

  it('costs nothing without CHOAM', () => {
    const [, player] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61});
    setPlayerTuning(player.id, 'envyAversion1');
    expect(envyCost(player, 10)).eq(0);
  });
});
