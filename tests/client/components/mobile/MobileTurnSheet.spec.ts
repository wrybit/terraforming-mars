import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileTurnSheet from '@/client/components/mobile/MobileTurnSheet.vue';
import MobileTurnTile from '@/client/components/mobile/MobileTurnTile.vue';
import {TurnMenu, TurnMenuTile, buildTurnMenu} from '@/client/components/mobile/turnMenu';
import {OrOptionsModel} from '@/common/models/PlayerInputModel';

function tile(index: number, key: string, tone?: TurnMenuTile['tone']): TurnMenuTile {
  return {index, key, label: key, sub: {text: '${0} available', params: ['2']}, icon: undefined, tone, empty: false};
}

describe('MobileTurnSheet', () => {
  const menu: TurnMenu = {
    available: [tile(0, 'Claim a milestone', 'highlight')],
    actions: [tile(1, 'Play project card'), tile(2, 'Standard projects')],
    skip: undefined,
    pass: tile(3, 'Pass for this generation', 'danger'),
  };

  it('groups tiles and disables skip before the first action', () => {
    const wrapper = mount(MobileTurnSheet, {...globalConfig, props: {menu, title: 'Your turn', sub: 'Action 1 of 2'}});
    expect(wrapper.findAll('.mb-sheet-list .mb-tile')).to.have.length(1);
    expect(wrapper.findAll('.mb-sheet-grid .mb-tile')).to.have.length(2);
    const skip = wrapper.find('.mb-tile--skip');
    expect(skip.attributes('disabled')).to.not.be.undefined;
    expect(wrapper.find('.mb-tile--highlight .mb-tile-sub').text()).to.eq('2 available');
  });

  it('emits the option index of a tile', async () => {
    const wrapper = mount(MobileTurnSheet, {...globalConfig, props: {menu, title: 'Your turn', sub: ''}});
    await wrapper.findAllComponents(MobileTurnTile)[1].trigger('click');
    expect(wrapper.emitted('select')?.[0]).to.deep.eq([1]);
    await wrapper.find('.mb-sheet-backdrop').trigger('click');
    expect(wrapper.emitted('close')).to.have.length(1);
  });
});

describe('buildTurnMenu', () => {
  it('sorts options into available now, actions and turn end with counts', () => {
    const option = (title: string, extra: object = {}) => ({type: 'option', title, buttonLabel: 'Save', ...extra});
    const input = {
      type: 'or', title: 'Take your first action', buttonLabel: 'Save',
      options: [
        // showOnlyInLearnerMode: false, sonst hinge die Option vom Lernmodus anderer Tests ab
        option('Standard projects', {type: 'card', cards: [{name: 'Power Plant'}, {name: 'City', isDisabled: true}], min: 1, max: 1, showOnlyInLearnerMode: false}),
        option('Pass for this generation'),
        {type: 'option', title: {message: 'Convert ${0} plants into greenery', data: [{type: 1, value: '8'}]}, buttonLabel: 'Save'},
        option('End Turn'),
      ],
    } as unknown as OrOptionsModel;
    const menu = buildTurnMenu(input, -16);
    expect(menu.available.map((tile) => tile.key)).to.deep.eq(['Convert ${0} plants into greenery']);
    expect(menu.available[0].tone).to.eq('success');
    expect(menu.actions[0].sub).to.deep.eq({text: '${0} affordable', params: ['1']});
    expect(menu.skip?.index).to.eq(3);
    expect(menu.pass?.index).to.eq(1);
  });
});
