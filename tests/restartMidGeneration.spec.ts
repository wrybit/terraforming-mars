// Fork: ein Server-Update (Neustart) soll alle Spieler genau dort fortsetzen lassen, wo sie waren –
// hinter der letzten fertigen Aktion, mit bereits gewaehlten Start- und Forschungskarten.

import {expect} from 'chai';
import {Database} from '../src/server/database/Database';
import {Game} from '../src/server/Game';
import {IGame} from '../src/server/IGame';
import {SelectCard} from '../src/server/inputs/SelectCard';
import {SelectInitialCards} from '../src/server/inputs/SelectInitialCards';
import {Phase} from '../src/common/Phase';
import {testGame} from './TestGame';
import {runAllActions} from './TestingUtils';
import {InMemoryDatabase} from './testing/InMemoryDatabase';
import {restoreTestDatabase, setTestDatabase} from './testing/setup';
import {cast, toName} from '../src/common/utils/utils';
import {IProjectCard} from '../src/server/cards/IProjectCard';

// Wie nach einem Neustart: der zuletzt gespeicherte Stand, frisch geladen
async function restartFromLastSave(game: IGame): Promise<IGame> {
  return Game.deserialize(await Database.getInstance().getGameVersion(game.id, game.lastSaveId - 1));
}

describe('restart mid generation', () => {
  beforeEach(() => {
    setTestDatabase(new InMemoryDatabase());
  });

  afterEach(() => {
    restoreTestDatabase();
  });

  it('saves before every action, not only the first of a turn', () => {
    const [game, player] = testGame(2);
    player.actionsTakenThisRound = 1;
    const before = game.lastSaveId;
    player.takeAction();
    expect(game.lastSaveId).eq(before + 1);
  });

  it('keeps bought research cards and the same offer for the others', async () => {
    const [game, player, player2] = testGame(2, {skipInitialCardSelection: true});
    game.generation = 2;
    player.megaCredits = 20;
    player2.megaCredits = 20;
    game.gotoResearchPhase();

    const offer2 = cast(player2.getWaitingFor(), SelectCard<IProjectCard>).cards.map(toName);
    const select = cast(player.popWaitingFor(), SelectCard<IProjectCard>);
    const bought = select.cards[0];
    select.cb([bought]);
    runAllActions(game);

    const restarted = await restartFromLastSave(game);
    const [restartedPlayer, restartedPlayer2] = restarted.players;
    expect(restarted.phase).eq(Phase.RESEARCH);
    expect(restartedPlayer.cardsInHand.map(toName)).deep.eq([bought.name]);
    expect(restartedPlayer.megaCredits).eq(17);
    expect(restartedPlayer.getWaitingFor()).is.undefined;
    expect(cast(restartedPlayer2.getWaitingFor(), SelectCard<IProjectCard>).cards.map(toName)).deep.eq(offer2);

    // Der zweite Spieler kauft nach dem Neustart: danach geht es normal in die Aktionsphase
    restartedPlayer2.process({type: 'card', cards: []});
    runAllActions(restarted);
    expect(restarted.phase).eq(Phase.ACTION);
  });

  it('keeps the start selection of a player who already chose', async () => {
    const [game, player, player2] = testGame(2, {skipInitialCardSelection: false});
    const selection = cast(player.getWaitingFor(), SelectInitialCards);
    const corporation = player.dealtCorporationCards[0].name;
    selection.process({type: 'initialCards', responses: [
      {type: 'card', cards: [corporation]},
      {type: 'card', cards: []},
    ]}, player);
    expect(player2.getWaitingFor()).is.not.undefined;

    const restarted = await restartFromLastSave(game);
    const [restartedPlayer, restartedPlayer2] = restarted.players;
    expect(restartedPlayer.pickedCorporationCard?.name).eq(corporation);
    expect(restartedPlayer.getWaitingFor()).is.undefined;
    cast(restartedPlayer2.getWaitingFor(), SelectInitialCards);
  });
});
