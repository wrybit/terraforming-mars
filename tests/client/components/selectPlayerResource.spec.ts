import {expect} from 'chai';
import {playerEffect, resourceAfter, selectPlayerResource} from '@/client/components/selectPlayerResource';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';

describe('selectPlayerResource', () => {
  it('finds the resource in the title parameters', () => {
    const title = {
      message: 'Select player to decrease ${0} production by ${1} step(s)',
      data: [{type: LogMessageDataType.STRING as const, value: 'steel'}, {type: LogMessageDataType.RAW_STRING as const, value: '1'}],
    };
    expect(selectPlayerResource(title)).eq('steel');
  });

  it('finds the resource named in the title text', () => {
    expect(selectPlayerResource('Select player to remove up to 4 M€ from')).eq('megacredits');
    expect(selectPlayerResource({message: 'Select player to remove up to ${0} plants', data: [{type: LogMessageDataType.RAW_STRING as const, value: '3'}]})).eq('plants');
  });

  it('has no resource for plain titles', () => {
    expect(selectPlayerResource('Select player')).is.undefined;
    expect(selectPlayerResource({message: 'Select player to lose 1 corruption', data: []})).is.undefined;
  });

  it('finds the resource in a text parameter such as M€', () => {
    const title = {
      message: 'Remove ${0} ${1} from ${2}',
      data: [
        {type: LogMessageDataType.RAW_STRING as const, value: '7'},
        {type: LogMessageDataType.STRING as const, value: 'M€'},
        {type: LogMessageDataType.PLAYER as const, value: 'red' as const},
      ],
    };
    expect(selectPlayerResource(title)).eq('megacredits');
    expect(playerEffect(title)).deep.eq({resource: 'megacredits', target: 'stock', amount: 7});
  });

  it('describes production and stock effects', () => {
    const decrease = {
      message: 'Select player to decrease ${0} production by ${1} step(s)',
      data: [{type: LogMessageDataType.STRING as const, value: 'heat'}, {type: LogMessageDataType.RAW_STRING as const, value: '2'}],
    };
    expect(playerEffect(decrease)).deep.eq({resource: 'heat', target: 'production', amount: 2});
    expect(playerEffect('Select player to remove up to 4 M€ from')).deep.eq({resource: 'megacredits', target: 'stock', amount: 4});
    expect(playerEffect({message: 'Steal 1 ${0} from ${1}', data: [{type: LogMessageDataType.STRING as const, value: 'steel'}]}))
      .deep.eq({resource: 'steel', target: 'stock', amount: 1});
    expect(playerEffect('Select player')).is.undefined;
  });

  it('computes the state after the attack', () => {
    const snapshot = {stock: 3, production: 1};
    expect(resourceAfter(snapshot, {resource: 'steel', target: 'stock', amount: 4})).deep.eq({stock: 0, production: 1});
    expect(resourceAfter(snapshot, {resource: 'steel', target: 'production', amount: 2})).deep.eq({stock: 3, production: -1});
    expect(resourceAfter(snapshot, {resource: 'steel', target: 'stock'})).deep.eq(snapshot);
  });
});
