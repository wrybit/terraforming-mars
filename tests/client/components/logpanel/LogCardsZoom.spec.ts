import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import LogCardsZoom from '@/client/components/logpanel/LogCardsZoom.vue';
import MobileCardZoom from '@/client/components/mobile/MobileCardZoom.vue';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardName} from '@/common/cards/CardName';
import {ColonyName} from '@/common/colonies/ColonyName';

describe('LogCardsZoom', () => {
  const message = new LogMessage(LogMessageType.DEFAULT, '${0} and ${1}', [
    {type: LogMessageDataType.CARDS, value: [CardName.ANTS, CardName.BIRDS]},
    {type: LogMessageDataType.COLONY, value: ColonyName.LUNA},
  ]);

  it('shows every card and colony of the log line as a carousel slide, starting with the first', () => {
    const wrapper = mount(LogCardsZoom, {...globalConfig, props: {message, players: []}, global: {...globalConfig.global, stubs: {...globalConfig.global.stubs, Card: true, Colony: true}}});
    const zoom = wrapper.findComponent(MobileCardZoom);
    expect(zoom.props('count')).to.eq(3);
    expect(zoom.props('index')).to.eq(0);
    expect(wrapper.findAllComponents({name: 'Card'})).to.have.length(2);
    expect(wrapper.findAllComponents({name: 'Colony'})).to.have.length(1);
  });
});
