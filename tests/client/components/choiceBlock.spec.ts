import {expect} from 'chai';
import {choiceBlockColumns} from '@/client/components/choiceBlock';
import {isSkipOption} from '@/client/components/skipOption';
import {displayedOptionIndices} from '@/client/components/orOptionsDisplayed';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';

function option(title: string): PlayerInputModel {
  return {type: 'option', title, buttonLabel: ''} as unknown as PlayerInputModel;
}

describe('choiceBlock', () => {
  it('arranges tiles as a block that is as square as possible', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 9, 10].map(choiceBlockColumns)).deep.eq([1, 2, 2, 2, 3, 3, 3, 3, 4]);
  });

  it('recognises options that change nothing', () => {
    expect(isSkipOption(option('Skip removing plants'))).is.true;
    expect(isSkipOption(option('Do not steal'))).is.true;
    expect(isSkipOption(option('Do nothing'))).is.true;
    expect(isSkipOption(option('Increase your plant production 1 step'))).is.false;
  });

  it('puts the skip option last and keeps the rest in server order', () => {
    const input = {type: 'or', title: '', buttonLabel: '', options: [option('A'), option('Skip removal'), option('B')]} as unknown as OrOptionsModel;
    expect(displayedOptionIndices(input)).deep.eq([0, 2, 1]);
  });
});
