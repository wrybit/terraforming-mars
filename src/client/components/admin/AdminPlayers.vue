<template>
  <div id="admin-players" class="games-overview-container admin-home">
    <AdminGate active="players" @ready="load">
      <!-- Left every name of the statistics, right the saved merges; on narrow screens one below the other -->
      <div class="admin-players-layout">
        <section class="games-overview-card admin-players-names">
          <div class="admin-players-head">
            <h2 v-i18n>Players in the statistics</h2>
            <span class="games-overview-note">{{ players.length }} <span v-i18n>names</span></span>
          </div>
          <p class="games-overview-note" v-i18n>Drag a name onto another one to merge them. On a phone: tap the name that goes, then the name that stays.</p>
          <p v-if="errorText !== ''" class="games-overview-note games-overview-note--error">{{ errorText }}</p>
          <PlayerMergeSuggestions :suggestions="suggestions" @merge="ask" />
          <PlayerNameList :players="players" @merge="ask" />
        </section>
        <PlayerAliasesCard :aliases="aliases" :busy="busy" @unmerge="unmerge" />
      </div>
      <PlayerMergeDialog v-if="pending !== undefined" :key="pending.from.name + '→' + pending.to.name"
        :from="pending.from" :to="pending.to" :sharedGames="pending.sharedGames" :busy="busy"
        @swap="ask({from: pending.to.name, to: pending.from.name})" @cancel="pending = undefined" @confirm="merge" />
    </AdminGate>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {paths} from '@/common/app/paths';
import {StatsGame} from '@/common/stats/StatsGame';
import {AdminPlayerAliasesInfo, AdminPlayerAliasRequest, PlayerAlias} from '@/common/admin/PlayerAliases';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import AdminGate from '@/client/components/admin/AdminGate.vue';
import PlayerNameList from '@/client/components/admin/players/PlayerNameList.vue';
import PlayerMergeSuggestions from '@/client/components/admin/players/PlayerMergeSuggestions.vue';
import PlayerMergeDialog from '@/client/components/admin/players/PlayerMergeDialog.vue';
import PlayerAliasesCard from '@/client/components/admin/players/PlayerAliasesCard.vue';
import {PlayerNameStats, playerNameStats, sharedGameCount} from '@/client/components/admin/players/playerNameStats';
import {similarPlayerNames} from '@/client/components/admin/players/similarPlayerNames';

type PendingMerge = {from: PlayerNameStats, to: PlayerNameStats, sharedGames: number};

const games = ref<ReadonlyArray<StatsGame>>([]);
const aliases = ref<ReadonlyArray<PlayerAlias>>([]);
const pending = ref<PendingMerge | undefined>(undefined);
const busy = ref(false);
const errorText = ref('');

const players = computed(() => playerNameStats(games.value, aliases.value));
const suggestions = computed(() => similarPlayerNames(players.value));

// The statistics deliver the names already merged: what the list shows is what the statistics page shows
async function load(): Promise<void> {
  try {
    const [statsResponse, aliasesResponse] = await Promise.all([fetchOrFail(paths.API_STATS_GAMES), fetchOrFail(paths.API_ADMIN_PLAYER_ALIASES)]);
    games.value = await statsResponse.json();
    aliases.value = ((await aliasesResponse.json()) as AdminPlayerAliasesInfo).aliases;
    errorText.value = '';
  } catch (error) {
    errorText.value = describeFailure(failureOf(error));
  }
}

function ask(pair: {from: string, to: string}): void {
  const from = players.value.find((player) => player.name === pair.from);
  const to = players.value.find((player) => player.name === pair.to);
  if (from !== undefined && to !== undefined) {
    pending.value = {from, to, sharedGames: sharedGameCount(games.value, from.name, to.name)};
  }
}

async function send(request: AdminPlayerAliasRequest): Promise<void> {
  busy.value = true;
  try {
    await fetchOrFail(paths.API_ADMIN_PLAYER_ALIASES, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(request)});
    await load();
  } catch (error) {
    errorText.value = describeFailure(failureOf(error));
  } finally {
    busy.value = false;
  }
}

async function merge(): Promise<void> {
  if (pending.value === undefined) {
    return;
  }
  const request: AdminPlayerAliasRequest = {action: 'merge', from: pending.value.from.name, to: pending.value.to.name};
  pending.value = undefined;
  await send(request);
}

function unmerge(from: string): Promise<void> {
  return send({action: 'unmerge', from});
}
</script>
