<template>
  <div class="stats-stack">
    <div class="stats-players">
      <a v-for="player in players" :key="player.name" :href="player.href" data-stats-link class="stats-card stats-player-card">
        <div class="stats-player-card-head" :class="`player_translucent_bg_color_${player.color}`">
          <strong>{{ player.name }}</strong>
          <span>{{ player.wins }} / {{ player.plays }}</span>
        </div>
        <dl class="stats-player-card-values">
          <div v-for="value in player.values" :key="value.label">
            <dt v-i18n>{{ value.label }}</dt>
            <dd>{{ value.value }}</dd>
          </div>
        </dl>
        <dl v-if="player.favorite !== undefined" class="stats-player-card-corporations">
          <div>
            <dt v-i18n>Most played</dt>
            <dd><span v-i18n>{{ player.favorite.name }}</span> ({{ player.favorite.plays }}×)</dd>
          </div>
          <div v-if="player.best !== undefined">
            <dt v-i18n>Most successful</dt>
            <dd><span v-i18n>{{ player.best.name }}</span> ({{ formatPercent(player.best.winRate) }})</dd>
          </div>
        </dl>
      </a>
    </div>
    <section class="stats-card">
      <h2 v-i18n>Where the points come from</h2>
      <StatsPointSources :results="results"/>
    </section>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {aggregate, EntityStats} from './statsAggregate';
import {average, StatsPlayerResult} from './statsResults';
import {formatDuration, formatNumber, formatPercent} from './statsLabels';
import StatsPointSources from './StatsPointSources.vue';
import {statsHref} from './statsNavigation';

// Most successful corporation only from two games on – a single win says nothing
const MIN_PLAYS_FOR_BEST = 2;

type PlayerCard = {
  name: string;
  color: Color;
  href: string;
  plays: number;
  wins: number;
  values: Array<{label: string, value: string | number}>;
  favorite: EntityStats | undefined;
  best: EntityStats | undefined;
};

// One card per player; a click opens their detail page
export default defineComponent({
  name: 'StatsPlayersView',
  components: {StatsPointSources},
  inject: {
    playerColors: {default: () => new Map<string, Color>()},
  },
  props: {
    results: {type: Array as PropType<ReadonlyArray<StatsPlayerResult>>, required: true},
    names: {type: Array as PropType<ReadonlyArray<string>>, required: true},
  },
  computed: {
    players(): Array<PlayerCard> {
      return this.names.map((name) => {
        const own = this.results.filter((result) => result.player.name === name);
        const wins = own.filter((result) => result.place === 1).length;
        const corporations = aggregate(own, 'corporation');
        return {
          name,
          color: (this.playerColors as Map<string, Color>).get(name) ?? 'neutral',
          href: statsHref({type: 'detail', kind: 'player', name}),
          plays: own.length,
          wins,
          values: [
            {label: 'Win rate', value: formatPercent(own.length === 0 ? undefined : wins / own.length)},
            {label: 'Avg. place', value: formatNumber(average(own.map((result) => result.place)))},
            {label: 'Avg. points', value: formatNumber(average(own.map((result) => result.player.victoryPoints)), 0)},
            {label: 'Best score', value: own.length === 0 ? '–' : Math.max(...own.map((result) => result.player.victoryPoints))},
            {label: 'Avg. TR', value: formatNumber(average(own.flatMap((result) => result.details?.terraformRating === undefined ? [] : [result.details.terraformRating])), 0)},
            {label: 'Avg. greeneries', value: formatNumber(average(own.flatMap((result) => result.details?.greeneries === undefined ? [] : [result.details.greeneries])))},
            {label: 'Avg. thinking time', value: formatDuration(average(own.flatMap((result) => result.details?.timeSeconds === undefined ? [] : [result.details.timeSeconds])))},
            {label: 'Avg. actions', value: formatNumber(average(own.flatMap((result) => result.details?.actions === undefined ? [] : [result.details.actions])), 0)},
          ],
          favorite: [...corporations].sort((first, second) => second.plays - first.plays)[0],
          best: corporations.filter((entry) => entry.plays >= MIN_PLAYS_FOR_BEST).sort((first, second) => second.winRate - first.winRate)[0],
        };
      }).filter((player) => player.plays > 0);
    },
  },
  methods: {
    formatPercent,
  },
});
</script>
