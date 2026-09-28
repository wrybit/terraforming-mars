import {expect} from 'chai';
import {spaceTileImage, tabIntro} from '@/client/components/tabIntro';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

describe('tabIntro', () => {
  it('shows the tile of a space selection', () => {
    expect(spaceTileImage('Select space for ocean tile')).eq('assets/tiles/ocean.png');
    expect(spaceTileImage('Select space for city')).eq('assets/tiles/city.png');
    expect(spaceTileImage('Select space for greenery tile')).eq('assets/tiles/greenery.png');
    expect(spaceTileImage('Select space for claim')).is.undefined;
  });

  it('gives every space selection the click hint', () => {
    const input = {type: 'space', title: 'Select space for city tile', buttonLabel: ''} as unknown as PlayerInputModel;
    expect(tabIntro(input)).deep.eq({tileImage: 'assets/tiles/city.png', hint: 'click-space'});
  });
});
