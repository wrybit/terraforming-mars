import {expect} from 'chai';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {kanlyStayInPenalty, stayInStake} from '../../src/server/ai/duneKanlyStayIn';
import {passExtensionPenalty} from '../../src/server/ai/passExtensions';

// Round 205: a passed owner cannot defend in the Kanly, so passing early puts tiles at stake.
describe('AI Dune Kanly stay-in', () => {
  afterEach(() => clearPlayerTunings());

  function setup() {
    const [game, player, opponent] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['kanly']});
    game.addGreenery(player, game.board.getAvailableSpacesForGreenery(player)[0]);
    return {game, player, opponent, kanly: game.duneData!.kanly!};
  }

  it('puts the own tile at stake while an armed opponent is still in the generation', () => {
    const {game, player, opponent, kanly} = setup();
    expect(stayInStake(player)).eq(0);
    kanly.garrison[opponent.id] = 1;
    opponent.megaCredits = 8;
    expect(stayInStake(player)).eq(1);
    opponent.megaCredits = 7;
    expect(stayInStake(player)).eq(0);
    opponent.megaCredits = 8;
    game.playerHasPassed(opponent);
    expect(stayInStake(player)).eq(0);
  });

  it('keeps the chance of the own garrison and of a running battle it can still join', () => {
    const {game, player, opponent, kanly} = setup();
    game.addGreenery(opponent, game.board.getAvailableSpacesForGreenery(opponent)[0]);
    kanly.garrison[opponent.id] = 1;
    expect(stayInStake(opponent)).eq(1);
    kanly.foughtThisGeneration = true;
    expect(stayInStake(opponent)).eq(0);
    kanly.foughtThisGeneration = false;
    const ownTile = game.board.spaces.find((space) => space.player?.id === player.id)!;
    kanly.battle = {spaceId: ownTile.id, opener: opponent.id, troops: {[opponent.id]: 1}};
    expect(stayInStake(player)).eq(0);
    kanly.garrison[player.id] = 1;
    expect(stayInStake(player)).eq(1);
  });

  it('costs passing only with the variant, priced with the VP value', () => {
    const {player, opponent, kanly} = setup();
    kanly.garrison[opponent.id] = 1;
    opponent.megaCredits = 8;
    expect(kanlyStayInPenalty(player, 10)).eq(0);
    const before = passExtensionPenalty(player, 10);
    setPlayerTuning(player.id, 'kanlyStayIn');
    expect(kanlyStayInPenalty(player, 10)).eq(10);
    expect(passExtensionPenalty(player, 10)).eq(before + 10);
  });
});
