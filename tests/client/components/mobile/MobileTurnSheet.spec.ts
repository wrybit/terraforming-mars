import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileTurnSheet from '@/client/components/mobile/MobileTurnSheet.vue';
import MobileTurnTile from '@/client/components/mobile/MobileTurnTile.vue';
import {TurnMenu, TurnMenuTile, buildTurnMenu} from '@/client/components/mobile/turnMenu';
import {OrOptionsModel} from '@/common/models/PlayerInputModel';

function tile(index: number, key: string, tone?: TurnMenuTile['tone']): TurnMenuTile {
  return {index, key, label: key, detail: undefined, count: 2, glyph: 'more', glyphTone: 'neutral', tone, empty: false};
}

describe('MobileTurnSheet', () => {
  const menu: TurnMenu = {
    available: [tile(0, 'Claim a milestone', 'highlight')],
    actions: [tile(1, 'Play project card'), tile(2, 'Standard projects')],
    skip: undefined,
    pass: tile(3, 'Pass for this generation', 'danger'),
  };

  it('groups tiles and disables skip before the first action', () => {
    const wrapper = mount(MobileTurnSheet, {...globalConfig, props: {menu, title: 'Take your first action', actionNumber: 1, actionsPerTurn: 2}});
    expect(wrapper.findAll('.mb-sheet-list .mb-tile')).to.have.length(1);
    expect(wrapper.find('.mb-tile--skip').text()).to.eq('Pass on');
    expect(wrapper.findAll('.mb-sheet-grid .mb-tile')).to.have.length(2);
    const skip = wrapper.find('.mb-tile--skip');
    expect(skip.attributes('disabled')).to.not.be.undefined;
    expect(wrapper.find('.mb-tile--highlight .mb-tile-count').text()).to.eq('2');
    expect(wrapper.find('.mb-sheet-turn .mb-turn-count').text()).to.eq('1/2');
    // Symbol-Kachel nur bei den Aktionen, nicht beim dezenten Zug-Ende
    expect(wrapper.find('.mb-sheet-grid .mb-tile-icon--neutral svg').exists()).to.be.true;
    expect(wrapper.find('.mb-sheet-end .mb-tile-icon').exists()).to.be.false;
  });

  it('closes from the turn button on its edge', async () => {
    const wrapper = mount(MobileTurnSheet, {...globalConfig, props: {menu, title: 'Take your first action', actionNumber: 2, actionsPerTurn: 2}});
    await wrapper.find('.mb-sheet-turn').trigger('click');
    expect(wrapper.emitted('close')).to.have.length(1);
  });

  it('emits the option index of a tile', async () => {
    const wrapper = mount(MobileTurnSheet, {...globalConfig, props: {menu, title: 'Take your first action', actionNumber: undefined, actionsPerTurn: 2}});
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
    const menu = buildTurnMenu(input);
    expect(menu.available.map((tile) => tile.key)).to.deep.eq(['Convert ${0} plants into greenery']);
    expect(menu.available[0].tone).to.eq('success');
    expect(menu.actions[0].count).to.eq(1);
    expect(menu.available[0].detail).to.not.be.undefined;
    expect(menu.skip?.index).to.eq(3);
    expect(menu.pass?.index).to.eq(1);
  });
});
