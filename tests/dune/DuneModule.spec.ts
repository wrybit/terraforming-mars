import {expect} from 'chai';
import {duneModuleConflicts, PLAYABLE_DUNE_MODULES} from '../../src/common/dune/DuneModule';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {chooseBazaarWare} from '../../src/server/ai/duneChoices';
import {buyInput} from '../../src/server/dune/Bazaar';
import {cast} from '../../src/common/utils/utils';

describe('Dune expansion modules', () => {
  it('only with the Dune theme and only built modules', () => {
    expect(duneModuleConflicts('dune', undefined)).is.empty;
    expect(duneModuleConflicts('mars', [])).is.empty;
    expect(duneModuleConflicts('dune', PLAYABLE_DUNE_MODULES)).is.empty;
    expect(duneModuleConflicts('mars', ['bazaar'])).has.length(1);
    expect(duneModuleConflicts('dune', ['bazaar', 'unknown'])).has.length(1);
  });

  it('the AI answers a bazaar phase of the former rules with one of its choices', () => {
    const [game, player1] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['bazaar']});
    player1.megaCredits = 60;
    const bazaar = game.duneData?.bazaar;
    if (bazaar === undefined) {
      throw new Error('no bazaar');
    }
    bazaar.slots = ['Bene Gesserit Dossier', 'Cistern of Tabr', null, null, null];
    const input = cast(buyInput(player1, bazaar), OrOptions);
    const response = chooseBazaarWare(input, player1);
    expect(response?.type).eq('or');
  });
});
