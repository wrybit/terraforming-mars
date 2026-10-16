import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {awardScoreWithHand} from '../../src/server/ai/awardHandOutlook';
import {relativeValue, valuationContext} from '../../src/server/ai/stateValue';
import {Scientist} from '../../src/server/awards/Scientist';
import {Thermalist} from '../../src/server/awards/Thermalist';
import {PhysicsComplex} from '../../src/server/cards/base/PhysicsComplex';
import {MarsUniversity} from '../../src/server/cards/base/MarsUniversity';
import {OlympusConference} from '../../src/server/cards/base/OlympusConference';
import {SearchForLife} from '../../src/server/cards/base/SearchForLife';
import {Research} from '../../src/server/cards/base/Research';

// Human player: funded Scientist early because his hand held about ten science tags (2026-10-16).
describe('AI counts science cards in hand for Scientist', () => {
  afterEach(() => clearPlayerTunings());

  function scienceHand() {
    const [game, player, opponent] = testGame(2);
    game.generation = 5;
    player.cardsInHand.push(new PhysicsComplex(), new MarsUniversity(), new OlympusConference(), new SearchForLife(), new Research());
    return {game, player, opponent};
  }

  it('adds the share of hand tags to tag awards only', () => {
    const {player} = scienceHand();
    // Research has two science tags: 6 science tags in hand
    expect(awardScoreWithHand(new Scientist(), player, 1)).to.eq(6);
    expect(awardScoreWithHand(new Scientist(), player, 0.5)).to.eq(3);
    expect(awardScoreWithHand(new Thermalist(), player, 1)).to.eq(new Thermalist().getScore(player));
  });

  it('values a funded Scientist higher with the hand outlook, but only for the own hand', () => {
    const {game, player} = scienceHand();
    game.fundAward(player, new Scientist());
    const context = {...valuationContext(game, player), handOwner: player.id};
    setPlayerTuning(player.id, 'noAwardHand');
    const plain = relativeValue(player, context);
    setPlayerTuning(player.id, 'awardHand');
    expect(relativeValue(player, context)).to.be.greaterThan(plain);
    // Without the hand owner (e.g. valuing the opponent's view) the hand does not count
    const blind = relativeValue(player, {...context, handOwner: undefined});
    setPlayerTuning(player.id, 'noAwardHand');
    expect(relativeValue(player, {...context, handOwner: undefined})).to.be.closeTo(blind, 1e-9);
  });
});
