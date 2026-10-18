import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {fundedHandValue} from '../../src/server/ai/handFunding';
import {EarthCatapult} from '../../src/server/cards/base/EarthCatapult';
import {SpaceElevator} from '../../src/server/cards/base/SpaceElevator';

// Human games: standard project cities from generation 9 while 20 hand cards waited – spending the money cost the hand
// nothing in the valuation. With handFunding a hand card needs money in sight to keep its value.
describe('AI hand funding', () => {
  afterEach(() => clearPlayerTunings());

  function handValue(megaCredits: number, tuning: string): number {
    const [, player] = testGame(2);
    player.megaCredits = megaCredits;
    player.production.override({megacredits: -5});
    player.setTerraformRating(5);
    setPlayerTuning(player.id, tuning);
    const values = [{card: new EarthCatapult(), value: 20}, {card: new SpaceElevator(), value: 15}];
    return fundedHandValue(player, values, 2);
  }

  it('keeps the full value without the rule', () => {
    expect(handValue(0, 'baseline')).to.eq(35);
  });

  it('counts unaffordable cards like unknown cards', () => {
    expect(handValue(0, 'handFunding')).to.eq(4);
  });

  it('pays the best card first when money runs short', () => {
    // Earth Catapult costs 23, Space Elevator 27: 30 M€ fund only the catapult.
    expect(handValue(30, 'handFunding')).to.eq(22);
  });

  it('keeps the full value with enough money', () => {
    expect(handValue(60, 'handFunding')).to.eq(35);
  });
});
