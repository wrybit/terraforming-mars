import {expect} from 'chai';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {CardName} from '@/common/cards/CardName';
import {LogAction, LogRow} from '@/client/components/logpanel/logActions';
import {LogFilter, LogFilterOption, rowMatches} from '@/client/components/logpanel/logFilter';

const lead = new LogMessage(LogMessageType.DEFAULT, '${0} played ${1}', []);
const action = (fields: Partial<LogAction>): LogRow => ({type: 'action', indexes: [0], action: {kind: 'card', player: 'red', lead, effects: [], others: [], ...fields}});
const filter = (options: Array<LogFilterOption>, text = ''): LogFilter => ({options, text});
const matches = (row: LogRow, f: LogFilter) => rowMatches(row, f, 'blue', () => 'Asteroid red');

// Daniel (red) plays an event: steals 3 plants from you (blue)
const asteroid = action({card: CardName.ASTEROID, effects: [{resource: 'tr', amount: 1}], others: [{player: 'blue', effects: [{resource: 'plant', amount: -3}]}]});
// You use a card action: −1 energy, +1 card
const yourAction = action({kind: 'action', player: 'blue', card: CardName.DEVELOPMENT_CENTER, effects: [{resource: 'power', amount: -1}, {resource: 'card', amount: 1}]});
// Green builds a city
const city = action({kind: 'standardProject', player: 'green', card: CardName.CITY_STANDARD_PROJECT, effects: [{tile: 'city', amount: 0}]});

describe('logFilter', () => {
  it('shows everything without a filter', () => {
    expect([asteroid, yourAction, city].every((row) => matches(row, filter([])))).to.be.true;
  });

  it('players: only their own moves', () => {
    const f = filter([{group: 'player', value: 'green'}]);
    expect([asteroid, yourAction, city].map((row) => matches(row, f))).deep.eq([false, false, true]);
  });

  it('"me" with "−": your own losses, also in other players\' moves', () => {
    const f = filter([{group: 'me', value: 'me'}, {group: 'sign', value: '-1'}]);
    expect([asteroid, yourAction, city].map((row) => matches(row, f))).deep.eq([true, true, false]);
  });

  it('"−" with an icon: only that resource lost', () => {
    const f = filter([{group: 'me', value: 'me'}, {group: 'sign', value: '-1'}, {group: 'icon', value: 'plant'}]);
    expect([asteroid, yourAction].map((row) => matches(row, f))).deep.eq([true, false]);
  });

  it('kinds and card colours are alternatives', () => {
    const f = filter([{group: 'kind', value: 'project'}, {group: 'type', value: 'event'}]);
    expect([asteroid, yourAction, city].map((row) => matches(row, f))).deep.eq([true, false, true]);
  });

  it('tiles count as icons', () => {
    expect(matches(city, filter([{group: 'icon', value: 'city'}]))).to.be.true;
    expect(matches(city, filter([{group: 'icon', value: 'ocean'}]))).to.be.false;
  });

  it('hides text lines and card purchases with options, keeps text lines matching the free text', () => {
    const message: LogRow = {type: 'message', message: lead, indexes: [0]};
    const research: LogRow = {type: 'research', entries: [], indexes: [0]};
    expect(matches(message, filter([{group: 'kind', value: 'ma'}]))).to.be.false;
    expect(matches(research, filter([], 'x'))).to.be.false;
    expect(matches(message, filter([], 'asteroid'))).to.be.true;
    expect(matches(message, filter([], 'zeppelin'))).to.be.false;
  });
});
