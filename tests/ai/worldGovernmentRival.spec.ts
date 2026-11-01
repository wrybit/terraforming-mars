import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {worldGovernmentRivalPenalty} from '../../src/server/ai/worldGovernmentRival';
import {VenusianAnimals} from '../../src/server/cards/venusNext/VenusianAnimals';
import {VenusianInsects} from '../../src/server/cards/venusNext/VenusianInsects';

// A free Venus step may unlock hidden Venus cards of a rival: penalised by the rival's Venus tags.
describe('AI World Government rival', () => {
  afterEach(() => clearPlayerTunings());

  it('is off in the baseline', () => {
    const [, player, opponent] = testGame(2, {venusNextExtension: true});
    opponent.playedCards.push(new VenusianAnimals(), new VenusianInsects());
    expect(worldGovernmentRivalPenalty(player, true, 8)).eq(0);
  });

  it('costs a Venus step per rival Venus tag, nothing for other steps', () => {
    const [, player, opponent] = testGame(2, {venusNextExtension: true});
    setPlayerTuning(player.id, 'worldGovernmentRival');
    expect(worldGovernmentRivalPenalty(player, true, 8)).eq(0);
    opponent.playedCards.push(new VenusianAnimals(), new VenusianInsects());
    expect(worldGovernmentRivalPenalty(player, true, 8)).to.be.greaterThan(0);
    expect(worldGovernmentRivalPenalty(player, false, 8)).eq(0);
  });
});
