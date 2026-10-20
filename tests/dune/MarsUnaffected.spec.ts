import {expect} from 'chai';
import {testGame} from '../TestGame';
import {TestPlayer} from '../TestPlayer';
import {IGame} from '../../src/server/IGame';
import {Game} from '../../src/server/Game';
import {GameCards} from '../../src/server/GameCards';
import {DEFAULT_GAME_OPTIONS} from '../../src/server/game/GameOptions';
import {BoardName} from '../../src/common/boards/BoardName';
import {DuneExpansion} from '../../src/server/dune/DuneExpansion';
import {Server} from '../../src/server/models/ServerModel';
import {DUNE_CARD_MODULE} from '../../src/common/dune/DuneModule';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {cast} from '../../src/common/utils/utils';
import {finishGeneration, formatMessage} from '../TestingUtils';
import {statsGameTheme} from '../../src/common/stats/statsBoardKey';
import {StatsGameDetails} from '../../src/common/stats/StatsGame';

// RULE (applies to every change of the Dune theme or expansion): Mars must not break.
// A game without the Dune theme and without Dune modules has to behave exactly like before Dune existed:
// no Dune data, no Dune cards, no Dune actions, no Dune board markers, no extra waits between generations.
// If one of these tests fails, the Dune change leaks into Mars – fix the change, never the test.
describe('Mars is unaffected by Dune', () => {
  let game: IGame;
  let player1: TestPlayer;
  let player2: TestPlayer;

  beforeEach(() => {
    [game, player1, player2] = testGame(2);
  });

  it('plays on Tharsis with the Mars theme and keeps no Dune data', () => {
    expect(game.gameOptions.theme).eq('mars');
    expect(game.gameOptions.boardName).eq(BoardName.THARSIS);
    expect(game.gameOptions.duneModules ?? []).is.empty;
    expect(game.duneData).is.undefined;
    const restored = Game.deserialize(JSON.parse(JSON.stringify(game.serialize())));
    expect(restored.duneData).is.undefined;
  });

  it('deals no Dune cards', () => {
    const names = new GameCards(DEFAULT_GAME_OPTIONS).getProjectCards().map((card) => card.name as string);
    for (const duneCard of Object.keys(DUNE_CARD_MODULE)) {
      expect(names).not.includes(duneCard);
    }
  });

  it('offers no Dune actions', () => {
    expect(DuneExpansion.actions(player1)).is.undefined;
    const titles = cast(player1.getActions(), OrOptions).options.map((option) => formatMessage(option.title));
    expect(titles.some((title) => /dune/i.test(title))).is.false;
  });

  it('sends no Dune model and no worm or war field to the client', () => {
    const model = Server.getPlayerModel(player1);
    expect(model.game.dune).is.undefined;
    expect(model.game.spaces.some((space) => space.worm || space.warField)).is.false;
  });

  it('counts every non-Arrakis game as Mars in the statistics (Mars side of the theme switch)', () => {
    for (const boardName of [BoardName.THARSIS, BoardName.HELLAS, BoardName.ELYSIUM]) {
      expect(statsGameTheme({boardName} as StatsGameDetails)).eq('mars');
    }
    // Older games without a known board stay with Mars as well
    expect(statsGameTheme(undefined)).eq('mars');
    expect(statsGameTheme({boardName: BoardName.ARRAKIS_61} as StatsGameDetails)).eq('dune');
  });

  it('goes from one generation to the next without waiting for Dune steps', () => {
    const generation = game.generation;
    finishGeneration(game);
    expect(game.generation).eq(generation + 1);
    expect(player2.getWaitingFor()).is.not.undefined;
  });
});
