import {expect} from 'chai';
import {shownInput, spaceWithSkip} from '@/client/components/spaceWithSkip';
import {tabIntro} from '@/client/components/tabIntro';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

const space = {type: 'space', title: 'Select space for greenery tile', buttonLabel: '', spaces: []} as unknown as PlayerInputModel;
const skip = {type: 'option', title: 'Don\'t place a greenery', buttonLabel: ''} as unknown as PlayerInputModel;
const other = {type: 'option', title: 'Convert 8 heat into temperature', buttonLabel: ''} as unknown as PlayerInputModel;

function or(title: string, ...options: Array<PlayerInputModel>): PlayerInputModel {
  return {type: 'or', title, buttonLabel: '', options} as unknown as PlayerInputModel;
}

const finalGreenery = or('Place any final greenery from plants', space, skip);

describe('spaceWithSkip', () => {
  it('recognises the final greenery placement', () => {
    expect(spaceWithSkip(finalGreenery)).deep.eq({spaceIndex: 0, skipIndices: [1]});
    expect(shownInput(finalGreenery)).eq(space);
  });

  it('keeps menus with other options', () => {
    expect(spaceWithSkip(or('Take your next action', space, skip, other))).is.undefined;
    expect(spaceWithSkip(or('x', space))).is.undefined;
    expect(shownInput(space)).eq(space);
  });

  it('marks the final greenery as the last step of the game', () => {
    const intro = tabIntro(space, finalGreenery);
    expect(intro?.finale).is.true;
    expect(intro?.facts?.map((fact) => fact.kind)).deep.eq(['finalGreenery', 'plants']);
    expect(tabIntro(space)?.finale).is.undefined;
  });
});
