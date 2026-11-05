import {expect} from 'chai';
import {testGame} from '../TestGame';
import {Turmoil} from '../../src/server/turmoil/Turmoil';
import {PartyName} from '../../src/common/turmoil/PartyName';
import {SelectParty} from '../../src/server/inputs/SelectParty';
import {SelectDelegate} from '../../src/server/inputs/SelectDelegate';
import {chooseDelegate, chooseParty, partyValue} from '../../src/server/ai/partyChoice';

describe('partyChoice', () => {
  it('takes the leadership of the dominant party (chairman next generation)', () => {
    const [game, player, rival] = testGame(2, {turmoilExtension: true});
    const turmoil = Turmoil.getTurmoil(game);
    // Scientists dominant with one rival delegate; an own delegate ties and does not take the leadership,
    // two make the AI leader of the dominant party.
    turmoil.sendDelegateToParty(rival, PartyName.SCIENTISTS, game);
    turmoil.sendDelegateToParty(player, PartyName.SCIENTISTS, game);
    const intoScientists = partyValue(player, PartyName.SCIENTISTS);
    const intoUnity = partyValue(player, PartyName.UNITY);
    expect(intoScientists).to.not.be.undefined;
    expect(intoScientists!).to.be.greaterThan(intoUnity!);
  });

  it('answers with one of the offered parties', () => {
    const [, player] = testGame(2, {turmoilExtension: true});
    const parties = [PartyName.GREENS, PartyName.KELVINISTS];
    const response = chooseParty(new SelectParty('Send a delegate', 'Send delegate', parties), player);
    expect(response?.type).eq('party');
    expect(parties).to.include((response as {partyName: PartyName}).partyName);
  });

  it('picks a rival delegate before a neutral or the own one', () => {
    const [, player, rival] = testGame(2, {turmoilExtension: true});
    const response = chooseDelegate(new SelectDelegate([player, 'NEUTRAL', rival], 'Remove a delegate'), player);
    expect(response).deep.eq({type: 'delegate', player: rival.color});
  });
});
