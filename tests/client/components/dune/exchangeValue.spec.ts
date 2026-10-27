import {expect} from 'chai';
import {mount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import {Resource} from '@/common/Resource';
import {NORMAL_BUY, NORMAL_SELL} from '@/common/dune/smugglingExchange';
import {formatValue, tileValue} from '@/client/components/dune/exchangeValue';
import TradeTileValue from '@/client/components/dune/TradeTileValue.vue';

describe('exchangeValue', () => {
  // Plasteel costs 9, vegetation brings 3, spice 10
  const buy = {...NORMAL_BUY, steel: 9};

  it('get side: the price in the good you pay with, today\'s rate', () => {
    expect(tileValue(Resource.STEEL, false, Resource.PLANTS, NORMAL_SELL, buy)).deep.eq({amount: 3, currency: Resource.PLANTS});
    expect(tileValue(Resource.STEEL, false, Resource.TITANIUM, NORMAL_SELL, buy)).deep.eq({amount: 0.9, currency: Resource.TITANIUM});
  });

  it('give side: the worth in the good you get', () => {
    expect(tileValue(Resource.PLANTS, true, Resource.STEEL, NORMAL_SELL, buy)).deep.eq({amount: 1 / 3, currency: Resource.STEEL});
  });

  it('Solari on the other side or the same good: the Solari coin', () => {
    expect(tileValue(Resource.STEEL, false, Resource.MEGACREDITS, NORMAL_SELL, buy)).deep.eq({amount: 9, currency: undefined});
    expect(tileValue(Resource.STEEL, true, Resource.STEEL, NORMAL_SELL, buy)).deep.eq({amount: 4, currency: undefined});
  });

  it('formats at most two decimals in the language', () => {
    expect(formatValue(1 / 3, 'de')).eq('0,33');
    expect(formatValue(5 / 3, 'en')).eq('1.67');
    expect(formatValue(3, 'de')).eq('3');
  });

  it('component: coin for Solari, pill with the good otherwise', () => {
    const coin = mount(TradeTileValue, {...globalConfig, props: {value: {amount: 3, currency: undefined}}});
    expect(coin.find('.button-count--megacredits').text()).eq('3');
    const pill = mount(TradeTileValue, {...globalConfig, props: {value: {amount: 3, currency: Resource.PLANTS}}});
    expect(pill.find('.trade-tile-value .resource_icon--plants').exists()).is.true;
  });
});
