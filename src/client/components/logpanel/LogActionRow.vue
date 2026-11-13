<template>
  <div v-if="row.type === 'action'" class="log-row" :class="'log-line--' + (row.action.player ?? 'neutral')" data-test="log-action-row">
    <!-- One action of the log: who, which card, and what it changed (effects right-aligned as a column) -->
    <span class="log-row-what">
      <span v-if="row.action.player !== undefined" :class="['log-row-name', 'log-row-name--' + row.action.player]">{{ playerName(row.action.player) }}</span>
      <!-- Action of a card already in play: the red arrow printed on the cards -->
      <i v-if="row.action.kind === 'action' || row.action.kind === 'partyAction'" class="log-row-action" :title="$t('Card action')"></i>
      <span v-if="cardName !== undefined" :class="['log-row-card', {'log-row-card--fizzled': row.action.kind === 'fizzled'}]"><i :class="cardStripe"></i>{{ cardName }}</span>
      <template v-if="row.action.kind === 'milestone' || row.action.kind === 'award'">
        <span class="log-row-muted">{{ $t(row.action.kind === 'milestone' ? 'Milestone' : 'Award') }}</span>
        <span class="log-row-ma">{{ $t(row.action.name ?? '') }}</span>
      </template>
      <span v-else-if="row.action.kind === 'pass'" class="log-row-muted">{{ $t('passed') }}</span>
      <span v-else-if="row.action.kind === 'endTurn'" class="log-row-muted">{{ $t('passed on') }}</span>
      <span v-else-if="row.action.kind === 'kept'" class="log-row-muted">{{ keptText }}</span>
      <span v-else-if="row.action.kind === 'fizzled'" class="log-row-muted">{{ $t('fizzled') }}</span>
      <template v-else-if="row.action.kind === 'trade'">
        <!-- Trade fleet symbol of the colony board, language-neutral -->
        <i class="log-row-trade" :title="$t('Trade')"></i>
        <span class="log-row-card"><i class="log-row-card-type background-color-colony"></i>{{ $t(row.action.name ?? '') }}</span>
      </template>
      <template v-else-if="row.action.kind === 'delegate' || row.action.kind === 'partyAction'">
        <span v-if="row.action.kind === 'delegate'" class="log-row-muted">{{ delegateText }}</span>
        <span class="log-row-party"><i :class="partyIcon(row.action.name)"></i>{{ $t(row.action.name ?? '') }}</span>
      </template>
      <template v-else-if="row.action.kind === 'globalEvent'">
        <span class="log-row-muted">{{ $t('Global event') }}</span>
        <span class="log-row-card"><i class="log-row-card-type log-row-card-type--global-event"></i>{{ $t(row.action.name ?? '') }}</span>
      </template>
      <template v-else-if="row.action.kind === 'turmoil'">
        <span class="log-row-muted">{{ $t('Turmoil') }}</span>
      </template>
      <!-- Where the action placed tiles, right after the text as in the classic log -->
      <LogSpaceChip v-for="space in placedSpaces" :key="space" :space="space" :game="viewModel.game" @spaceClicked="$emit('spaceClicked', $event)" />
    </span>
    <!-- Turmoil values right-aligned like the effects: neutral delegates, new party leaders (who + party) -->
    <span v-if="hasTurmoilChips" class="log-row-turmoil-chips">
      <span v-if="row.action.kind === 'turmoil' && (row.action.parties ?? []).length > 0" class="log-row-parties" :title="$t('Neutral delegates')">
        <i class="log-row-neutral-delegate"></i>
        <i v-for="(party, index) in row.action.parties" :key="index" :class="partyIcon(party)" :title="$t(party)"></i>
      </span>
      <span v-for="(leader, index) in shownLeaders" :key="'leader-' + index" class="log-row-parties log-row-leader" :title="$t('Party leader')">
        <span v-if="leader.player !== undefined && leader.player !== row.action.player" :class="['log-row-name', 'log-row-name--' + leader.player]">{{ playerName(leader.player) }}</span>
        <i v-else-if="leader.player === undefined" class="log-row-neutral-delegate"></i>
        <i class="log-row-leader-icon"></i>
        <i :class="partyIcon(leader.party)" :title="$t(leader.party)"></i>
      </span>
    </span>
    <LogRowEffects :action="row.action" :viewModel="viewModel" @spaceClicked="$emit('spaceClicked', $event)" />
  </div>
  <div v-else-if="row.type === 'research'" class="log-row log-row--research" data-test="log-research-row">
    <!-- Card purchase at the start of a generation, all players in one line -->
    <span class="log-row-muted">{{ $t('Research phase') }}</span>
    <!-- Still running: nobody sees the counts before everyone has bought (server holds them back) -->
    <span v-if="row.pending === true" class="log-row-research-pending" data-test="log-research-pending">{{ $t('Players are buying cards') }}<span
      class="log-row-research-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></span>
    <template v-else>
      <span v-for="entry in row.entries" :key="entry.player" class="log-row-research-entry">
        <span :class="['log-row-name', 'log-row-name--' + entry.player]">{{ playerName(entry.player) }}</span>&nbsp;{{ entry.amount }}
      </span>
    </template>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {ViewModel} from '@/common/models/PlayerModel';
