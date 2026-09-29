import {expect} from 'chai';
import {introFacts, tabIntro} from '@/client/components/tabIntro';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardName} from '@/common/cards/CardName';
import {PlayerViewModel} from '@/common/models/PlayerModel';

function playerView(temperature: number, oceans: number, heat: number): PlayerViewModel {
  return {game: {temperature, oceans}, thisPlayer: {heat}} as unknown as PlayerViewModel;
}

function optionInput(title: string): PlayerInputModel {
  return {type: 'option', title, buttonLabel: ''} as unknown as PlayerInputModel;
}

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

  it('shows temperature and heat before and after converting heat', () => {
    const intro = tabIntro(optionInput('Convert 8 heat into temperature'))!;
    const facts = introFacts(intro, playerView(-20, 0, 11));
    expect(facts.map((fact) => typeof fact === 'string' ? fact : fact.data.map((d) => d.value))).deep.eq([['-20', '-18'], ['11', '3']]);
  });

  it('shows the number of oceans when placing an ocean', () => {
    const intro = tabIntro(spaceInput('Select space for ocean tile'))!;
    const facts = introFacts(intro, playerView(0, 4, 0));
    expect(facts).has.length(1);
    expect(typeof facts[0] === 'string' ? facts[0] : facts[0].data.map((d) => d.value)).deep.eq(['4', '9']);
  });
});
