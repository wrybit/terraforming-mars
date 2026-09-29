import {expect} from 'chai';
import {choiceCardDescription, choiceMenuLead, isChoiceMenu} from '@/client/components/choiceMenu';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

function option(title: string): PlayerInputModel {
  return {type: 'option', title, buttonLabel: ''} as unknown as PlayerInputModel;
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
    expect(isChoiceMenu(or(option('x'), {type: 'card', title: 'y', buttonLabel: ''} as unknown as PlayerInputModel))).is.false;
  });

  it('accepts one player choice beside plain options', () => {
    const player = {type: 'player', title: 'Select player to remove up to 4 M€ from', buttonLabel: '', players: ['red']} as unknown as PlayerInputModel;
    const menu = or(player, option('Do not remove M€'));
    expect(isChoiceMenu(menu)).is.true;
    expect(choiceMenuLead(menu)).eq(player);
    expect(isChoiceMenu(or(player, player))).is.false;
    expect(choiceMenuLead(or(option('a'), option('b'))).type).eq('or');
  });

  it('finds the card text for the explanation', () => {
    expect(choiceCardDescription('Select an option for Olympus Conference')).contains('science tag');
    expect(choiceCardDescription('Select player')).is.undefined;
  });
});
