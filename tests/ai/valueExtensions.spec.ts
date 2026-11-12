import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, isTuningVariant, playerVariant, registerTuningVariantNames, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {extensionValue, registerValueExtension} from '../../src/server/ai/valueExtensions';

// Optional modules add own terms to the position value and own tuning variants.
describe('AI value extensions', () => {
  afterEach(() => clearPlayerTunings());

  it('adds registered terms, priced with the value of a TR step', () => {
    const [, player] = testGame(2);
    const before = extensionValue(player, 10);
    const marker = player.id;
    registerValueExtension((candidate, terraformRatingValue) => candidate.id === marker ? -2 * terraformRatingValue : 0);
    expect(extensionValue(player, 10)).eq(before - 20);
  });

  it('knows variant names of a module and the variant of a player', () => {
    const [, player] = testGame(2);
    expect(isTuningVariant('moduleOnlyVariantForTest')).eq(false);
    registerTuningVariantNames(['moduleOnlyVariantForTest']);
    expect(isTuningVariant('moduleOnlyVariantForTest')).eq(true);
    expect(playerVariant(player)).eq(undefined);
    setPlayerTuning(player.id, 'moduleOnlyVariantForTest');
    expect(playerVariant(player)).eq('moduleOnlyVariantForTest');
  });
});
