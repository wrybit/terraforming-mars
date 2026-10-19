import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import KanlyBattleCard from '@/client/components/dune/KanlyBattleCard.vue';
import {KanlyModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {boardTabState, selectBoardTab} from '@/client/components/boardTabs/boardTabState';

const players = [{color: 'red', name: 'Red'}, {color: 'blue', name: 'Blue'}] as unknown as ReadonlyArray<PublicPlayerModel>;

const kanly: KanlyModel = {
  garrisons: [{color: 'red', sardaukar: 0}, {color: 'blue', sardaukar: 0}],
  battle: {spaceId: '20', owner: 'red', opener: 'blue', troops: [{color: 'blue', sardaukar: 1}]},
  foughtThisGeneration: true,
};

describe('KanlyBattleCard', () => {
  afterEach(() => selectBoardTab('mars'));

  it('leads from the coordinate to the planet and has no line about who keeps the tile', async () => {
    selectBoardTab('kanly');
    const wrapper = mount(KanlyBattleCard, {...globalConfig, props: {kanly, players, spaces: []}});
    expect(wrapper.find('.kanly-battle__verdict').exists()).is.false;
    await wrapper.find('button.kanly-battle__coordinate').trigger('click');
    expect(boardTabState.active).eq('mars');
  });
});
