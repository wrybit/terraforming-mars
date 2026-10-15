import {expect} from 'chai';
import {withViewerNamed} from '@/client/components/logpanel/logViewerName';
import {groupLogMessages} from '@/client/components/logpanel/logActions';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardName} from '@/common/cards/CardName';

function line(message: string, data: LogMessage['data']): LogMessage {
  return {message, data, timestamp: 0} as LogMessage;
}

describe('logViewerName', () => {
  it('names the viewer in lines saved with "You"', () => {
    const drew = withViewerNamed(line('${0} drew ${1}', [{type: LogMessageDataType.STRING, value: 'You'}, {type: LogMessageDataType.CARDS, value: [CardName.ALGAE]}]), 'blue');
    expect(drew.data[0]).deep.eq({type: LogMessageDataType.PLAYER, value: 'blue'});
    const bought = withViewerNamed(line('You bought ${0}', [{type: LogMessageDataType.CARDS, value: [CardName.ALGAE]}]), 'blue');
    expect(bought.message).eq('${0} bought ${1}');
    expect(bought.data.map((datum) => datum.value)).deep.eq(['blue', [CardName.ALGAE]]);
  });

  it('leaves lines alone without viewer or without "You"', () => {
    const own = line('${0} drew ${1}', [{type: LogMessageDataType.STRING, value: 'You'}]);
    expect(withViewerNamed(own, undefined)).eq(own);
    const named = line('${0} drew ${1}', [{type: LogMessageDataType.PLAYER, value: 'red'}]);
    expect(withViewerNamed(named, 'blue')).eq(named);
  });

  it('marks a line of the same player after an action as its consequence', () => {
    const rows = groupLogMessages([
      line('${0} played ${1}', [{type: LogMessageDataType.PLAYER, value: 'blue'}, {type: LogMessageDataType.CARD, value: CardName.MARS_UNIVERSITY}]),
      line('${0} drew ${1}', [{type: LogMessageDataType.PLAYER, value: 'blue'}, {type: LogMessageDataType.CARDS, value: [CardName.ALGAE]}]),
      line('${0} drew ${1}', [{type: LogMessageDataType.PLAYER, value: 'red'}, {type: LogMessageDataType.CARDS, value: [CardName.ANTS]}]),
    ]);
    const messages = rows.filter((row) => row.type === 'message');
    expect(messages.map((row) => row.type === 'message' && row.follows === true)).deep.eq([true, false]);
  });
});
