import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayersTable from '@/client/components/overview/PlayersTable.vue';
import {Tag} from '@/common/cards/Tag';
import {Color} from '@/common/Color';
import {Resource} from '@/common/Resource';
import {boostRoom, fitPlayersTable, lineWidth, rowTracks, threeLinesWidth, twoLinesWidth, TagColumnGroups} from '@/client/components/overview/playersTableLayout';
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

const TAG_COLUMNS: TagColumnGroups = [
  [Tag.BUILDING, Tag.SPACE, Tag.SCIENCE, Tag.POWER, Tag.EARTH, Tag.JOVIAN, Tag.PLANT, Tag.MICROBE, Tag.ANIMAL, Tag.CITY],
  [Tag.EVENT, Tag.WILD],
];

describe('PlayersTable', () => {
  it('gives every player an equal 1fr track and keeps the own row apart with spacer tracks', () => {
    const spacer = 'var(--players-table-own-row-spacer)';
    expect(rowTracks([false, true, false])).to.deep.eq({template: `1fr ${spacer} 1fr ${spacer} 1fr`, lines: [1, 3, 5]});
    expect(rowTracks([false, false, true])).to.deep.eq({template: `1fr 1fr ${spacer} 1fr`, lines: [1, 2, 4]});
    expect(rowTracks([false, false])).to.deep.eq({template: '1fr 1fr', lines: [1, 2]});
  });

  it('lets the numbers grow only as far as the widest goods content fits its box', () => {
    const fit = fitPlayersTable(1100, TAG_COLUMNS);
    // Short values leave room, a long stock with a long production none
    expect(boostRoom(fit, 1100, TAG_COLUMNS, false, undefined, 50)).to.be.greaterThan(1.1);
    expect(boostRoom(fit, 1100, TAG_COLUMNS, false, undefined, 200)).to.eq(1);
    // Never below 1 and nothing while the width is unknown
    expect(boostRoom(fitPlayersTable(0, TAG_COLUMNS), 0, TAG_COLUMNS, false)).to.eq(1);
  });

  it('shows only tags that at least one player has', () => {
    const table = mountTable().vm;
    expect(table.tagColumns.flat()).to.deep.eq([Tag.BUILDING, Tag.SPACE]);
  });

  it('marks only a sole production leader', () => {
    const table = mountTable().vm;
    // M€ production is equal (no leader), only Red has heat
    expect(table.productionLeadersByColor).to.deep.eq({red: [Resource.HEAT]});
  });

  it('keeps the classic size while the width is unknown', () => {
    expect(fitPlayersTable(0, TAG_COLUMNS)).to.deep.eq({mode: 'line', scale: 1, showCorporation: true, extraGap: 0});
  });

  it('goes from one line over two and three lines to cards as the table gets narrower', () => {
    const wide = fitPlayersTable(1800, TAG_COLUMNS);
    expect(wide.mode).to.eq('line');
    expect(wide.showCorporation).to.be.true;
    // Standard width: everything in one line
    expect(fitPlayersTable(1000, TAG_COLUMNS).mode).to.eq('line');
    expect(fitPlayersTable(800, TAG_COLUMNS).mode).to.eq('two-lines');
    expect(fitPlayersTable(600, TAG_COLUMNS).mode).to.eq('three-lines');
    expect(fitPlayersTable(380, TAG_COLUMNS).mode).to.eq('cards');
  });

  it('never needs more width than there is', () => {
    for (let width = 300; width <= 2000; width += 10) {
      const fit = fitPlayersTable(width, TAG_COLUMNS);
      const needed = fit.mode === 'line' ? lineWidth(fit.scale, TAG_COLUMNS, fit.showCorporation, false) :
        fit.mode === 'two-lines' ? twoLinesWidth(fit.scale, TAG_COLUMNS) :
          fit.mode === 'three-lines' ? threeLinesWidth(fit.scale, TAG_COLUMNS) : 0;
      expect(needed, `width ${width} (${fit.mode})`).to.be.at.most(width);
    }
  });

  it('shows the corporation when it costs at most 5 % of the size', () => {
    for (let width = 900; width <= 1500; width += 10) {
      const fit = fitPlayersTable(width, TAG_COLUMNS);
      if (fit.mode === 'line' && !fit.showCorporation) {
        expect(lineWidth(fit.scale - 0.05, TAG_COLUMNS, true, false), `width ${width}`).to.be.greaterThan(width);
      }
    }
  });

  it('grows the numbers before it shows the corporation, and the gaps last', () => {
    const atFullSize = fitPlayersTable(1600, TAG_COLUMNS);
    expect(atFullSize.scale).to.be.at.least(1);
    expect(atFullSize.showCorporation).to.be.true;
    expect(atFullSize.extraGap).to.eq(0);
    const veryWide = fitPlayersTable(2400, TAG_COLUMNS);
    expect(veryWide.scale).to.eq(1.25);
    expect(veryWide.extraGap).to.be.greaterThan(0);
  });
});
