import {expect} from 'chai';
import {selectPlayerResource} from '@/client/components/selectPlayerResource';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';

describe('selectPlayerResource', () => {
  it('finds the resource in the title parameters', () => {
    const title = {
      message: 'Select player to decrease ${0} production by ${1} step(s)',
      data: [{type: LogMessageDataType.STRING as const, value: 'steel'}, {type: LogMessageDataType.RAW_STRING as const, value: '1'}],
    };
    expect(selectPlayerResource(title)).eq('steel');
  });

  it('has no resource for plain titles', () => {
    expect(selectPlayerResource('Select player')).is.undefined;
    expect(selectPlayerResource({message: 'Select player to lose 1 corruption', data: []})).is.undefined;
  });
});
