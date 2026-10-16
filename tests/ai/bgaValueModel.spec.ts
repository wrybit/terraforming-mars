import {expect} from 'chai';
import {testGame} from '../TestGame';
import {bgaFeatures, bgaScore, bgaWinLogit} from '../../src/server/ai/bgaValueModel';
import modelData from '../../src/server/ai/data/bgaValueModel.json';

describe('Learned position value (BGA model)', () => {
  it('scores the exported samples like the training system', () => {
    for (const sample of (modelData as unknown as {samples: Array<{features: Array<number>, probability: number}>}).samples) {
      const probability = 1 / (1 + Math.exp(-bgaScore(sample.features)));
      expect(probability).to.be.closeTo(sample.probability, 1e-6);
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
    const logit = bgaWinLogit(player)!;
    expect(logit).to.be.greaterThan(0);
    expect(bgaWinLogit(opponent)).to.be.closeTo(-logit, 1e-9);
  });

  it('gives no value outside two-player games', () => {
    const [, player] = testGame(3);
    expect(bgaWinLogit(player)).to.be.undefined;
  });
});
