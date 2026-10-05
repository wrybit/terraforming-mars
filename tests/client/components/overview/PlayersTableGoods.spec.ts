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
      props: {color: 'red', good: good({count: 28, production: 17})},
    });
    expect(wrapper.find('[data-test="stock"]').text()).to.eq('28');
    expect(wrapper.find('[data-test="production"]').text()).to.eq('+17');
  });

  it('highlights the production leader', () => {
    const wrapper = shallowMount(PlayersTableGoods, {
      ...globalConfig,
      props: {color: 'red', good: good({production: 8}), isProductionLeader: true},
    });
    expect(wrapper.find('[data-test="production"]').classes()).to.include('players-table-goods-production--leader');
  });

  it('marks protected goods with a shield in front of the stock', () => {
    const wrapper = shallowMount(PlayersTableGoods, {
      ...globalConfig,
      props: {color: 'red', good: good({type: Resource.PLANTS, count: 3, resourceProtection: 'on'})},
    });
    expect(wrapper.find('.players-table-goods').classes()).to.include('players-table-protected');
    expect(wrapper.find('[data-test="stock"] [data-test="protection"]').exists()).to.be.true;
    expect(wrapper.find('[data-test="stock"]').text()).to.eq('3');
  });

  it('shows the value badge for raised values, never for M€', () => {
    const megacredits = shallowMount(PlayersTableGoods, {
      ...globalConfig,
      props: {color: 'red', good: good({type: Resource.MEGACREDITS, value: 1})},
    });
    expect(megacredits.find('[data-test="value"]').exists()).to.be.false;

    const raised = shallowMount(PlayersTableGoods, {
      ...globalConfig,
      props: {color: 'red', good: good({type: Resource.TITANIUM, value: 4})},
    });
    expect(raised.find('[data-test="value"]').text()).to.eq('4');
  });
});
