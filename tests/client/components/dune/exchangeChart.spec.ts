import {expect} from 'chai';
import {Resource} from '@/common/Resource';
import {NORMAL_BUY, NORMAL_SELL} from '@/common/dune/smugglingExchange';
import {exchangeChart, moodOf, rateDeviation, SHOWN_GENERATIONS} from '@/client/components/dune/exchangeChart';

describe('exchangeChart', () => {
  const sell = {normal: NORMAL_SELL, history: [NORMAL_SELL, {...NORMAL_SELL, steel: 3}, {...NORMAL_SELL, steel: 1}]};

  it('mood: high is good when selling, low when buying', () => {
    expect(moodOf(3, 2, true)).eq('good');
    expect(moodOf(3, 2, false)).eq('bad');
    expect(moodOf(2, 2, true)).eq('normal');
  });

  it('one column per resource, rows for the shown generations up to the current one', () => {
    const chart = exchangeChart([Resource.MEGACREDITS, Resource.STEEL], sell, true, 7);
    expect(chart.columns.map((column) => column.resource)).deep.eq([Resource.MEGACREDITS, Resource.STEEL]);
    expect(chart.rows.map((row) => row.generation)).deep.eq([5, 6, 7]);
    // Solari stay on their normal line: no area
    expect(chart.columns[0].areas).is.empty;
    expect(chart.columns[0].points.every((point) => point.x === chart.columns[0].normalX)).is.true;
  });

  it('splits the area where the rate crosses normal', () => {
    const steel = exchangeChart([Resource.STEEL], sell, true, 3).columns[0];
    expect(steel.areas.map((area) => area.mood)).deep.eq(['good', 'good', 'bad']);
    expect(steel.points[2]).include({mood: 'bad', current: true});
  });

  it('shows at most the last generations', () => {
    const history = Array.from({length: 9}, () => NORMAL_BUY);
    expect(exchangeChart([Resource.HEAT], {normal: NORMAL_BUY, history}, false, 9).rows).length(SHOWN_GENERATIONS);
  });

  it('distance from the base price', () => {
    // Steel sells for 1 instead of 2: one below normal, bad when you give it
    expect(rateDeviation(sell, Resource.STEEL, true)).deep.eq({delta: -1, mood: 'bad', peak: false});
    expect(rateDeviation({normal: NORMAL_BUY, history: [{...NORMAL_BUY, steel: 3}]}, Resource.STEEL, false)).deep.eq({delta: -1, mood: 'good', peak: false});
    expect(rateDeviation({normal: NORMAL_BUY, history: [NORMAL_BUY]}, Resource.HEAT, false)).deep.eq({delta: 0, mood: 'normal', peak: false});
  });
});
