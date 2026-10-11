import {expect} from 'chai';
import {testGame} from '../TestGame';
import {addCity} from '../TestingUtils';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {chooseAction} from '../../src/server/ai/actionLookahead';
import {sellToAffordResponses, sellToPlayResponses} from '../../src/server/ai/sellToAfford';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {Phase} from '../../src/common/Phase';
import {CardName} from '../../src/common/cards/CardName';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';
import {Sabotage} from '../../src/server/cards/base/Sabotage';
import {PowerPlant} from '../../src/server/cards/base/PowerPlant';

function mayorReady() {
  const [game, player, opponent] = testGame(2);
  game.generation = 4;
  addCity(player);
  addCity(player);
  addCity(player);
  // 7 M€: one short of the milestone.
  player.megaCredits = 7;
  player.cardsInHand.push(new Tardigrades(), new Sabotage(), new PowerPlant());
  return {game, player, opponent};
}

describe('AI sell to afford', () => {
  afterEach(() => clearPlayerTunings());

  it('offers the cheapest card that closes the gap to a milestone', () => {
    const {player} = mayorReady();
    const values = new Map([[CardName.TARDIGRADES, 10], [CardName.SABOTAGE, 1], [CardName.POWER_PLANT, 5]]);
    expect(sellToAffordResponses(player, values)).deep.eq([{type: 'card', cards: [CardName.SABOTAGE]}]);
  });

  it('offers nothing when enough money is there or the hand is too small', () => {
    const {player} = mayorReady();
    player.megaCredits = 8;
    // The award (8 M€) would be affordable too, so nothing to sell.
    expect(sellToAffordResponses(player, new Map())).is.empty;
    player.megaCredits = 2;
    expect(sellToAffordResponses(player, new Map())).is.empty;
  });

  it('sells a card and claims Mayor with 1 M€ missing', () => {
    const {game, player} = mayorReady();
    setPlayerTuning(player.id, 'sellToAfford');
    game.phase = Phase.ACTION;
    player.takeAction();
    const menu = player.getWaitingFor() as OrOptions;
    const response = chooseAction(menu, player, {noise: 0});
    expect(response?.type).eq('or');
    const option = response?.type === 'or' ? menu.options[response.index] : undefined;
    expect(option instanceof SelectCard && option.title).eq('Sell patents');
  });

  it('last generation: sells all other cards to pay for one', () => {
    const [/* game */, player] = testGame(2);
    player.megaCredits = 0;
    const hand = [new PowerPlant(), new PowerPlant(), new PowerPlant(), new PowerPlant(), new PowerPlant()];
    player.cardsInHand.push(...hand);
    // Power Plant costs 4 M€: selling the other 4 pays for it.
    const responses = sellToPlayResponses(player, hand);
    expect(responses.length).greaterThan(0);
    expect(responses[0]).deep.eq({type: 'card', cards: [CardName.POWER_PLANT, CardName.POWER_PLANT, CardName.POWER_PLANT, CardName.POWER_PLANT]});
    // Three cards: selling two gives only 2 M€.
    expect(sellToPlayResponses(player, hand.slice(0, 3))).is.empty;
    expect(player.megaCredits).eq(0);
  });

  it('without the setting it does not sell before the last generation', () => {
    const {game, player} = mayorReady();
    game.phase = Phase.ACTION;
    player.takeAction();
    const menu = player.getWaitingFor() as OrOptions;
    const response = chooseAction(menu, player, {noise: 0});
    const option = response?.type === 'or' ? menu.options[response.index] : undefined;
    expect(option instanceof SelectCard && option.title === 'Sell patents').is.false;
  });
});
