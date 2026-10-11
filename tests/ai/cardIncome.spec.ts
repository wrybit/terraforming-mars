import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {drawTriggers, effectDrawsPerGeneration} from '../../src/server/ai/cardIncome';
import {playerValue, valuationContext} from '../../src/server/ai/stateValue';
import {OlympusConference} from '../../src/server/cards/base/OlympusConference';
import {MarsUniversity} from '../../src/server/cards/base/MarsUniversity';
import {PointLuna} from '../../src/server/cards/prelude/PointLuna';
import {TechnologyDemonstration} from '../../src/server/cards/base/TechnologyDemonstration';
import {Research} from '../../src/server/cards/base/Research';
import {Tag} from '../../src/common/cards/Tag';

describe('AI card income', () => {
  afterEach(() => clearPlayerTunings());

  it('reads tag-triggered draws from the card icons', () => {
    expect(drawTriggers(new PointLuna())).deep.eq([{tag: Tag.EARTH, cards: 1}]);
    expect(drawTriggers(new OlympusConference())).deep.eq([{tag: Tag.SCIENCE, cards: 0.5}]);
    expect(drawTriggers(new MarsUniversity())[0].tag).eq(Tag.SCIENCE);
    expect(drawTriggers(new MarsUniversity())[0].cards).is.lessThan(0.5);
    // Drawing once when played is no income.
    expect(drawTriggers(new TechnologyDemonstration())).is.empty;
  });

  it('expects more draws with more own tags of the trigger kind', () => {
    const [game, player] = testGame(2);
    game.generation = 5;
    const conference = new OlympusConference();
    const before = effectDrawsPerGeneration(conference, player);
    player.playedCards.push(new Research(), new TechnologyDemonstration());
    expect(effectDrawsPerGeneration(conference, player)).is.greaterThan(before);
  });

  it('values a card-drawing effect like production', () => {
    const [game, player] = testGame(2);
    game.generation = 3;
    // Science tags played so far and in hand: the conference keeps drawing.
    player.playedCards.push(new OlympusConference(), new Research(), new TechnologyDemonstration(), new MarsUniversity());
    const context = valuationContext(game, player);
    const flat = playerValue(player, context);
    setPlayerTuning(player.id, 'cardIncome');
    expect(playerValue(player, context)).is.greaterThan(flat);
  });
});
