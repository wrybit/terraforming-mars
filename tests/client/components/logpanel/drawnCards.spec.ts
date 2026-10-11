import {expect} from 'chai';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardName} from '@/common/cards/CardName';
import {latestDrawnCards} from '@/client/components/logpanel/drawnCards';

function drew(drawer: LogMessage['data'][number], ...cards: Array<CardName>): LogMessage {
  return new LogMessage(LogMessageType.DEFAULT, '${0} drew ${1}', [drawer, {type: LogMessageDataType.CARDS, value: cards}]);
}

describe('latestDrawnCards', () => {
  const you = {type: LogMessageDataType.STRING as const, value: 'You'};
  const red = {type: LogMessageDataType.PLAYER as const, value: 'red' as const};
  const blue = {type: LogMessageDataType.PLAYER as const, value: 'blue' as const};

  it('finds the newest draw line of the viewing player', () => {
    const first = drew(you, CardName.BIRDS);
    const second = drew(red, CardName.ANTS, CardName.FISH);
    const other = new LogMessage(LogMessageType.DEFAULT, '${0} played ${1}', [red, {type: LogMessageDataType.CARD, value: CardName.BIRDS}]);
    expect(latestDrawnCards([first, second, other], 'red')).eq(second);
    expect(latestDrawnCards([first], 'red')).eq(first);
  });

  it('ignores other players, lines without cards and spectators', () => {
    expect(latestDrawnCards([drew(blue, CardName.BIRDS)], 'red')).is.undefined;
    expect(latestDrawnCards([drew(you)], 'red')).is.undefined;
    expect(latestDrawnCards([drew(you, CardName.BIRDS)], undefined)).is.undefined;
  });
});
