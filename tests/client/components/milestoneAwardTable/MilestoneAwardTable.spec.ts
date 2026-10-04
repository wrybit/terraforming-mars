import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MilestoneAwardTable from '@/client/components/milestoneAwardTable/MilestoneAwardTable.vue';
import {ClaimedMilestoneModel} from '@/common/models/ClaimedMilestoneModel';
import {FundedAwardModel} from '@/common/models/FundedAwardModel';
import {Color} from '@/common/Color';
import {fakePublicPlayerModel} from '../testHelpers';
import {scoreRanks} from '@/client/components/milestoneAwardTable/scoreRanks';
import {playersInTurnOrder} from '@/client/utils/playersInTurnOrder';

const martin = fakePublicPlayerModel({color: 'green' as Color, name: 'Martin'});
const daniel = fakePublicPlayerModel({color: 'red' as Color, name: 'Daniel'});
const jens = fakePublicPlayerModel({color: 'blue' as Color, name: 'Jens'});

const milestones: Array<ClaimedMilestoneModel> = [
  {name: 'Terraformer', playerName: undefined, color: undefined, threshold: 35, scores: [
    {color: 'green', score: 20, claimable: false},
    {color: 'red', score: 24, claimable: false},
    {color: 'blue', score: 25, claimable: false},
  ]},
  {name: 'Mayor', playerName: 'Jens', color: 'blue', threshold: 3, scores: []},
];
const awards: Array<FundedAwardModel> = [
  {name: 'Banker', playerName: 'Daniel', color: 'red', scores: [
    {color: 'green', score: 17},
    {color: 'red', score: 17},
    {color: 'blue', score: 6},
  ]},
];

function mountTable(scrollable = false) {
  return shallowMount(MilestoneAwardTable, {
    ...globalConfig,
    props: {milestones, awards, players: [jens, martin, daniel], viewerColor: 'blue' as Color, scrollable},
  });
}

describe('MilestoneAwardTable', () => {
  it('scrollable: names in a fixed part, values in a part of their own with the same rows', () => {
    const wrapper = mountTable(true);
    const names = wrapper.find('.ma-table-part--names');
    const values = wrapper.find('.ma-table-part--values');
    expect(names.findAll('.ma-table-name').map((cell) => cell.text())).to.deep.eq(['Martin', 'Daniel', 'Jens']);
    expect(names.findAll('.ma-table-value')).to.have.length(0);
    expect(values.findAll('.ma-table-name')).to.have.length(0);
    expect(values.findAll('.ma-table-row')).to.have.length(names.findAll('.ma-table-row').length);
    expect(values.find('[data-test="award-Banker"]').exists()).to.be.true;
  });

  it('not scrollable: one part with names and values', () => {
    const wrapper = mountTable();
    expect(wrapper.findAll('.ma-table-part')).to.have.length(1);
    expect(wrapper.find('.ma-table-part--all [data-test="row-blue"] .ma-table-name').text()).eq('Jens');
  });

  it('lists players in turn order with the viewer last', () => {
    const rows = mountTable().findAll('[data-test^="row-"]').map((row) => row.attributes('data-test'));
    expect(rows).to.deep.eq(['row-green', 'row-red', 'row-blue']);
  });

  it('puts the leader of each column in front', () => {
    const wrapper = mountTable();
    const terraformer = wrapper.find('[data-test="row-blue"]').findAll('.ma-table-cell')[0];
    expect(terraformer.classes()).to.include('ma-table-cell--rank-1');
    // Tie at the top: both in 1st place
    const bankerCells = ['row-green', 'row-red'].map((row) => wrapper.find(`[data-test="${row}"]`).findAll('.ma-table-cell').at(-1)!);
    bankerCells.forEach((cell) => expect(cell.classes()).to.include('ma-table-cell--rank-1'));
  });

  it('shows who claimed or funded', () => {
    const wrapper = mountTable();
    expect(wrapper.find('[data-test="row-blue"] [data-test="milestone-owner"]').exists()).to.be.true;
    expect(wrapper.find('.ma-table-status [data-test="milestone-owner"]').exists()).to.be.false;
    expect(wrapper.find('[data-test="award-owner"]').text()).to.eq('Daniel');
  });

  it('greys out the rest once all places are taken', () => {
    const claimed = (name: ClaimedMilestoneModel['name']): ClaimedMilestoneModel => ({name, playerName: 'Jens', color: 'blue', threshold: 3, scores: []});
    const wrapper = shallowMount(MilestoneAwardTable, {
      ...globalConfig,
      props: {milestones: [claimed('Mayor'), claimed('Gardener'), claimed('Builder'), milestones[0]], awards, players: [jens, martin, daniel]},
    });
    expect(wrapper.find('[data-test="milestone-Terraformer"]').classes()).to.include('ma-table-cell--closed');
    expect(wrapper.find('[data-test="milestone-Mayor"]').classes()).to.not.include('ma-table-cell--closed');
    expect(wrapper.findAll('.ma-table-status .ma-table-coin')).to.have.length(0);
  });
});

describe('scoreRanks', () => {
  it('shares ranks on ties and gives zero no rank', () => {
    const ranks = scoreRanks([{color: 'green', score: 17}, {color: 'red', score: 17}, {color: 'blue', score: 6}, {color: 'yellow', score: 0}]);
    expect([...ranks.values()]).to.deep.eq([1, 1, 2, 0]);
  });
});

describe('playersInTurnOrder', () => {
  it('starts after the viewer and ends with the viewer', () => {
    expect(playersInTurnOrder([jens, martin, daniel], 'blue').map((player) => player.name)).to.deep.eq(['Martin', 'Daniel', 'Jens']);
    expect(playersInTurnOrder([jens, martin, daniel], undefined).map((player) => player.name)).to.deep.eq(['Jens', 'Martin', 'Daniel']);
  });
});
