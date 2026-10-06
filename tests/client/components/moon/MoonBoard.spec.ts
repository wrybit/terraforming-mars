import {shallowMount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import {expect} from 'chai';
import MoonBoard from '@/client/components/moon/MoonBoard.vue';
import MoonSpace from '@/client/components/moon/MoonSpace.vue';
import {MoonModel} from '@/common/models/MoonModel';
import {SpaceType} from '@/common/boards/SpaceType';

const model: MoonModel = {
  habitatRate: 0,
  logisticRate: 0,
  miningRate: 0,
  spaces: [
    {
      id: 'm01',
      x: 1,
      y: 1,
      bonus: [],
      spaceType: SpaceType.COLONY,
      color: undefined,
      highlight: undefined,
      tileType: undefined,
    },
    {
      id: 'm37',
      x: 2,
      y: 1,
      bonus: [],
      spaceType: SpaceType.COLONY,
      color: undefined,
      highlight: undefined,
      tileType: undefined,
    },
    {
      id: 'm02',
      x: 3,
      y: 1,
      bonus: [],
      spaceType: SpaceType.LUNAR_MINE,
      color: undefined,
      highlight: undefined,
      tileType: undefined,
    },
    {
      id: 'm03',
      x: 3,
      y: 1,
      bonus: [],
      spaceType: SpaceType.LAND,
      color: undefined,
      highlight: undefined,
      tileType: undefined,
    },
  ],
};


describe('MoonBoard', () => {
  it('has visible tiles on the board', async () => {
    const wrapper = shallowMount(MoonBoard, {
      ...globalConfig,
      props: {model, tileView: 'show'},
    });

    const boardSpacesWrappers = wrapper.findAllComponents(MoonSpace).filter((wrapper) => {
      return wrapper.attributes('data-test') === 'moon-board-space';
    });

    expect(
      boardSpacesWrappers.every((wrapper) => wrapper.props('tileView') === 'show'),
    ).to.be.true;
  });

  it('has hidden tiles on the board', async () => {
    const wrapper = shallowMount(MoonBoard, {
      ...globalConfig,
      props: {model, tileView: 'show'},
    });

    const boardSpacesWrappers = wrapper.findAllComponents(MoonSpace).filter((wrapper) => {
      return wrapper.attributes('data-test') === 'moon-board-space';
    });

    expect(
      boardSpacesWrappers.every((wrapper) => wrapper.props('tileView') === 'show'),
    ).to.be.true;
  });

  it('ring layout: rates on curved tracks, bonuses outside, reached ones handed out', () => {
    const wrapper = shallowMount(MoonBoard, {...globalConfig, props: {model: {...model, habitatRate: 4}, ring: true}});
    expect(wrapper.find('.moon-board--ring').exists()).is.true;
    expect(wrapper.find('#moon_board_legend').exists()).is.false;
    // 3 rates × 9 values
    expect(wrapper.findAll('.moon-ring__value')).has.length(27);
    expect(wrapper.findAll('.moon-ring__value--active')).has.length(3);
    // Card at 3, production at 6 for each rate; habitat 4 has handed out its card
    expect(wrapper.findAll('.moon-ring__bonus')).has.length(6);
    expect(wrapper.findAll('.track-bonus-pin--done')).has.length(1);
  });
});
