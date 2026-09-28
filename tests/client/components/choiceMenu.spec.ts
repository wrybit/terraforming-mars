import {expect} from 'chai';
import {choiceCardDescription, isChoiceMenu} from '@/client/components/choiceMenu';
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

  it('finds the card text for the explanation', () => {
    expect(choiceCardDescription('Select an option for Olympus Conference')).contains('science tag');
    expect(choiceCardDescription('Select player')).is.undefined;
  });
});
