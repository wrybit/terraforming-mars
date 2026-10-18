import {expect} from 'chai';
import {duneModuleConflicts, PLAYABLE_DUNE_MODULES} from '../../src/common/dune/DuneModule';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {chooseBazaarWare} from '../../src/server/ai/duneChoices';
import {cast} from '../../src/common/utils/utils';

describe('Dune expansion modules', () => {
  it('only with the Dune theme and only built modules', () => {
    expect(duneModuleConflicts('dune', undefined)).is.empty;
    expect(duneModuleConflicts('mars', [])).is.empty;
    expect(duneModuleConflicts('dune', PLAYABLE_DUNE_MODULES)).is.empty;
    expect(duneModuleConflicts('mars', ['bazaar'])).has.length(1);
    expect(duneModuleConflicts('dune', ['bazaar', 'unknown'])).has.length(1);
  });

  it('the AI answers the bazaar with one of its choices', () => {
    const [game, player1, player2] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS, duneModules: ['bazaar']});
    game.generation = 2;
    player1.megaCredits = 60;
    player2.megaCredits = 60;
    player1.setTerraformRating(19);
    game.playerIsFinishedWithResearchPhase(player1);
    game.playerIsFinishedWithResearchPhase(player2);
    const input = cast(player1.getWaitingFor(), OrOptions);
    const response = chooseBazaarWare(input, player1);
    expect(response?.type).eq('or');
  });
});
