import {expect} from 'chai';
import {testGame} from '../TestGame';
import {Phase} from '../../src/common/Phase';
import {runAllActions} from '../TestingUtils';
import {cast} from '../../src/common/utils/utils';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {Server} from '../../src/server/models/ServerModel';
import {IGame} from '../../src/server/IGame';
import {TestPlayer} from '../TestPlayer';

// Buys the first two offered cards, like a click in the research phase
function buyTwo(player: TestPlayer) {
  const input = cast(player.getWaitingFor(), SelectCard);
  player.process({type: 'card', cards: input.cards.slice(0, 2).map((card) => card.name)});
  runAllActions(player.game);
}

function startResearch(game: IGame) {
  game.generation = 2;
  game.players.forEach((player) => player.megaCredits = 20);
  game.gotoResearchPhase();
}

describe('researchStock', () => {
  it('others see M€ and hand size from before the purchase until everyone has bought', () => {
    const [game, player, player2] = testGame(2);
    startResearch(game);
    const discardBefore = game.projectDeck.discardPile.length;
    buyTwo(player);
    expect(player.megaCredits).eq(14);
    expect(game.phase).eq(Phase.RESEARCH);

    const forOther = Server.getPlayerModel(player2).players.find((p) => p.color === player.color)!;
    expect(forOther.megacredits).eq(20);
    expect(forOther.cardsInHandNbr).eq(0);
    expect(Server.getPlayerModel(player2).game.discardPileSize).eq(discardBefore);
    const forSpectator = Server.getSpectatorModel(game).players.find((p) => p.color === player.color)!;
    expect(forSpectator.megacredits).eq(20);

    // The buyer sees their own real values
    const forSelf = Server.getPlayerModel(player).thisPlayer;
    expect(forSelf.megacredits).eq(14);
    expect(forSelf.cardsInHandNbr).eq(2);
  });

  it('shows the real values once everyone has bought', () => {
    const [game, player, player2] = testGame(2);
    startResearch(game);
    buyTwo(player);
    buyTwo(player2);
    expect(game.phase).eq(Phase.ACTION);
    const forOther = Server.getPlayerModel(player2).players.find((p) => p.color === player.color)!;
    expect(forOther.megacredits).eq(14);
    expect(forOther.cardsInHandNbr).eq(2);
  });

  it('keeps the stock in saves so a restart mid-phase still hides it', () => {
    const [game, player] = testGame(2);
    startResearch(game);
    buyTwo(player);
    expect(player.serialize().researchStock?.megaCredits).eq(20);
  });
});
