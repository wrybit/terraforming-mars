import {expect} from 'chai';
import {tabIntro} from '@/client/components/tabIntro';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardName} from '@/common/cards/CardName';

function spaceInput(title: PlayerInputModel['title']): PlayerInputModel {
  return {type: 'space', title, buttonLabel: ''} as unknown as PlayerInputModel;
}

describe('tabIntro', () => {
  it('shows ocean, city and greenery tiles', () => {
    expect(tabIntro(spaceInput('Select space for ocean tile'))?.tile).deep.eq({base: 'assets/tiles/ocean.png'});
    expect(tabIntro(spaceInput('Select space for city tile'))?.tile).deep.eq({base: 'assets/tiles/city.png'});
    expect(tabIntro(spaceInput('Select space for greenery tile'))?.tile).deep.eq({base: 'assets/tiles/greenery.png'});
  });

  it('shows the volcano for the volcanic spaces', () => {
    const intro = tabIntro(spaceInput('Select either Tharsis Tholus, Ascraeus Mons, Pavonis Mons or Arsia Mons'));
    expect(intro?.tile?.symbol).eq('assets/tiles/special_tile_icons/lava_flows.png');
  });

  it('shows the special tile of the card', () => {
    const title = {message: 'Select space for ${0} tile', data: [{type: LogMessageDataType.CARD as const, value: CardName.NUCLEAR_ZONE}]};
    expect(tabIntro(spaceInput(title))?.tile).deep.eq({base: 'assets/tiles/special.png', symbol: 'assets/tiles/special_tile_icons/nuclear_zone.png'});
  });

  it('keeps the click hint without a known tile', () => {
    expect(tabIntro(spaceInput('Select space for claim'))).deep.eq({tile: undefined, hint: 'click-space'});
  });
});
