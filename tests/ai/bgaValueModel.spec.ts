import {expect} from 'chai';
import {testGame} from '../TestGame';
import {bgaExpectedMargin, bgaFeatures, bgaMargin, bgaScore} from '../../src/server/ai/bgaValueModel';
import modelData from '../../src/server/ai/data/bgaValueModel.json';

describe('Learned position value (BGA model)', () => {
  it('counts certain VP at least one to one (a claimed milestone: 5 VP)', () => {
    const [game, player, opponent] = testGame(2);
    game.generation = 3;
    const features = bgaFeatures(player, opponent);
    const claimed = [...features];
    for (const name of ['own_milestones', 'diff_milestones']) {
      claimed[modelData.features.indexOf(name)] += 5;
    }
    expect(bgaMargin(claimed) - bgaMargin(features)).to.be.at.least(5 - 1e-9);
  });

  it('scores the exported samples like the training system', () => {
    for (const sample of (modelData as unknown as {samples: Array<{features: Array<number>, raw: number}>}).samples) {
      expect(bgaScore(sample.features)).to.be.closeTo(sample.raw, 1e-6);
    }
  });

  it('builds one feature per model input', () => {
    const [, player, opponent] = testGame(2);
    const features = bgaFeatures(player, opponent);
    expect(features).to.have.length(modelData.features.length);
    expect(features.every((value) => Number.isFinite(value))).to.be.true;
  });

  it('is symmetric and prefers the player who is ahead', () => {
    const [game, player, opponent] = testGame(2);
    game.generation = 7;
    player.setTerraformRating(35);
    opponent.setTerraformRating(28);
    player.production.override({megacredits: 8});
    const margin = bgaExpectedMargin(player)!;
    // 7 TR more are 7 certain VP; the income on top is worth more
    expect(margin).to.be.greaterThan(7);
    expect(bgaExpectedMargin(opponent)).to.be.closeTo(-margin, 1e-9);
  });

  it('gives no value outside two-player games', () => {
    const [, player] = testGame(3);
    expect(bgaExpectedMargin(player)).to.be.undefined;
  });
});
