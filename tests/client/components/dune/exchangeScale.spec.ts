import {expect} from 'chai';
import {mount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import {Resource} from '@/common/Resource';
import {NORMAL_BUY, NORMAL_SELL} from '@/common/dune/smugglingExchange';
import {compareWithNormal, moodOf, rateScale} from '@/client/components/dune/exchangeScale';
import ExchangeScale from '@/client/components/dune/ExchangeScale.vue';

describe('exchangeScale', () => {
  const buy = {normal: NORMAL_BUY, history: [NORMAL_BUY, {...NORMAL_BUY, steel: 3}]};

  it('mood: high is good when selling, low when buying', () => {
    expect(moodOf(3, 2, true)).eq('good');
    expect(moodOf(3, 2, false)).eq('bad');
    expect(moodOf(2, 2, true)).eq('normal');
  });

  it('five steps around normal, the current one marked, cheaper buying is good', () => {
    const scale = rateScale(buy, Resource.STEEL, false);
    expect(scale.steps.map((step) => step.rate)).deep.eq([2, 3, 4, 5, 6]);
    expect(scale.steps.findIndex((step) => step.normal)).eq(2);
    expect(scale.steps.findIndex((step) => step.current)).eq(1);
    expect(scale.steps.map((step) => step.mood)).deep.eq(['good', 'good', 'normal', 'bad', 'bad']);
    expect(scale).to.include({mood: 'good', deviation: 1, verdict: '${0} cheaper than normal'});
    expect(scale.legend).deep.eq(['good', 'bad']);
  });

  it('rates below 1 are no step; a normal rate says so', () => {
    const sell = {normal: NORMAL_SELL, history: [NORMAL_SELL]};
    const scale = rateScale(sell, Resource.PLANTS, true);
    expect(scale.steps.map((step) => step.rate)).deep.eq([undefined, undefined, 1, 2, 3]);
    expect(scale).to.include({mood: 'normal', verdict: 'Normal rate'});
    expect(scale.legend).deep.eq(['bad', 'good']);
  });

  it('compares the deal with the same amount received at normal rates', () => {
    // 3 plants for 1 steel today, 4 : 1 normally: 1 plant saved
    expect(compareWithNormal({give: 4, get: 1}, 3, 1)).deep.eq({normal: {give: 4, get: 1}, mood: 'good', difference: 1});
    expect(compareWithNormal({give: 4, get: 1}, 10, 2)).to.include({mood: 'bad', difference: 2});
    expect(compareWithNormal({give: 2, get: 1}, 2, 1)).to.include({mood: 'normal', difference: 0});
    // Not a whole number: only better or worse
    expect(compareWithNormal({give: 4, get: 3}, 1, 1)).to.include({mood: 'good', difference: undefined});
  });

  it('component: Solari show only the fixed coin, goods the scale', () => {
    const fixed = mount(ExchangeScale, {...globalConfig, props: {resource: Resource.MEGACREDITS, board: buy, higherIsGood: false}});
    expect(fixed.find('.exchange-scale--fixed').exists()).is.true;
    const steel = mount(ExchangeScale, {...globalConfig, props: {resource: Resource.STEEL, board: buy, higherIsGood: false}});
    expect(steel.findAll('.exchange-scale__step')).length(5);
    expect(steel.find('.exchange-scale__step--current').text()).eq('3');
  });
});
