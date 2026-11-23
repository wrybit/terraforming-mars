import {expect} from 'chai';
import {DEFAULT_GAME_OPTIONS, GameOptions} from '../../../src/server/game/GameOptions';
import {BoardName} from '../../../src/common/boards/BoardName';
import {RandomMAOptionType} from '../../../src/common/ma/RandomMAOptionType';
import {rustOptionsText, setupOf} from '../../../src/server/ai/rust/rustSetup';
import {Game} from '../../../src/server/Game';
import {TestPlayer} from '../../TestPlayer';

function options(changes: Partial<GameOptions>): GameOptions {
  return {...DEFAULT_GAME_OPTIONS, preludeExtension: true, draftVariant: true, ...changes};
}

describe('rustOptionsText', () => {
  it('writes the default setup as an empty text', () => {
    expect(rustOptionsText(options({}), 2)).deep.eq({text: ''});
  });

  it('writes board, players and expansions as Rust flags', () => {
    const result = rustOptionsText(options({boardName: BoardName.HELLAS, venusNextExtension: true, solarPhaseOption: true,
      coloniesExtension: true, turmoilExtension: true, draftVariant: false, randomMA: RandomMAOptionType.LIMITED}), 3);
    expect(result).deep.eq({text: 'board=hellas,players=3,nodraft,venus,wgt,colonies,turmoil,randomma'});
  });

  it('names the TS board names of the Rust board files', () => {
    expect(rustOptionsText(options({boardName: BoardName.AMAZONIS}), 2)).deep.eq({text: 'board=amazonis-p'});
    expect(rustOptionsText(options({boardName: BoardName.AMAZONIS_PLANITIA}), 2)).deep.eq({text: 'board=amazonis-planitia'});
  });

  it('refuses expansions the Rust AI does not know', () => {
    expect(rustOptionsText(options({aresExtension: true}), 2)).deep.eq({unsupported: 'aresExtension'});
    expect(rustOptionsText(options({moonExpansion: true}), 2)).deep.eq({unsupported: 'moonExpansion'});
    expect(rustOptionsText(options({bannedCards: ['Algae' as any]}), 2)).deep.eq({unsupported: 'custom card or milestone lists'});
  });
});

describe('setupOf', () => {
  it('names the first player TS drew, so the Rust game starts with the same seat', () => {
    const players = [TestPlayer.BLUE.newPlayer(), TestPlayer.ORANGE.newPlayer()];
    const game = Game.newInstance('game-first-player', players, players[1], 'spectator-first-player');
    expect(setupOf(game, '', []).firstPlayer).eq(1);
  });
});
