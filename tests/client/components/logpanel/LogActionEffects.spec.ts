import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import {fakeViewModel} from '../testHelpers';
import LogActionEffects from '@/client/components/logpanel/LogActionEffects.vue';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {CardName} from '@/common/cards/CardName';
import {LogAction} from '@/client/components/logpanel/logActions';

describe('LogActionEffects', () => {
  it('lists the effects per player and names the card a resource lies on', () => {
    const action: LogAction = {
      kind: 'card', player: 'red', card: CardName.ADVANCED_ALLOYS, lead: new LogMessage(LogMessageType.DEFAULT, '', []),
      effects: [{resource: 'science', amount: 1, card: CardName.OLYMPUS_CONFERENCE}],
      others: [{player: 'blue', effects: [{resource: 'megacredit', amount: 2, cause: CardName.MARS_UNIVERSITY}]}],
    };
    const wrapper = mount(LogActionEffects, {...globalConfig, props: {action, players: fakeViewModel().players}});
    expect(wrapper.findAll('.log-action-effects-line')).has.length(2);
    const notes = wrapper.findAll('.log-action-effects-note').map((note) => note.text());
    expect(notes).deep.eq(['on Olympus Conference', 'because of Mars University']);
  });

  it('shows the text lines of a turmoil row and its neutral delegates', () => {
    const action: LogAction = {
      kind: 'turmoil', lead: new LogMessage(LogMessageType.DEFAULT, '', []), effects: [], others: [], parties: ['Greens'],
      notes: [new LogMessage(LogMessageType.DEFAULT, 'A neutral delegate is the new chairman.', [])],
    };
    const wrapper = mount(LogActionEffects, {...globalConfig, props: {action, players: fakeViewModel().players}});
    expect(wrapper.find('.log-action-effects-text').text()).eq('A neutral delegate is the new chairman.');
    expect(wrapper.find('.log-row-party-icon--greens').exists()).to.be.true;
  });
});
