import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {playPreferences, policyPreferences, policyScore, withPolicyPreference} from '../../src/server/ai/bgaPolicy';
import draftModel from '../../src/server/ai/data/bgaPolicyDraft.json';
import buyModel from '../../src/server/ai/data/bgaPolicyBuy.json';
import playModel from '../../src/server/ai/data/bgaPolicyPlay.json';
import {Research} from '../../src/server/cards/base/Research';
import {Comet} from '../../src/server/cards/base/Comet';
import {SpaceElevator} from '../../src/server/cards/base/SpaceElevator';
import {CardName} from '../../src/common/cards/CardName';

// Imitation of strong BGA players: the exported trees must score exactly like LightGBM did when exporting.
describe('AI learned card policy', () => {
  afterEach(() => clearPlayerTunings());

  for (const [kind, model] of [['draft', draftModel], ['buy', buyModel], ['play', playModel]] as const) {
    it(`scores the ${kind} export samples like LightGBM`, () => {
      for (const sample of model.samples) {
        expect(policyScore(kind, sample.features)).to.be.closeTo(sample.raw, 1e-4);
      }
    });
  }

  it('centres the preferences of an offer and leaves the values alone when off', () => {
    const [, player] = testGame(2);
    const cards = [new Research(), new Comet(), new SpaceElevator()];
    const preferences = policyPreferences(player, cards, 'draft');
    expect(preferences.size).to.eq(3);
    expect([...preferences.values()].reduce((sum, value) => sum + value, 0)).to.be.closeTo(0, 1e-9);
    const flat = (_name: CardName) => 10;
    setPlayerTuning(player.id, 'noPolicy');
    expect(withPolicyPreference(player, cards, flat, 'draft')(CardName.COMET)).to.eq(10);
    setPlayerTuning(player.id, 'policy6');
    const preferred = withPolicyPreference(player, cards, flat, 'draft');
    expect(preferred(CardName.COMET)).to.be.closeTo(10 + 6 * preferences.get(CardName.COMET)!, 1e-9);
  });

  it('weights the play order only among playable hand cards and only when on', () => {
    const [, player] = testGame(2);
    player.cardsInHand.push(new Research(), new Comet(), new SpaceElevator());
    const playable = new Set([CardName.RESEARCH, CardName.COMET]);
    expect(playPreferences(player, playable).size).to.eq(0);
    setPlayerTuning(player.id, 'play6');
    const preferences = playPreferences(player, playable);
    expect([...preferences.keys()].sort()).to.deep.eq([CardName.COMET, CardName.RESEARCH].sort());
    expect([...preferences.values()].reduce((sum, value) => sum + value, 0)).to.be.closeTo(0, 1e-9);
  });
});
