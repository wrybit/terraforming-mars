import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayersTableHeader from '@/client/components/overview/PlayersTableHeader.vue';
import {Tag} from '@/common/cards/Tag';

describe('PlayersTableHeader', () => {
  it('emits the section to toggle', async () => {
    const wrapper = shallowMount(PlayersTableHeader, {
      ...globalConfig,
      props: {
        visibility: {goods: true, tags: true, score: true},
        tagColumns: [[Tag.BUILDING, Tag.SPACE], [Tag.EVENT]],
      },
    });
    await wrapper.find('[data-test="toggle-tags"]').trigger('click');
    expect(wrapper.emitted('toggle')).to.deep.eq([['tags']]);
  });

  it('shows a column head per visible tag and none when tags are hidden', () => {
    const tagColumns = [[Tag.BUILDING, Tag.SPACE], [Tag.EVENT]];
    const shown = shallowMount(PlayersTableHeader, {
      ...globalConfig,
      props: {visibility: {goods: true, tags: true, score: true}, tagColumns},
    });
    expect(shown.findAll('[data-test^="tag-head-"]')).to.have.length(3);

    const hidden = shallowMount(PlayersTableHeader, {
      ...globalConfig,
      props: {visibility: {goods: true, tags: false, score: true}, tagColumns},
    });
    expect(hidden.findAll('[data-test^="tag-head-"]')).to.have.length(0);
    expect(hidden.find('[data-test="toggle-tags"]').attributes('aria-pressed')).to.eq('false');
  });
});
