import {expect} from 'chai';
import {splitMoney} from '@/client/components/common/moneyText';

describe('moneyText', () => {
  it('turns a bracketed amount into a coin', () => {
    expect(splitMoney('Award (14 M€)', ['M€'])).deep.eq([{kind: 'text', text: 'Award '}, {kind: 'coin', value: 14}]);
  });

  it('finds the theme currency and amounts inside a sentence', () => {
    expect(splitMoney('Zahle 3 Solari, um 1 Karte zu ziehen', ['M€', 'Solari'])).deep.eq([
      {kind: 'text', text: 'Zahle '}, {kind: 'coin', value: 3}, {kind: 'text', text: ', um 1 Karte zu ziehen'},
    ]);
    expect(splitMoney('2 Sardaukar für 24 M€', ['M€'])).deep.eq([{kind: 'text', text: '2 Sardaukar für '}, {kind: 'coin', value: 24}]);
  });

  it('leaves money without a number and other words alone', () => {
    expect(splitMoney('Increase your M€ production', ['M€'])).deep.eq([{kind: 'text', text: 'Increase your M€ production'}]);
    expect(splitMoney('3 Solarität', ['Solari'])).deep.eq([{kind: 'text', text: '3 Solarität'}]);
    expect(splitMoney('Pass', ['M€'])).deep.eq([{kind: 'text', text: 'Pass'}]);
  });

  it('takes an amount written without a space', () => {
    expect(splitMoney('Sell your steel for 3M€ each.', ['M€'])).deep.eq([
      {kind: 'text', text: 'Sell your steel for '}, {kind: 'coin', value: 3}, {kind: 'text', text: ' each.'},
    ]);
  });
});
