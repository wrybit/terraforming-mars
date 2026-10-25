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
const typed = (type: LogMessageDataType, value: string): LogMessageData => ({type, value} as LogMessageData);
const actionAt = (rows: ReturnType<typeof groupLogMessages>, index: number) => {
  const row = rows[index];
  if (row?.type !== 'action') {
    throw new Error('expected an action row at ' + index);
  }
  return row.action;
};
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

  it('groups a played card with its payment (upstream 973694909) as cost icons, not as text in brackets', () => {
    const rows = groupLogMessages([
      message('${0} played ${1} [ ${2} ]', player('red'), card(CardName.ALGAE), text('-1:r:steel: -12:r:megacredits: -2:cr:microbe:')),
      message('${0} gained ${1} ${2}', player('red'), raw('1'), text('plant')),
      message('${0} played ${1} [ ${2} ]', player('red'), card(CardName.BIG_ASTEROID), text('0')),
    ]);
    expect(rows).has.length(2);
    expect(actionAt(rows, 0)).include({kind: 'card', card: CardName.ALGAE, player: 'red'});
    expect(actionAt(rows, 0).effects).deep.eq([
      {resource: 'steel', amount: -1, cost: true}, {resource: 'megacredit', amount: -12, cost: true},
      {resource: 'microbe', amount: -2, cost: true}, {resource: 'plant', amount: 1},
    ]);
    expect(actionAt(rows, 1).effects).deep.eq([]);
  });

  it('keeps lines that set off effects (bazaar, copied production) as text and puts their effects on the right', () => {
    const rows = groupLogMessages([
      message('${0} bought ${1} at the bazaar for ${2} M€', player('red'), text('Title of Honour'), raw('20')),
      message('${0} gained ${1} TR', player('red'), raw('2')),
      message('${0} gained ${1} ${2}', player('red'), raw('8'), text('plant')),
      message('${0} played ${1}', player('blue'), card(CardName.ALGAE)),
      message('${0} copied ${1} production with ${2}', player('blue'), card(CardName.MEDICAL_LAB), card(CardName.ROBOTIC_WORKFORCE)),
      message('${0} gained ${1} ${2} production', player('blue'), raw('2'), text('M€')),
    ]);
    expect(rows.map((row) => row.type)).deep.eq(['message', 'action', 'message']);
    const bazaar = rows[0];
    const copied = rows[2];
    if (bazaar.type !== 'message' || copied.type !== 'message') {
      throw new Error('expected text lines');
    }
    expect(bazaar.indexes).deep.eq([0, 1, 2]);
    expect(bazaar.action?.effects).deep.eq([{resource: 'tr', amount: 2}, {resource: 'plant', amount: 8}]);
    expect(copied.follows).is.true;
    expect(copied.action?.effects).deep.eq([{resource: 'megacredit', amount: 2, production: true}]);
  });

  it('puts the changes of a Dune move on the right of its line: resources, envy, Sardaukar, the other player', () => {
    const rows = groupLogMessages([
      message('${0} traded with the guild', player('red')),
      message('${0} lost ${1}${2}', player('red'), raw('4'), typed(LogMessageDataType.RESOURCE, 'titanium')),
      message('${0} gained ${1}${2}', player('red'), raw('20'), typed(LogMessageDataType.RESOURCE, 'megacredits')),
      message('${0} gained ${1} envy', player('red'), raw('1')),
      message('${0} accepted the CHOAM contract of ${1}', player('blue'), player('red')),
      message('${0} lost ${1}${2}', player('blue'), raw('20'), typed(LogMessageDataType.RESOURCE, 'megacredits')),
      message('${0} gained ${1}${2}', player('red'), raw('20'), typed(LogMessageDataType.RESOURCE, 'megacredits')),
      message('${0} recruited ${1} Sardaukar', player('green'), raw('2')),
      message('${0} gained ${1} Sardaukar', player('green'), raw('2')),
    ]);
    expect(rows.map((row) => row.type)).deep.eq(['message', 'message', 'message']);
    const [guild, pact, recruit] = rows.map((row) => (row.type === 'message' ? row.action : undefined));
    expect(guild?.effects).deep.eq([
      {resource: 'titanium', amount: -4}, {resource: 'megacredit', amount: 20}, {resource: 'envy', amount: 1, label: 'Envy'},
    ]);
    expect(pact?.effects).deep.eq([{resource: 'megacredit', amount: -20}]);
    expect(pact?.others).deep.eq([{player: 'red', effects: [{resource: 'megacredit', amount: 20}]}]);
    expect(recruit?.effects).deep.eq([{resource: 'sardaukar', amount: 2, label: 'Sardaukar'}]);
  });

  it('reads resource icon data (upstream 2cab7b413) like the older text data', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.ALGAE)),
      message('${0} gained ${1}${2}', player('red'), raw('2'), typed(LogMessageDataType.PRODUCTION, 'plants')),
      message('${0} gained ${1}${2}', player('red'), raw('1'), typed(LogMessageDataType.RESOURCE, 'plants')),
      message('${0} lost ${1}${2} because of ${3}', player('green'), raw('3'), typed(LogMessageDataType.RESOURCE, 'megacredits'), player('red')),
      message('${0} added ${1}${2} to ${3}', player('red'), raw('1'), typed(LogMessageDataType.CARD_RESOURCE, 'Microbe'), card(CardName.TARDIGRADES)),
    ]);
    const action = actionAt(rows, 0);
    expect(action.effects).deep.eq([
      {resource: 'plant', amount: 2, production: true},
      {resource: 'plant', amount: 1},
      {resource: 'microbe', amount: 1, card: CardName.TARDIGRADES},
    ]);
    expect(action.others).deep.eq([{player: 'green', effects: [{resource: 'megacredit', amount: -3}]}]);
  });

  it('treats a stolen production icon as the victim losing production only', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.ALGAE)),
      message('${3} stole ${1} ${2} from ${0}', player('green'), raw('1'), typed(LogMessageDataType.PRODUCTION, 'megacredits'), player('red')),
    ]);
    expect(actionAt(rows, 0).others).deep.eq([{player: 'green', effects: [{resource: 'megacredit', amount: -1, production: true}]}]);
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
      message('${0} found life!', player('red')),
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

  it('shows a turn handed on after one action as its own row', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.ALGAE)),
      message('${0} ended turn', player('red')),
    ]);
    expect(rows.map((row) => row.type === 'action' ? row.action.kind : row.type)).deep.eq(['card', 'endTurn']);
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
    expect(row.action.others).deep.eq([{player: 'blue', effects: [{resource: 'megacredit', amount: 1, production: true, cause: CardName.SATURN_SYSTEMS}]}]);
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

  it('groups the turmoil phase: all players lose TR, global event with its effects, new government with notes', () => {
    const rows = groupLogMessages([
      message('All players lose 1 TR.'),
      message('Resolving global event ${0}', typed(LogMessageDataType.GLOBAL_EVENT, 'Successful Organisms')),
      message('${0} gained ${1} ${2} because of ${3}', player('red'), raw('2'), text('plants'), typed(LogMessageDataType.GLOBAL_EVENT, 'Successful Organisms')),
      message('A neutral delegate is the new chairman.'),
      message('The ruling bonus is: ${0}', text('Gain 1 M€ for each plant tag')),
      message('${0} gained ${1} ${2} because of ${3}', player('blue'), raw('1'), text('M€'), typed(LogMessageDataType.PARTY, 'Greens')),
      message('The ruling policy is: ${0}', text('When you place a greenery tile, gain 4 M€')),
      message('A neutral delegate was added to the ${0} party', typed(LogMessageDataType.PARTY, 'Scientists')),
      message('A neutral delegate was added to the ${0} party', typed(LogMessageDataType.PARTY, 'Reds')),
    ]);
    expect(rows.map((row) => row.type)).deep.eq(['action', 'action', 'action']);
    expect(actionAt(rows, 0)).include({kind: 'turmoil'});
    expect(actionAt(rows, 0).everyone).deep.eq([{resource: 'tr', amount: -1}]);
    const event = actionAt(rows, 1);
    expect(event).include({kind: 'globalEvent', name: 'Successful Organisms', player: undefined});
    expect(event.others).deep.eq([{player: 'red', effects: [{resource: 'plant', amount: 2, cause: 'Successful Organisms'}]}]);
    const government = actionAt(rows, 2);
    expect(government.kind).eq('turmoil');
    expect(government.parties).deep.eq(['Scientists', 'Reds']);
    expect(government.notes?.map((note) => note.message)).deep.eq(['A neutral delegate is the new chairman.', 'The ruling bonus is: ${0}', 'The ruling policy is: ${0}']);
    expect(government.others).deep.eq([{player: 'blue', effects: [{resource: 'megacredit', amount: 1, cause: 'Greens'}]}]);
  });

  it('groups a trade with its fuel, income and colony bonuses of other players', () => {
    const rows = groupLogMessages([
      message('${0} spent ${1} M€ to trade with ${2}', player('red'), raw('9'), typed(LogMessageDataType.COLONY, 'Io')),
      message('${0} gained ${1} trade bonus', player('red'), typed(LogMessageDataType.COLONY, 'Io')),
      message('${0} gained ${1} ${2}', player('red'), raw('3'), text('heat')),
      message('${0} gained ${1} ${2}', player('red'), raw('2'), text('M€')),
      message('${0} gained ${1} ${2}', player('blue'), raw('2'), text('heat')),
    ]);
    expect(rows).has.length(1);
    const trade = actionAt(rows, 0);
    expect(trade).include({kind: 'trade', name: 'Io', player: 'red'});
    expect(trade.effects).deep.eq([{resource: 'megacredit', amount: -9, cost: true}, {resource: 'heat', amount: 3}, {resource: 'megacredit', amount: 2}]);
    expect(trade.others).deep.eq([{player: 'blue', effects: [{resource: 'heat', amount: 2}]}]);
  });

  it('shows a steal as a loss for the victim and a gain for the thief', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.ALGAE)),
      message('${3} stole ${1} ${2} from ${0}', player('green'), raw('3'), text('M€'), player('red')),
    ]);
    const action = actionAt(rows, 0);
    expect(action.effects).deep.eq([{resource: 'megacredit', amount: 3}]);
    expect(action.others).deep.eq([{player: 'green', effects: [{resource: 'megacredit', amount: -3}]}]);
  });

  it('recognises expansion effects: colony, TR, moon tile and rate, planetary track, underground token once', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.ALGAE)),
      message('${0} built a colony on ${1}', player('red'), typed(LogMessageDataType.COLONY, 'Luna')),
      message('${0} gained ${1} TR', player('red'), raw('2')),
      message('${0} placed a ${1} tile at ${2}', player('red'), typed(LogMessageDataType.TILE_TYPE, '30'), typed(LogMessageDataType.SPACE, 'm02')),
      message('${0} raised the habitat rate ${1} step(s)', player('red'), raw('1')),
      message('${0} raised the ${1} planetary track ${2} step(s)', player('red'), text('venus'), raw('1')),
      message('${0} excavated ${1} at ${2}', player('red'), typed(LogMessageDataType.UNDERGROUND_TOKEN, 'plant2'), typed(LogMessageDataType.SPACE, '03')),
      message('${0} claimed ${1} at ${2}', player('red'), typed(LogMessageDataType.UNDERGROUND_TOKEN, 'plant2'), typed(LogMessageDataType.SPACE, '03')),
    ]);
    expect(rows).has.length(1);
    expect(actionAt(rows, 0).effects).deep.eq([
      {resource: 'colony', amount: 1, label: 'Luna'},
      {resource: 'tr', amount: 2},
      {resource: 'habitat-rate', amount: 1},
      {resource: 'track-venus', amount: 1},
      {tile: 'moon-habitat', space: 'm02', amount: 0},
      {token: 'plant2', space: '03', amount: 0},
    ]);
  });

  it('starts rows for delegates and fizzled preludes', () => {
    const rows = groupLogMessages([
      message('${0} sent ${1} delegate(s) in ${2} area', player('blue'), raw('2'), typed(LogMessageDataType.PARTY, 'Mars First')),
      message('${0} fizzled. ${1} gains 15 M€.', card(CardName.ECOLOGY_EXPERTS), player('green')),
    ]);
    expect(actionAt(rows, 0)).include({kind: 'delegate', name: 'Mars First', count: 2, player: 'blue'});
    expect(rows[1].type).eq('phase');
    expect(actionAt(rows, 2)).include({kind: 'fizzled', card: CardName.ECOLOGY_EXPERTS, player: 'green'});
    expect(actionAt(rows, 2).effects).deep.eq([{resource: 'megacredit', amount: 15}]);
  });

  it('adds up delegates the same player sends into the same party in a row', () => {
    const sent = (who: string, party: string) => message('${0} sent ${1} delegate(s) in ${2} area', player(who), raw('1'), typed(LogMessageDataType.PARTY, party));
    const rows = groupLogMessages([sent('blue', 'Reds'), sent('blue', 'Reds'), sent('red', 'Reds'), sent('red', 'Greens')]);
    expect(rows.map((row) => row.type === 'action' ? [row.action.player, row.action.name, row.action.count] : [])).deep.eq([
      ['blue', 'Reds', 2], ['red', 'Reds', 1], ['red', 'Greens', 1]]);
  });

  it('shows the production of the power plant standard project also when the log does not name it', () => {
    const used = message('${0} used ${1} standard project', player('red'), card(CardName.POWER_PLANT_STANDARD_PROJECT));
    const logged = message('${0} gained ${1} ${2} production', player('red'), raw('1'), text('energy'));
    expect(actionAt(groupLogMessages([used]), 0).effects).deep.eq([{resource: 'power', amount: 1, production: true}]);
    expect(actionAt(groupLogMessages([used, logged]), 0).effects).deep.eq([{resource: 'power', amount: 1, production: true}]);
  });

  it('puts a divider above the game id at the end of the game', () => {
    const rows = groupLogMessages([message('Final greenery placement'), message('This game id was ${0}', raw('g1'))]);
    expect(rows.map((row) => row.type)).deep.eq(['message', 'phase', 'message']);
  });

  it('names a reacting card as cause, but not the card of the row itself', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.ALGAE)),
      message('${0} gained ${1} ${2} production because of ${3}', player('red'), raw('2'), text('plant'), card(CardName.ALGAE)),
      message('${0} gained ${1} ${2} because of ${3}', player('red'), raw('4'), text('M€'), card(CardName.CREDICOR)),
    ]);
    expect(actionAt(rows, 0).effects).deep.eq([{resource: 'plant', amount: 2, production: true}, {resource: 'megacredit', amount: 4, cause: CardName.CREDICOR}]);
  });

  it('explains the CrediCor refund in older logs from the tableau', () => {
    const rows = groupLogMessages([
      message('${0} played ${1}', player('red'), card(CardName.AI_CENTRAL)),
      message('${0} lost ${1} ${2} production', player('red'), raw('1'), text('energy')),
      message('${0} gained ${1} ${2}', player('red'), raw('4'), text('M€')),
    ], {tableau: {red: [CardName.CREDICOR]}});
    expect(actionAt(rows, 0).effects).deep.eq([{resource: 'power', amount: -1, production: true}, {resource: 'megacredit', amount: 4, cause: CardName.CREDICOR}]);
  });
});
