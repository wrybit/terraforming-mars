import {expect} from 'chai';
import {playerEffect, playerEffects, resourceAfter, resourceChanges, selectPlayerResource} from '@/client/components/selectPlayerResource';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Message} from '@/common/logs/Message';
import {CardName} from '@/common/cards/CardName';

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
    expect(playerEffect(title)).deep.eq({resource: 'megacredits', target: 'stock', direction: 'loss', amount: 7});
  });

  it('describes production and stock effects', () => {
    const decrease = {
      message: 'Select player to decrease ${0} production by ${1} step(s)',
      data: [{type: LogMessageDataType.STRING as const, value: 'heat'}, {type: LogMessageDataType.RAW_STRING as const, value: '2'}],
    };
    expect(playerEffect(decrease)).deep.eq({resource: 'heat', target: 'production', direction: 'loss', amount: 2});
    expect(playerEffect('Select player to remove up to 4 M€ from')).deep.eq({resource: 'megacredits', target: 'stock', direction: 'loss', amount: 4});
    expect(playerEffect({message: 'Steal 1 ${0} from ${1}', data: [{type: LogMessageDataType.STRING as const, value: 'steel'}]}))
      .deep.eq({resource: 'steel', target: 'stock', direction: 'loss', amount: 1});
    expect(playerEffect('Select player')).is.undefined;
  });

  it('computes the state after the attack', () => {
    const snapshot = {stock: 3, production: 1};
    expect(resourceAfter(snapshot, {resource: 'steel', target: 'stock', direction: 'loss', amount: 4})).deep.eq({stock: 0, production: 1});
    expect(resourceAfter(snapshot, {resource: 'steel', target: 'production', direction: 'loss', amount: 2})).deep.eq({stock: 3, production: -1});
    expect(resourceAfter(snapshot, {resource: 'steel', target: 'stock'})).deep.eq(snapshot);
    expect(resourceAfter(snapshot, {resource: 'steel', target: 'production', direction: 'gain', amount: 1})).deep.eq({stock: 3, production: 2});
  });

  it('describes own gains', () => {
    expect(playerEffect('Increase megacredits production 1 step')).deep.eq({resource: 'megacredits', target: 'production', direction: 'gain', amount: 1});
    expect(playerEffect('Remove microbes to gain M€')?.direction).is.undefined;
    expect(playerEffect('Do not remove M€')).is.undefined;
  });

  it('splits a payment into cost and result', () => {
    expect(playerEffects('Spend 1 plant to gain 7 M€.')).deep.eq([
      {resource: 'plants', target: 'stock', direction: 'loss', amount: 1},
      {resource: 'megacredits', target: 'stock', direction: 'gain', amount: 7},
    ]);
    expect(playerEffects('Decrease energy production 1 step to gain 8 M€')).deep.eq([
      {resource: 'energy', target: 'production', direction: 'loss', amount: 1},
      {resource: 'megacredits', target: 'stock', direction: 'gain', amount: 8},
    ]);
    // A piece without its own verb takes the verb of its clause
    expect(playerEffects('Remove 2 floaters from ANY CARD to gain 1 titanium and 2 M€').map((e) => [e.resource, e.direction, e.amount]))
      .deep.eq([['titanium', 'gain', 1], ['megacredits', 'gain', 2]]);
    // Amount depending on the game state stays open
    expect(playerEffects('Spend 1 floater here to gain 1 M€ per city on Mars')[0].amount).is.undefined;
    expect(playerEffects('Do not remove M€')).deep.eq([]);
  });

  it('fills text parameters but not card names', () => {
    const title: Message = {message: 'Spend ${0} ${1} to gain 4 M€', data: [{type: LogMessageDataType.RAW_STRING, value: '3'}, {type: LogMessageDataType.STRING, value: 'heat'}]};
    expect(playerEffects(title).map((e) => e.resource)).deep.eq(['heat', 'megacredits']);
    const card: Message = {message: 'Add 1 animal to ${0}', data: [{type: LogMessageDataType.CARD, value: CardName.HEAT_TRAPPERS}]};
    expect(playerEffects(card)).deep.eq([]);
  });

  it('lists stock and production before and after per resource', () => {
    const player = {plants: 6, plantProduction: 2, megacredits: 29, megacreditProduction: 12} as PublicPlayerModel;
    expect(resourceChanges(player, playerEffects('Spend 1 plant to gain 7 M€.'))).deep.eq([
      {resource: 'plants', before: {stock: 6, production: 2}, after: {stock: 5, production: 2}, direction: 'loss'},
      {resource: 'megacredits', before: {stock: 29, production: 12}, after: {stock: 36, production: 12}, direction: 'gain'},
    ]);
  });
});
