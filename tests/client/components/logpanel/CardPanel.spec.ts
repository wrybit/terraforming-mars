import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardPanel from '@/client/components/logpanel/CardPanel.vue';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardName} from '@/common/cards/CardName';

describe('CardPanel', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(CardPanel, {
      ...globalConfig,
      props: {
        message: new LogMessage(LogMessageType.DEFAULT, '', []),
        players: [],
      },
    });
    expect(wrapper.exists()).to.be.true;
  });
});

describe('CardPanel attributes', () => {
  // Die Wurzel ist ein Teleport: die Position der Hover-Vorschau (style) muss trotzdem am Panel landen
  it('passes style to the panel', () => {
    const wrapper = shallowMount(CardPanel, {
      ...globalConfig,
      // Teleport-Inhalt an Ort und Stelle rendern, sonst ist das Panel nicht auffindbar
      global: {...globalConfig.global, stubs: {teleport: true}},
      props: {
        message: new LogMessage(LogMessageType.DEFAULT, '${0}', [{type: LogMessageDataType.CARD, value: CardName.POWER_PLANT}]),
        players: [],
        floating: true,
      },
      attrs: {style: 'top: 12px; right: 34px;'},
    });
    const panel = wrapper.find('.card-panel');
    expect(panel.attributes('style')).to.contain('top: 12px');
    expect(panel.attributes('style')).to.contain('right: 34px');
  });
});
