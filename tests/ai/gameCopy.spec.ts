import {expect} from 'chai';
import {testGame} from '../TestGame';
import {hideUnknownCards, snapshotOf} from '../../src/server/ai/gameCopy';
import {rememberPassedCards} from '../../src/server/ai/draftMemory';
import {runInSandbox} from '../../src/server/ai/simulationSandbox';
import {Game} from '../../src/server/Game';

type SerializedPlayer = {id: string, cardsInHand: Array<string>, [list: string]: unknown};
const HIDDEN = ['cardsInHand', 'draftedCards', 'draftHand', 'dealtProjectCards'];
type SerializedGame = {players: Array<SerializedPlayer>, projectDeck: {drawPile: Array<string>}};

describe('AI game copy', () => {
  it('hides the opponent hand and the draw pile order, but keeps the own hand', () => {
    const [game, player, opponent] = testGame(2);
    player.cardsInHand.push(...game.projectDeck.drawN(game, 5));
    opponent.cardsInHand.push(...game.projectDeck.drawN(game, 8));
    const exact = JSON.parse(snapshotOf(game)) as SerializedGame;
    const exactOwn = exact.players.find((serialized) => serialized.id === player.id)!;
    const exactOpponent = exact.players.find((serialized) => serialized.id === opponent.id)!;

    let changedHands = 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      const view = JSON.parse(snapshotOf(game, player)) as SerializedGame;
      const own = view.players.find((serialized) => serialized.id === player.id)!;
      const other = view.players.find((serialized) => serialized.id === opponent.id)!;
      expect(own.cardsInHand).deep.eq(exactOwn.cardsInHand);
      expect(other.cardsInHand).has.length(8);
      // Same unseen cards overall (opponent hand + draw pile), only redistributed.
      const unseen = (serialized: SerializedGame, hidden: SerializedPlayer) =>
        [...HIDDEN.flatMap((list) => (hidden[list] as Array<string> | undefined) ?? []), ...serialized.projectDeck.drawPile].sort();
      expect(unseen(view, other)).deep.eq(unseen(exact, exactOpponent));
      if (other.cardsInHand.join() !== exactOpponent.cardsInHand.join()) {
        changedHands++;
      }
    }
    expect(changedHands).greaterThan(3);
  });
});

describe('AI draft memory', () => {
  it('puts cards passed in the draft into the imagined opponent hand', () => {
    const [game, player, opponent] = testGame(2);
    opponent.cardsInHand.push(...game.projectDeck.drawN(game, 4));
    const passed = game.projectDeck.drawPile.slice(-2).map((card) => card.name);
    rememberPassedCards(game.id, player.id, opponent.id, passed);
    runInSandbox(() => {
      const copy = Game.deserialize(game.serialize());
      // random() = 0: every remembered card counts as kept.
      hideUnknownCards(copy, player.id, () => 0, true);
      const hand = copy.getPlayerById(opponent.id).cardsInHand.map((card) => card.name);
      expect(hand).to.include.members(passed);
      expect(hand).has.length(4);
    });
  });
});
