import {expect} from 'chai';
import {optionTargetPlayer} from '@/client/components/playerTargetOption';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';

describe('playerTargetOption', () => {
  const player = {type: LogMessageDataType.PLAYER as const, value: 'red' as const};

  it('finds the target of remove and steal options', () => {
    expect(optionTargetPlayer({type: 'option', buttonLabel: '', title: {message: 'Remove ${0} ${1} from ${2}', data: [player]}})).eq('red');
    expect(optionTargetPlayer({type: 'option', buttonLabel: '', title: {message: 'Steal ${0} M€ from ${1}', data: [player]}})).eq('red');
  });

  it('ignores other options', () => {
    expect(optionTargetPlayer({type: 'option', buttonLabel: '', title: 'Do not remove resource'})).is.undefined;
    expect(optionTargetPlayer({type: 'option', buttonLabel: '', title: {message: 'Pay ${0} 10 M€', data: [player]}})).is.undefined;
    expect(optionTargetPlayer({type: 'player', buttonLabel: '', title: 'Select player', players: ['red']})).is.undefined;
  });
});
