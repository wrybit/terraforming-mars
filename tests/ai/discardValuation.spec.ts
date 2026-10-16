import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {chooseResponse} from '../../src/server/ai/chooseResponse';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {Phase} from '../../src/common/Phase';
import {Birds} from '../../src/server/cards/base/Birds';
import {Hackers} from '../../src/server/cards/base/Hackers';
import {setOxygenLevel} from '../TestingUtils';

// Mars University in generation 13 discarded Birds (rated human game 2026-10-16): the quick rule keeps VP cards first.
describe('AI discards its weakest card', () => {
  afterEach(() => clearPlayerTunings());

  function discardChoice() {
    const [game, player] = testGame(2);
    game.phase = Phase.ACTION;
    game.generation = 13;
    setOxygenLevel(game, 13);
    const birds = new Birds();
    const hackers = new Hackers();
    player.cardsInHand.push(birds, hackers);
    const input = new SelectCard('Select a card to discard', 'Discard', [birds, hackers], {min: 1, max: 1});
    return {player, input};
  }

  it('keeps the VP animal card and discards the weak one', () => {
    const {player, input} = discardChoice();
    setPlayerTuning(player.id, 'discardValued');
    const response = chooseResponse(input, player, 'hard') as {cards: Array<string>};
    expect(response.cards).to.deep.eq([new Hackers().name]);
  });

  it('baseline quick rule discards the VP card (the error)', () => {
    const {player, input} = discardChoice();
    const response = chooseResponse(input, player, 'hard') as {cards: Array<string>};
    expect(response.cards).to.deep.eq([new Birds().name]);
  });
});
