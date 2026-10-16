import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {chooseFreeCardsToKeep} from '../../src/server/ai/cardSelection';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {Phase} from '../../src/common/Phase';
import {TransNeptuneProbe} from '../../src/server/cards/base/TransNeptuneProbe';
import {InventionContest} from '../../src/server/cards/base/InventionContest';
import {EarthCatapult} from '../../src/server/cards/base/EarthCatapult';
import {AquiferPumping} from '../../src/server/cards/base/AquiferPumping';

// Business Contacts in the action phase: keep 2 of 4 drawn cards (analysis log 2026-10-16).
describe('AI keeps drawn cards by the full valuation', () => {
  afterEach(() => clearPlayerTunings());

  it('keeps exactly the asked number of offered cards', () => {
    const [game, player] = testGame(2);
    game.phase = Phase.ACTION;
    setPlayerTuning(player.id, 'keepValued');
    const offered = [new TransNeptuneProbe(), new InventionContest(), new EarthCatapult(), new AquiferPumping()];
    const input = new SelectCard('Select ${0} card(s) to keep', 'Keep', offered, {min: 2, max: 2});
    const response = chooseFreeCardsToKeep(input, player);
    expect(response.type).to.eq('card');
    const kept = (response as {cards: Array<string>}).cards;
    expect(kept).to.have.length(2);
    expect(kept.every((name) => offered.some((card) => card.name === name))).to.be.true;
  });
});
