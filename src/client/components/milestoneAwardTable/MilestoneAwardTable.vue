<template>
  <!-- Milestones & awards as a table: icons on top, status below, one row per player.
       Only visible in the two-column layout (milestone_award_table.less) -->
  <!-- --ma-table-cell-count: cells per row without separators; the mobile view uses it to transpose the table (mobile.less) -->
  <div ref="table" :class="['ma-table', {'ma-table--split': scrollable}]" :style="{'--ma-table-cell-count': 1 + milestones.length + awards.length}">
    <!-- Parts: one ("all", without a box of its own) or, when scrollable, the fixed name column and the scrolling
         values next to it. Each part renders the same rows, so their heights match (milestone_award_table.less). -->
    <div v-for="part in parts" :key="part" :class="['ma-table-part', 'ma-table-part--' + part]" :style="{'--ma-table-columns': columnTemplate(part)}" @scroll.passive="markHorizontalScroll">
      <div class="ma-table-row ma-table-labels">
        <template v-if="hasNames(part)"><div></div><div></div></template>
        <template v-if="hasValues(part)">
          <div class="ma-table-section" :style="{gridColumn: `span ${milestones.length}`}">
            <span v-i18n>Milestones</span> <small>{{ claimedCount }}/{{ maxMilestones }} <span v-i18n>milestones claimed</span></small>
          </div>
          <div></div>
          <div class="ma-table-section" :style="{gridColumn: `span ${awards.length}`}">
            <span v-i18n>Awards</span> <small>{{ fundedCount }}/{{ maxAwards }} <span v-i18n>awards funded</span></small>
          </div>
        </template>
      </div>

      <div class="ma-table-row ma-table-head">
        <template v-if="hasNames(part)"><div></div><div class="ma-table-divider"></div></template>
        <template v-if="hasValues(part)">
          <div v-for="milestone in milestones" :key="milestone.name" :class="headCellClasses(milestoneClosed(milestone))" v-glass-tooltip="tooltip(milestone.name, milestoneDescription(milestone))" :data-test="'milestone-' + milestone.name">
            <MilestoneAwardIcon :parts="milestoneIcon(milestone)" :requirement="milestone.threshold"/>
          </div>
          <div class="ma-table-divider"></div>
          <div v-for="award in awards" :key="award.name" :class="headCellClasses(awardClosed(award))" v-glass-tooltip="tooltip(award.name, awardDescription(award))" :data-test="'award-' + award.name">
            <MilestoneAwardIcon :parts="awardIcon(award)"/>
          </div>
        </template>
      </div>

      <div class="ma-table-row ma-table-status">
        <template v-if="hasNames(part)"><div></div><div class="ma-table-divider"></div></template>
        <template v-if="hasValues(part)">
          <div v-for="milestone in milestones" :key="milestone.name" class="ma-table-cell">
            <!-- Claimed: cube only in the player row; awarded or closed: no more costs -->
            <span v-if="milestone.color === undefined && !milestoneClosed(milestone)" class="ma-table-coin">{{ milestoneCost }}</span>
          </div>
          <div class="ma-table-divider"></div>
          <div v-for="award in awards" :key="award.name" class="ma-table-cell">
            <!-- Funded: cube only up here (the player rows keep showing the score); closed: no more costs -->
            <span v-if="award.color" :class="ownerClasses(award.color)" v-glass-tooltip="award.playerName" data-test="award-owner"><i :class="cubeClasses(award.color)"></i><span class="ma-table-owner-name">{{ award.playerName }}</span></span>
            <span v-else-if="!awardClosed(award)" class="ma-table-coin">{{ nextAwardCost }}</span>
          </div>
        </template>
      </div>

      <div v-for="player in orderedPlayers" :key="player.color" :class="rowClasses(player)" :data-test="hasNames(part) ? 'row-' + player.color : undefined">
        <template v-if="hasNames(part)">
          <!-- Slot "player": the mobile view inserts the same player header here as in the players table -->
          <div class="ma-table-name"><slot name="player" :player="player">{{ player.name }}</slot></div>
          <div class="ma-table-divider"></div>
        </template>
        <template v-if="hasValues(part)">
          <div v-for="milestone in milestones" :key="milestone.name" :class="milestoneCellClasses(milestone, player)">
            <i v-if="milestone.color === player.color" :class="cubeClasses(player.color)" :title="player.name" data-test="milestone-owner"></i>
            <span v-else class="ma-table-value">{{ scoreOf(milestone.scores, player) }}</span>
          </div>
          <div class="ma-table-divider"></div>
          <div v-for="award in awards" :key="award.name" :class="awardCellClasses(award, player)">
            <span class="ma-table-value">{{ scoreOf(award.scores, player) }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {Color} from '@/common/Color';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {ClaimedMilestoneModel} from '@/common/models/ClaimedMilestoneModel';
import {FundedAwardModel} from '@/common/models/FundedAwardModel';
import {AWARD_COSTS, MAX_AWARDS, MAX_MILESTONES, MILESTONE_COST} from '@/common/constants';
import {getAward, getMilestone} from '@/client/MilestoneAwardManifest';
import MilestoneAwardIcon from '@/client/components/milestoneAwardTable/MilestoneAwardIcon.vue';
import {AWARD_ICONS, IconPart, MILESTONE_ICONS} from '@/client/components/milestoneAwardTable/milestoneAwardIcons';
import {scoreRanks} from '@/client/components/milestoneAwardTable/scoreRanks';
import {playersInTurnOrder} from '@/client/utils/playersInTurnOrder';
import {glassTooltip} from '@/client/directives/GlassTooltip';
import {observeHeaderFit} from '@/client/components/milestoneAwardTable/headerFit';
import {markHorizontalScroll} from '@/client/components/mobile/horizontalScroll';

// Cleanup function of the header adjustment per table (not reactive)
const stopHeaderFit = new WeakMap<object, () => void>();

type Score = {color: Color; score: number};

// Part of the table: everything, or (scrollable) the fixed name column and the scrolling values
type TablePart = 'all' | 'names' | 'values';

export default defineComponent({
  name: 'MilestoneAwardTable',
  components: {
    MilestoneAwardIcon,
  },
  directives: {
    glassTooltip,
  },
  props: {
    milestones: {
      type: Array as () => ReadonlyArray<ClaimedMilestoneModel>,
      required: true,
    },
    awards: {
      type: Array as () => ReadonlyArray<FundedAwardModel>,
      required: true,
    },
    players: {
      type: Array as () => ReadonlyArray<PublicPlayerModel>,
      required: true,
    },
    // Names fixed, values scroll horizontally once the columns can't shrink any further (log box, desktop)
    scrollable: {
      type: Boolean,
      default: false,
    },
    // Own player: comes last and is highlighted (missing for spectators)
    viewerColor: {
      type: String as () => Color | undefined,
      default: undefined,
    },
  },
  mounted() {
    stopHeaderFit.set(this, observeHeaderFit(this.$refs.table as HTMLElement));
  },
  beforeUnmount() {
    stopHeaderFit.get(this)?.();
  },
  computed: {
    orderedPlayers(): Array<PublicPlayerModel> {
      return playersInTurnOrder(this.players, this.viewerColor);
    },
    parts(): ReadonlyArray<TablePart> {
      return this.scrollable ? ['names', 'values'] : ['all'];
    },
    claimedCount(): number {
      return this.milestones.filter((milestone) => milestone.color !== undefined).length;
    },
    fundedCount(): number {
      return this.awards.filter((award) => award.color !== undefined).length;
    },
    maxMilestones(): number {
      return MAX_MILESTONES;
    },
    maxAwards(): number {
      return MAX_AWARDS;
    },
    milestoneCost(): number {
      return MILESTONE_COST;
    },
    nextAwardCost(): number {
      return AWARD_COSTS[this.fundedCount];
    },
  },
  methods: {
    hasNames(part: TablePart): boolean {
      return part !== 'values';
    },
    hasValues(part: TablePart): boolean {
      return part !== 'names';
    },
    // Name | separator | milestones | separator | awards. Split (scrollable): the separator after the names
    // only half as wide – its line is the edge where the values start scrolling (milestone_award_table.less)
    columnTemplate(part: TablePart): string {
      // Name column overridable via CSS (mobile.less: tablet landscape as wide as in the player list).
      // Minimum column width via CSS too: the scrolling part squeezes the columns only that far, then scrolls
      const names = `var(--ma-table-name-width, 104px) ${part === 'names' ? '6px' : '12px'}`;
      const column = 'minmax(var(--ma-table-min-column, 0px), 1fr)';
      const values = `repeat(${this.milestones.length}, ${column}) 16px repeat(${this.awards.length}, ${column})`;
      return [this.hasNames(part) ? names : '', this.hasValues(part) ? values : ''].join(' ').trim();
    },
    markHorizontalScroll,
    milestoneIcon(milestone: ClaimedMilestoneModel): ReadonlyArray<IconPart> {
      return MILESTONE_ICONS[milestone.name] ?? [];
    },
    awardIcon(award: FundedAwardModel): ReadonlyArray<IconPart> {
      return AWARD_ICONS[award.name] ?? [];
    },
    milestoneDescription(milestone: ClaimedMilestoneModel): string {
      return getMilestone(milestone.name)?.description ?? '';
    },
    awardDescription(award: FundedAwardModel): string {
      return getAward(award.name)?.description ?? '';
    },
    // All slots taken: the remaining ones can no longer be chosen and recede
    milestoneClosed(milestone: ClaimedMilestoneModel): boolean {
      return milestone.color === undefined && this.claimedCount >= this.maxMilestones;
    },
    awardClosed(award: FundedAwardModel): boolean {
      return award.color === undefined && this.fundedCount >= this.maxAwards;
    },
    headCellClasses(closed: boolean): Array<string> {
      return closed ? ['ma-table-cell', 'ma-table-cell--closed'] : ['ma-table-cell'];
    },
    tooltip(name: string, description: string): string {
      return `${this.$t(name)}: ${this.$t(description)}`;
    },
    // Without values (milestone claimed or all slots taken) the cell stays empty
    scoreOf(scores: ReadonlyArray<Score>, player: PublicPlayerModel): number | string {
      return scores.find((entry) => entry.color === player.color)?.score ?? '';
    },
    rankClasses(scores: ReadonlyArray<Score>, player: PublicPlayerModel): Array<string> {
      const score = scores.find((entry) => entry.color === player.color);
      if (score === undefined) {
        return [];
      }
      const rank = scoreRanks(scores).get(player.color) ?? 0;
      return [rank === 0 ? 'ma-table-cell--zero' : `ma-table-cell--rank-${Math.min(rank, 3)}`];
    },
    milestoneCellClasses(milestone: ClaimedMilestoneModel, player: PublicPlayerModel): Array<string> {
      const classes = ['ma-table-cell', ...this.rankClasses(milestone.scores, player)];
      // Threshold reached, milestone still free: could be claimed now
      if (milestone.scores.find((entry) => entry.color === player.color)?.claimable) {
        classes.push('ma-table-cell--claimable');
      }
      return classes;
    },
    awardCellClasses(award: FundedAwardModel, player: PublicPlayerModel): Array<string> {
      return ['ma-table-cell', ...this.rankClasses(award.scores, player)];
    },
    rowClasses(player: PublicPlayerModel): Array<string> {
      const classes = ['ma-table-row', 'ma-table-player', 'ma-table-player--' + player.color];
      if (player.color === this.viewerColor) {
        classes.push('ma-table-player--me');
      }
      return classes;
    },
    ownerClasses(color: Color): Array<string> {
      return ['ma-table-owner', 'ma-table-owner--' + color];
    },
    cubeClasses(color: Color): Array<string> {
      return ['board-cube', 'board-cube--' + color, 'ma-table-cube'];
    },
  },
});
</script>
