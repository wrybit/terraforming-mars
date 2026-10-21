import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayersTableHeader from '@/client/components/overview/PlayersTableHeader.vue';
import {Tag} from '@/common/cards/Tag';
import {PlayersTableMode} from '@/client/components/overview/playersTableLayout';

const tagColumns = [[Tag.BUILDING, Tag.SPACE], [Tag.EVENT]];
const mountHeader = (mode: PlayersTableMode) => shallowMount(PlayersTableHeader, {...globalConfig, props: {mode, tagColumns}});

describe('PlayersTableHeader', () => {
  it('shows a column head per visible tag and the score icons in one line', () => {
    const header = mountHeader('line');
    expect(header.findAll('[data-test^="tag-head-"]')).to.have.length(3);
    expect(header.findAllComponents({name: 'ScoreIcon'})).to.have.length(4);
  });

  it('keeps the tag heads above the second line but leaves the score to the chips', () => {
    const header = mountHeader('two-lines');
    expect(header.findAll('[data-test^="tag-head-"]')).to.have.length(3);
    expect(header.findAllComponents({name: 'ScoreIcon'})).to.have.length(0);
  });

  it('puts the game menu in front of the first goods icon in two lines, not on a line of its own', () => {
    const header = mountHeader('two-lines');
    const firstGoods = header.find('.players-table-section--goods .players-table-cell');
    expect(firstGoods.find('.players-table-menu--inline').exists()).to.be.true;
    expect(header.findAllComponents({name: 'GameMenu'})).to.have.length(1);
  });

  it('shows only the game menu where the cells carry their own icons', () => {
    for (const mode of ['three-lines', 'cards'] as const) {
      const header = mountHeader(mode);
      expect(header.findAll('[data-test^="tag-head-"]')).to.have.length(0);
      expect(header.findComponent({name: 'GameMenu'}).exists()).to.be.true;
    }
  });
});
