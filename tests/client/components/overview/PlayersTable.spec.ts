import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayersTable from '@/client/components/overview/PlayersTable.vue';
import {Tag} from '@/common/cards/Tag';
import {Color} from '@/common/Color';
import {Resource} from '@/common/Resource';
import {fitToWidth} from '@/client/components/overview/playersTableLayout';
import {emptyTags, fakePublicPlayerModel, fakeViewModel} from '../testHelpers';

function mountTable() {
  const me = fakePublicPlayerModel({color: 'blue' as Color, megacreditProduction: 17, heatProduction: 0, tags: {...emptyTags(), [Tag.BUILDING]: 3}});
  const other = fakePublicPlayerModel({color: 'red' as Color, megacreditProduction: 17, heatProduction: 8, tags: {...emptyTags(), [Tag.SPACE]: 2}});
  const playerView = fakeViewModel({players: [other, me], thisPlayer: me});
  return shallowMount(PlayersTable, {
    ...globalConfig,
    props: {
      playerView,
      rows: [
        {player: other, firstForGen: true, actionLabel: 'passed', playerIndex: 0},
        {player: me, firstForGen: false, actionLabel: 'active', playerIndex: 1},
      ],
    },
  });
}

describe('PlayersTable', () => {
  // Gespeicherte Schalterstellung darf nicht von einem Test in den nächsten wandern
  beforeEach(() => localStorage.removeItem('players_table_sections'));

  it('shows only tags that at least one player has', () => {
    const table = mountTable().vm;
    expect(table.tagColumns.flat()).to.deep.eq([Tag.BUILDING, Tag.SPACE]);
  });

  it('marks only a sole production leader', () => {
    const table = mountTable().vm;
    // M€-Produktion ist gleich (kein Spitzenreiter), Wärme hat nur Rot
    expect(table.productionLeadersByColor).to.deep.eq({red: [Resource.HEAT]});
  });

  it('keeps score width fixed and drops hidden sections from the grid', async () => {
    const wrapper = mountTable();
    expect(wrapper.vm.template).to.contain('repeat(4, 34px)');
    wrapper.vm.toggleSection('score');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.template).not.to.contain('repeat(4, 34px)');
    // Kartenanzahl bleibt immer
    expect(wrapper.vm.template.endsWith('12px 48px')).to.be.true;
  });

  it('drops tags first, then scoring, when the column is too narrow', () => {
    const all = {goods: true, tags: true, score: true};
    const tagColumns = [[Tag.BUILDING, Tag.SPACE, Tag.SCIENCE, Tag.EARTH, Tag.PLANT], [Tag.EVENT]];
    expect(fitToWidth(all, tagColumns, 1178).autoHidden).to.deep.eq([]);
    expect(fitToWidth(all, tagColumns, 900).autoHidden).to.deep.eq(['tags']);
    expect(fitToWidth(all, tagColumns, 780).autoHidden).to.deep.eq(['tags', 'score']);
    // Zuletzt eingeschaltete Symbole bleiben, stattdessen weicht die Wertung
    expect(fitToWidth(all, tagColumns, 900, 'tags').autoHidden).to.deep.eq(['score']);
    // Unbekannte Breite (Tabelle unsichtbar) lässt alles, wie es ist
    expect(fitToWidth(all, tagColumns, 0).visibility).to.deep.eq(all);
  });
});
