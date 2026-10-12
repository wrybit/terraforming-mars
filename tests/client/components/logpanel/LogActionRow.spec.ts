import {shallowMount, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import {fakeViewModel} from '../testHelpers';
import LogActionRow from '@/client/components/logpanel/LogActionRow.vue';
import LogEffectIcon from '@/client/components/logpanel/LogEffectIcon.vue';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {CardName} from '@/common/cards/CardName';
import {LogRow} from '@/client/components/logpanel/logActions';

const lead = new LogMessage(LogMessageType.DEFAULT, '${0} played ${1}', []);

function actionRow(kind: 'card' | 'action', others: Array<{player: 'blue', effects: Array<{resource: string, amount: number}>}> = []): LogRow {
  return {type: 'action', indexes: [0], action: {kind, player: 'red', card: CardName.ALGAE, lead, effects: [{resource: 'plant', amount: 2, production: true}], others}};
}

describe('LogActionRow', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(LogActionRow, {...globalConfig, props: {row: actionRow('card'), viewModel: fakeViewModel()}});
    expect(wrapper.exists()).to.be.true;
  });

  it('shows the card name and one icon per effect', () => {
    const wrapper = mount(LogActionRow, {...globalConfig, props: {row: actionRow('card'), viewModel: fakeViewModel()}});
    expect(wrapper.find('.log-row-card').text()).eq('Algae');
    expect(wrapper.findAllComponents(LogEffectIcon)).has.length(1);
    expect(wrapper.find('.log-row-action').exists()).to.be.false;
  });

  it('marks the action of a card in play with the action arrow', () => {
    const wrapper = mount(LogActionRow, {...globalConfig, props: {row: actionRow('action'), viewModel: fakeViewModel()}});
    expect(wrapper.find('.log-row-action').exists()).to.be.true;
  });

  it('shows losses of other players in red and gains in green', () => {
    const loss = mount(LogActionRow, {...globalConfig, props: {row: actionRow('card', [{player: 'blue', effects: [{resource: 'plant', amount: -2}]}]), viewModel: fakeViewModel()}});
    expect(loss.find('.log-row-other--loss').exists()).to.be.true;
    const gain = mount(LogActionRow, {...globalConfig, props: {row: actionRow('card', [{player: 'blue', effects: [{resource: 'megacredit', amount: 2}]}]), viewModel: fakeViewModel()}});
    expect(gain.find('.log-row-other--gain').exists()).to.be.true;
  });

  it('shows the card purchase of all players in one row', () => {
    const row: LogRow = {type: 'research', indexes: [0, 1], entries: [{player: 'red', amount: 2}, {player: 'blue', amount: 0}]};
    const wrapper = mount(LogActionRow, {...globalConfig, props: {row, viewModel: fakeViewModel()}});
    expect(wrapper.findAll('.log-row-research-entry')).has.length(2);
  });
});
