import {expect} from 'chai';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {LogMessageData} from '@/common/logs/LogMessageData';
import {CardName} from '@/common/cards/CardName';
import {groupLogMessages, mergeEffects} from '@/client/components/logpanel/logActions';

const player = (value: string): LogMessageData => ({type: LogMessageDataType.PLAYER, value} as LogMessageData);
const card = (value: CardName): LogMessageData => ({type: LogMessageDataType.CARD, value});
const text = (value: string): LogMessageData => ({type: LogMessageDataType.STRING, value});
const raw = (value: string): LogMessageData => ({type: LogMessageDataType.RAW_STRING, value});
const message = (template: string, ...data: Array<LogMessageData>) => new LogMessage(LogMessageType.DEFAULT, template, data);

describe('logActions', () => {
  it('groups a played card with its effects', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.ALGAE)),
      message('${0} gained ${1} ${2} production', player('red'), raw('2'), text('plant')),
      message('${0} gained ${1} ${2}', player('red'), raw('1'), text('plant')),
    ]);
    expect(rows).has.length(1);
    const row = rows[0];
    expect(row.type).eq('action');
    if (row.type !== 'action') {
      return;
    }
    expect(row.action.card).eq(CardName.ALGAE);
    expect(row.action.effects).deep.eq([{resource: 'plant', amount: 2, production: true}, {resource: 'plant', amount: 1}]);
    expect(row.indexes).deep.eq([0, 1, 2]);
  });

  it('puts effects on other players into their own group', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('blue'), card(CardName.BIG_ASTEROID)),
      message('${0} lost ${1} ${2} because of ${3}', player('green'), raw('2'), text('plants'), player('blue')),
    ]);
    const row = rows[0];
    if (row.type !== 'action') {
      throw new Error('expected an action row');
    }
    expect(row.action.others).deep.eq([{player: 'green', effects: [{resource: 'plant', amount: -2}]}]);
  });

  it('keeps unknown messages as text lines and does not attach later effects to the previous action', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.ALGAE)),
      message('${0} traded with ${1}', player('red'), text('Europa')),
      message('${0} gained ${1} ${2}', player('red'), raw('1'), text('plant')),
    ]);
    expect(rows.map((row) => row.type)).deep.eq(['action', 'message', 'message']);
  });

  it('summarises the card purchase and separates it from the turns', () => {
    const rows = groupLogMessages([
      message('${0} ${1} ${2} card(s)', player('red'), text('bought'), raw('2')),
      message('${0} ${1} ${2} card(s)', player('blue'), text('bought'), raw('1')),
      message('${0} passed', player('red')),
    ]);
    expect(rows.map((row) => row.type)).deep.eq(['research', 'phase', 'action']);
    const research = rows[0];
    if (research.type !== 'research') {
      throw new Error('expected a research row');
    }
    expect(research.entries).deep.eq([{player: 'red', amount: 2}, {player: 'blue', amount: 1}]);
  });

  it('attaches production gained because of another card to the action', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.ALGAE)),
      message('${0} gained ${1} ${2} production because of ${3}', player('blue'), raw('1'), text('M€'), card(CardName.SATURN_SYSTEMS)),
    ]);
    expect(rows).has.length(1);
    const row = rows[0];
    if (row.type !== 'action') {
      throw new Error('expected an action row');
    }
    expect(row.action.others).deep.eq([{player: 'blue', effects: [{resource: 'megacredit', amount: 1, production: true}]}]);
  });

  it('keeps card effects that draw a card inside the action, also after a private note', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.ALGAE)),
      message('You drew ${0}', {type: LogMessageDataType.CARDS, value: [CardName.ANTS]}),
      message('${0} removed a resource from ${1} to draw a card', player('red'), card(CardName.OLYMPUS_CONFERENCE)),
      message('${0} ${1} ${2} card(s)', player('red'), text('drew'), raw('1')),
    ]);
    expect(rows.map((row) => row.type)).deep.eq(['action', 'message']);
    const row = rows[0];
    if (row.type !== 'action') {
      throw new Error('expected an action row');
    }
    expect(row.action.effects).deep.eq([{resource: 'card', amount: 1}]);
  });

  it('shows sold patents as cards given away by the standard project', () => {
    const rows = groupLogMessages([
      message('${0} used ${1} standard project', player('red'), card(CardName.SELL_PATENTS_STANDARD_PROJECT)),
      message('${0} sold ${1} patents', player('red'), raw('3')),
    ]);
    expect(rows).has.length(1);
    const row = rows[0];
    if (row.type !== 'action') {
      throw new Error('expected an action row');
    }
    expect(row.action.effects).deep.eq([{resource: 'card', amount: -3}]);
  });

  it('adds up the same resource and orders production, stock, tiles', () => {
    expect(mergeEffects([
      {tile: 'city', amount: 0},
      {resource: 'megacredit', amount: 4},
      {resource: 'megacredit', amount: 3},
      {resource: 'power', amount: -1, production: true},
    ])).deep.eq([
      {resource: 'power', amount: -1, production: true},
      {resource: 'megacredit', amount: 7},
      {tile: 'city', amount: 0},
    ]);
  });
});
