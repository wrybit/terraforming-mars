import {expect} from 'chai';
import {choiceMenuLead, isChoiceMenu} from '@/client/components/choiceMenu';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {CardName} from '@/common/cards/CardName';

function option(title: string): PlayerInputModel {
  return {type: 'option', title, buttonLabel: ''} as unknown as PlayerInputModel;
}

function card(title: string): PlayerInputModel {
  return {type: 'card', title, buttonLabel: '', cards: []} as unknown as PlayerInputModel;
}

function or(...options: Array<PlayerInputModel>): PlayerInputModel {
  return {type: 'or', title: 'Select an option for Olympus Conference', buttonLabel: '', options} as unknown as PlayerInputModel;
}

describe('choiceMenu', () => {
  it('recognises a decision made of plain options', () => {
    expect(isChoiceMenu(or(option('Add a science resource to this card'), option('Remove a science resource from this card to draw a card')))).is.true;
  });

  it('keeps the action menu', () => {
    expect(isChoiceMenu(or(option('End Turn'), option('Pass for this generation')))).is.false;
    const actionMenu = {type: 'or', title: 'Take your next action', buttonLabel: '', options: [option('x'), card('y')]} as unknown as PlayerInputModel;
    expect(isChoiceMenu(actionMenu)).is.false;
  });

  it('turns a card decision with card selections into tiles too (Imported Hydrogen)', () => {
    const decision = {
      type: 'or', title: 'Select an option', sourceCard: CardName.IMPORTED_HYDROGEN, buttonLabel: '',
      options: [option('Gain 3 plants'), card('Add 2 animals to a card')],
    } as unknown as PlayerInputModel;
    expect(isChoiceMenu(decision)).is.true;
  });

  it('accepts one player choice beside plain options', () => {
    const player = {type: 'player', title: 'Select player to remove up to 4 M€ from', buttonLabel: '', players: ['red']} as unknown as PlayerInputModel;
    const menu = or(player, option('Do not remove M€'));
    expect(isChoiceMenu(menu)).is.true;
    expect(choiceMenuLead(menu)).eq(player);
    expect(isChoiceMenu(or(player, player))).is.false;
    expect(choiceMenuLead(or(option('a'), option('b'))).type).eq('or');
  });
});
