<template>
  <!-- Meilensteine & Auszeichnungen als Tabelle: Symbole oben, darunter Status, je Spieler eine Zeile.
       Nur im Zwei-Spalten-Layout sichtbar (milestone_award_table.less) -->
  <div ref="table" class="ma-table" :style="{'--ma-table-columns': columnTemplate}">
    <div class="ma-table-row ma-table-labels">
      <div></div><div></div>
      <div class="ma-table-section" :style="{gridColumn: `span ${milestones.length}`}">
        <span v-i18n>Milestones</span> <small>{{ claimedCount }}/{{ maxMilestones }} <span v-i18n>milestones claimed</span></small>
      </div>
      <div></div>
      <div class="ma-table-section" :style="{gridColumn: `span ${awards.length}`}">
        <span v-i18n>Awards</span> <small>{{ fundedCount }}/{{ maxAwards }} <span v-i18n>awards funded</span></small>
      </div>
    </div>

    <div class="ma-table-row ma-table-head">
      <div></div><div class="ma-table-divider"></div>
      <div v-for="milestone in milestones" :key="milestone.name" class="ma-table-cell" v-glass-tooltip="tooltip(milestone.name, milestoneDescription(milestone))" :data-test="'milestone-' + milestone.name">
        <MilestoneAwardIcon :parts="milestoneIcon(milestone)" :requirement="milestone.threshold"/>
      </div>
      <div class="ma-table-divider"></div>
      <div v-for="award in awards" :key="award.name" class="ma-table-cell" v-glass-tooltip="tooltip(award.name, awardDescription(award))" :data-test="'award-' + award.name">
        <MilestoneAwardIcon :parts="awardIcon(award)"/>
      </div>
    </div>

    <div class="ma-table-row ma-table-status">
      <div></div><div class="ma-table-divider"></div>
      <div v-for="milestone in milestones" :key="milestone.name" class="ma-table-cell">
        <span v-if="milestone.color" :class="ownerClasses(milestone.color)" data-test="milestone-owner"><i :class="cubeClasses(milestone.color)"></i>{{ milestone.playerName }}</span>
        <span v-else-if="claimedCount >= maxMilestones" class="ma-table-none">–</span>
        <span v-else class="ma-table-coin">{{ milestoneCost }}</span>
      </div>
      <div class="ma-table-divider"></div>
      <div v-for="award in awards" :key="award.name" class="ma-table-cell">
        <span v-if="award.color" :class="ownerClasses(award.color)" data-test="award-owner"><i :class="cubeClasses(award.color)"></i>{{ award.playerName }}</span>
        <span v-else-if="fundedCount >= maxAwards" class="ma-table-none">–</span>
        <span v-else class="ma-table-coin">{{ nextAwardCost }}</span>
      </div>
    </div>

    <div v-for="player in orderedPlayers" :key="player.color" :class="rowClasses(player)" :data-test="'row-' + player.color">
      <div class="ma-table-name">{{ player.name }}</div>
      <div class="ma-table-divider"></div>
      <div v-for="milestone in milestones" :key="milestone.name" :class="milestoneCellClasses(milestone, player)">
        <i v-if="milestone.color === player.color" :class="cubeClasses(player.color)" :title="player.name"></i>
        <span v-else class="ma-table-value">{{ scoreOf(milestone.scores, player) }}</span>
      </div>
      <div class="ma-table-divider"></div>
      <div v-for="award in awards" :key="award.name" :class="awardCellClasses(award, player)">
        <span class="ma-table-value">{{ scoreOf(award.scores, player) }}</span>
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
import {observeIconFit} from '@/client/components/milestoneAwardTable/iconFit';

// Aufräumfunktion der Symbol-Anpassung je Tabelle (nicht reaktiv)
const stopIconFit = new WeakMap<object, () => void>();

type Score = {color: Color; score: number};

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
    // Eigener Spieler: steht zuletzt und ist hervorgehoben (fehlt bei Zuschauern)
    viewerColor: {
      type: String as () => Color | undefined,
      default: undefined,
    },
  },
  mounted() {
    stopIconFit.set(this, observeIconFit(this.$refs.table as HTMLElement));
  },
  beforeUnmount() {
    stopIconFit.get(this)?.();
  },
  computed: {
    orderedPlayers(): Array<PublicPlayerModel> {
      return playersInTurnOrder(this.players, this.viewerColor);
    },
    // Name | Trenner | Meilensteine | Trenner | Auszeichnungen
    columnTemplate(): string {
      return `104px 12px repeat(${this.milestones.length}, minmax(0, 1fr)) 16px repeat(${this.awards.length}, minmax(0, 1fr))`;
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
    tooltip(name: string, description: string): string {
      return `${this.$t(name)}: ${this.$t(description)}`;
    },
    // Ohne Werte (Meilenstein beansprucht bzw. alle Plätze vergeben) bleibt die Zelle leer
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
      // Schwelle erreicht, Meilenstein noch frei: könnte jetzt beansprucht werden
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
