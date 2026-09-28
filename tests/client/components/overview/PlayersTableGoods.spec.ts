import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayersTableGoods from '@/client/components/overview/PlayersTableGoods.vue';
import {PlayerGood} from '@/client/components/overview/playerGoods';
import {Resource} from '@/common/Resource';

const good = (overrides: Partial<PlayerGood>): PlayerGood => ({
  type: Resource.MEGACREDITS,
  count: 0,
  production: 0,
  value: 0,
  resourceProtection: 'off',
  productionProtection: 'off',
  ...overrides,
});

describe('PlayersTableGoods', () => {
  it('shows stock and signed production', () => {
    const wrapper = shallowMount(PlayersTableGoods, {
      ...globalConfig,
      props: {good: good({count: 28, production: 17})},
    });
    expect(wrapper.find('[data-test="stock"]').text()).to.eq('28');
    expect(wrapper.find('[data-test="production"]').text()).to.eq('+17');
  });

  it('highlights the production leader', () => {
    const wrapper = shallowMount(PlayersTableGoods, {
      ...globalConfig,
      props: {good: good({production: 8}), isProductionLeader: true},
    });
    expect(wrapper.find('[data-test="production"]').classes()).to.include('players-table-goods-production--leader');
  });

  it('shows the value badge for raised values, never for M€', () => {
    const megacredits = shallowMount(PlayersTableGoods, {
      ...globalConfig,
      props: {good: good({type: Resource.MEGACREDITS, value: 1})},
    });
    expect(megacredits.find('[data-test="value"]').exists()).to.be.false;

    const raised = shallowMount(PlayersTableGoods, {
      ...globalConfig,
      props: {good: good({type: Resource.TITANIUM, value: 4})},
    });
    expect(raised.find('[data-test="value"]').text()).to.eq('4');
  });
});
