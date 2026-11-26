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

  it('plays the base game without Corporate Era once the bot reports it (nocorpera), refuses it otherwise', () => {
    expect(rustOptionsText(options({corporateEra: false}), 2, ['noCorporateEra'])).deep.eq({text: 'nocorpera'});
    expect(rustOptionsText(options({corporateEra: false}), 2, [])).deep.eq({unsupported: 'without corporate era'});
  });

  it('names the TS board names of the Rust board files', () => {
    expect(rustOptionsText(options({boardName: BoardName.AMAZONIS}), 2)).deep.eq({text: 'board=amazonis-p'});
    expect(rustOptionsText(options({boardName: BoardName.AMAZONIS_PLANITIA}), 2)).deep.eq({text: 'board=amazonis-planitia'});
  });

  it('refuses expansions the Rust AI does not know', () => {
    expect(rustOptionsText(options({aresExtension: true}), 2)).deep.eq({unsupported: 'aresExtension'});
    expect(rustOptionsText(options({moonExpansion: true}), 2)).deep.eq({unsupported: 'moonExpansion'});
    expect(rustOptionsText(options({bannedCards: ['Algae' as any]}), 2, [], ['corpera'])).deep.eq({text: ''});
    expect(rustOptionsText(options({customCorporationsList: ['CrediCor' as any]}), 2, [], ['corpera'])).deep.eq({text: ''});
    expect(rustOptionsText(options({customCorporationsList: ['Aphrodite' as any]}), 2, [], ['corpera']))
      .deep.eq({unsupported: 'cards the AI does not know in customCorporations'});
  });
});

describe('setupOf', () => {
  it('names the first player TS drew, so the Rust game starts with the same seat', () => {
    const players = [TestPlayer.BLUE.newPlayer(), TestPlayer.ORANGE.newPlayer()];
    const game = Game.newInstance('game-first-player', players, players[1], 'spectator-first-player');
    expect(setupOf(game, '', []).firstPlayer).eq(1);
  });

  it('names the game, so the bot writes its decision log to <gameId>.jsonl', () => {
    const players = [TestPlayer.BLUE.newPlayer(), TestPlayer.ORANGE.newPlayer()];
    const game = Game.newInstance('game-decision-log', players, players[0], 'spectator-decision-log');
    expect(setupOf(game, '', []).gameId).eq('game-decision-log');
  });
});
