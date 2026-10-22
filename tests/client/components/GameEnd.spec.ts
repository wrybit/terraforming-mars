import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import GameEnd from '@/client/components/GameEnd.vue';
import {fakePlayerViewModel} from './testHelpers';
import {BoardName} from '@/common/boards/BoardName';
import {GlobalParameter} from '@/common/GlobalParameter';

describe('GameEnd', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(GameEnd, {
      ...globalConfig,
      props: {
        participant: fakePlayerViewModel(),
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('opens the zoom modal on board click, not on the tile view button', async () => {
    const wrapper = shallowMount(GameEnd, {
      ...globalConfig,
      props: {
        participant: fakePlayerViewModel(),
      },
    });
    const board = wrapper.findComponent({name: 'Board'});

    const tileButton = document.createElement('div');
    tileButton.className = 'hide-tile-button';
    board.element.appendChild(tileButton);
    tileButton.click();
    expect((wrapper.vm as any).boardZoomOpen).to.be.false;

    await board.trigger('click');
    expect((wrapper.vm as any).boardZoomOpen).to.be.true;
    expect((wrapper.vm as any).zoomBoard).to.eq('mars');
  });

  it('scales the global parameter chart to the board maximums', () => {
    // Amazonis Planitia raises the maximums: completed parameters are 100%, not more
    const participant = fakePlayerViewModel();
    const game = participant.game as any;
    game.gameOptions = {...game.gameOptions, boardName: BoardName.AMAZONIS_PLANITIA, expansions: {...game.gameOptions.expansions, venus: true}};
    game.globalsPerGeneration = [{
      [GlobalParameter.TEMPERATURE]: 14,
      [GlobalParameter.OXYGEN]: 18,
      [GlobalParameter.OCEANS]: 11,
      [GlobalParameter.VENUS]: 33,
    }];
    const wrapper = shallowMount(GameEnd, {
      ...globalConfig,
      props: {participant},
    });
    const datasets = (wrapper.vm as any).globalsDataset;
    expect(datasets.map((dataset: {data: Array<number>}) => dataset.data[0])).deep.eq([100, 100, 100, 100]);
  });
});
