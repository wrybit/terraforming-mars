import {expect} from 'chai';
import {missingFees, TradeFee} from '@/client/components/colonies/tradeInput';

describe('tradeInput', () => {
  it('lists the fees the server does not offer, with the same discount', () => {
    const offered: Array<TradeFee> = [{index: 0, kind: 'megacredits', amount: 8, title: 'Pay 8 M€'}];
    expect(missingFees(offered)).deep.eq([{kind: 'energy', amount: 2}, {kind: 'titanium', amount: 2}]);
  });

  it('lists nothing when all three are offered', () => {
    const offered: Array<TradeFee> = [
      {index: 0, kind: 'megacredits', amount: 9, title: ''},
      {index: 1, kind: 'energy', amount: 3, title: ''},
      {index: 2, kind: 'titanium', amount: 3, title: ''},
    ];
    expect(missingFees(offered)).deep.eq([]);
  });
});