import {getCard} from '@/client/cards/ClientCardManifest';
import {translateTextWithParams} from '@/client/directives/i18n';
import {LogRow} from '@/client/components/logpanel/logActions';
import {cardTypeToCss} from '@/client/components/logpanel/logCardType';
import LogRowEffects from '@/client/components/logpanel/LogRowEffects.vue';
import {SpaceId} from '@/common/Types';
import LogSpaceChip from '@/client/components/logpanel/LogSpaceChip.vue';
import {partySlug} from '@/client/components/logpanel/logCardType';

export default defineComponent({
  name: 'LogActionRow',
  components: {LogRowEffects, LogSpaceChip},
  props: {
    row: {
      type: Object as PropType<LogRow>,
      required: true,
    },
    viewModel: {
      type: Object as PropType<ViewModel>,
      required: true,
    },
  },
  emits: ['spaceClicked'],
  methods: {
    playerName(color: Color): string {
      return this.viewModel.players.find((player) => player.color === color)?.name ?? color;
    },
    partyIcon(party: string | undefined): Array<string> {
      return ['log-row-party-icon', 'log-row-party-icon--' + partySlug(party)];
    },
  },
  computed: {
    placedSpaces(): Array<SpaceId> {
      if (this.row.type !== 'action') {
        return [];
      }
      const spaces = this.row.action.effects.map((effect) => effect.space).filter((space): space is SpaceId => space !== undefined);
      return [...new Set(spaces)];
    },
    card() {
      return this.row.type === 'action' && this.row.action.card !== undefined ? getCard(this.row.action.card) : undefined;
    },
    cardName(): string | undefined {
      return this.card === undefined ? undefined : this.$t(this.card.name.split(':')[0]);
    },
    cardStripe(): Array<string> {
      const css = this.card === undefined ? undefined : cardTypeToCss[this.card.type];
      return ['log-row-card-type', css ?? 'background-color-standard-project'];
    },
    // A neutral leader of a party that got its neutral delegate in the same row needs no chip of its own
    shownLeaders(): Array<{party: string, player?: Color}> {
      if (this.row.type !== 'action') {
        return [];
      }
      const parties = this.row.action.parties ?? [];
      return (this.row.action.leaders ?? []).filter((leader) => leader.player !== undefined || !parties.includes(leader.party));
    },
    hasTurmoilChips(): boolean {
      if (this.row.type !== 'action') {
        return false;
      }
      return (this.row.action.kind === 'turmoil' && (this.row.action.parties ?? []).length > 0) || this.shownLeaders.length > 0;
    },
    delegateText(): string {
      return this.row.type === 'action' ? translateTextWithParams('${0} delegate(s)', [String(this.row.action.count ?? 1)]) : '';
    },
    keptText(): string {
      return this.row.type === 'action' ? translateTextWithParams('kept ${0} cards', [this.row.action.name ?? '0']) : '';
    },
  },
});
</script>
