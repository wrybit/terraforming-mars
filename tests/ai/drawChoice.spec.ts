import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {drawChoiceBonus} from '../../src/server/ai/drawChoice';
import {BusinessContacts} from '../../src/server/cards/base/BusinessContacts';
import {InventionContest} from '../../src/server/cards/base/InventionContest';
import {Research} from '../../src/server/cards/base/Research';

describe('AI draw choice', () => {
  afterEach(() => clearPlayerTunings());

  it('values choosing from several drawn cards', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'drawChoice2');
    // Business Contacts: 4 seen, 2 kept; Invention Contest: 3 seen, 1 kept.
    expect(drawChoiceBonus(new BusinessContacts(), player)).eq(4);
    expect(drawChoiceBonus(new InventionContest(), player)).eq(4);
    // Drawing without a choice is no choice.
    expect(drawChoiceBonus(new Research(), player)).eq(0);
  });

  it('can be switched off', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'noDrawChoice');
    expect(drawChoiceBonus(new BusinessContacts(), player)).eq(0);
  });
});
