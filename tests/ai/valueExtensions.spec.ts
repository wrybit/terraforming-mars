import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, isTuningVariant, playerVariant, registerTuningVariantNames, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {extensionValue, registerValueExtension} from '../../src/server/ai/valueExtensions';

// Optional modules add own terms to the position value and own tuning variants.
describe('AI value extensions', () => {
  afterEach(() => clearPlayerTunings());

  it('adds registered terms, priced with the value of a TR step and a VP', () => {
    const [, player] = testGame(2);
    const prices = {terraformRating: 10, victoryPoint: 7};
    const before = extensionValue(player, prices);
    const marker = player.id;
    registerValueExtension((candidate, {terraformRating, victoryPoint}) => candidate.id === marker ? -2 * terraformRating + victoryPoint : 0);
    expect(extensionValue(player, prices)).eq(before - 13);
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
