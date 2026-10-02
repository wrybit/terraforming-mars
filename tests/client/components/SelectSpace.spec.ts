import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectSpace from '@/client/components/SelectSpace.vue';
import {FakeLocalStorage} from './FakeLocalStorage';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {placementZoom, releasePlacementZoom} from '@/client/components/board/placementZoom';
import {SpaceId} from '@/common/Types';

describe('SelectSpace', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
  });

  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
    document.body.innerHTML = '';
    releasePlacementZoom();
  });

  // Two board instances as in the game: column and enlarged Mars with the same IDs
  function addBoard(regionId: string, spaceId: string): HTMLElement {
    const board = document.createElement('div');
    board.id = regionId;
    const space = document.createElement('div');
    space.className = 'board-space-selectable';
    space.setAttribute('data_space_id', spaceId);
    board.appendChild(space);
    document.body.appendChild(board);
    return space;
  }

  function mountFor(spaces: Array<SpaceId>) {
    return shallowMount(SelectSpace, {
      ...globalConfig,
      attachTo: document.body,
      props: {
        playerView: {} as PlayerViewModel,
        playerinput: {title: 'Select space for ocean tile', buttonLabel: 'Save', type: 'space', spaces},
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
  }

  it('mounts without errors', () => {
    const wrapper = shallowMount(SelectSpace, {
      ...globalConfig,
      props: {
        playerView: {} as PlayerViewModel,
        playerinput: {
          title: 'Select a space',
          buttonLabel: 'Save',
          type: 'space',
          spaces: [],
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  // Tab switch away from space selection: afterwards the board must be neither highlighted nor clickable
  it('removes highlight and click handler when unmounted', () => {
    const space = addBoard('main_board', '03');
    const wrapper = mountFor(['03' as SpaceId]);
    expect(space.classList.contains('board-space--available')).to.be.true;
    expect(space.onclick).to.not.be.null;

    wrapper.unmount();
    expect(space.classList.contains('board-space--available')).to.be.false;
    expect(space.onclick).to.be.null;
  });

  it('marks spaces on every board instance and zooms the Mars board only on button click', async () => {
    const columnSpace = addBoard('main_board', '03');
    const zoomSpace = addBoard('main_board', '03');
    const wrapper = mountFor(['03' as SpaceId]);
    expect(columnSpace.classList.contains('board-space--available')).to.be.true;
    expect(zoomSpace.classList.contains('board-space--available')).to.be.true;
    expect(placementZoom.requested).to.be.false;

    await wrapper.vm.$nextTick(); // Button only appears after the spaces are bound in mounted()
    await wrapper.find('.select-space-zoom-button').trigger('click');
    expect(placementZoom.requested).to.be.true;

    wrapper.unmount();
    expect(placementZoom.requested).to.be.false;
  });

  it('offers no enlarge button for moon spaces', () => {
    addBoard('moon_board', 'm01');
    const wrapper = mountFor(['m01' as SpaceId]);
    expect(wrapper.find('.select-space-zoom-button').exists()).to.be.false;
  });
});
