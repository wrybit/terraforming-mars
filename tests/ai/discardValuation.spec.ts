import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {chooseResponse} from '../../src/server/ai/chooseResponse';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {Phase} from '../../src/common/Phase';
import {Birds} from '../../src/server/cards/base/Birds';
import {Hackers} from '../../src/server/cards/base/Hackers';
import {maxOutOceans, setOxygenLevel, setTemperature} from '../TestingUtils';
import {ArcticAlgae} from '../../src/server/cards/base/ArcticAlgae';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';
import {discardGroup} from '../../src/server/ai/discardPriority';

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
    const response = chooseResponse(input, player, 'hard') as {cards: Array<string>};
    expect(response.cards).to.deep.eq([new Hackers().name]);
  });

  it('the old quick rule discarded the VP card (the error)', () => {
    const {player, input} = discardChoice();
    setPlayerTuning(player.id, 'noDiscardValued');
    const response = chooseResponse(input, player, 'hard') as {cards: Array<string>};
    expect(response.cards).to.deep.eq([new Birds().name]);
  });

  it('discards a card that can never be played again first (maximum exceeded)', () => {
    const [game, player] = testGame(2);
    game.phase = Phase.ACTION;
    game.generation = 10;
    // Arctic Algae: at most −12 °C
    setTemperature(game, 0);
    const cards = [new Birds(), new Hackers(), new ArcticAlgae()];
    player.cardsInHand.push(...cards);
    const input = new SelectCard('Select a card to discard', 'Discard', cards, {min: 1, max: 1});
    const response = chooseResponse(input, player, 'hard') as {cards: Array<string>};
    expect(response.cards).to.deep.eq([new ArcticAlgae().name]);
  });

  it('collecting VP cards count as VP cards only while the game still fills them', () => {
    const [game, player] = testGame(2);
    game.generation = 3;
    expect(discardGroup(new Tardigrades(), player, 5)).to.eq(6);
    // Last generation: Tardigrades (4 microbes per VP) brings no VP any more
    game.generation = 14;
    setTemperature(game, 8);
    setOxygenLevel(game, 13);
    maxOutOceans(player);
    expect(discardGroup(new Tardigrades(), player, 1)).to.eq(3);
  });
});
