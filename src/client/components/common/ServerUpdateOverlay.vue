<template>
  <!-- Covers the whole page while the server restarts: no move can be started that would get lost -->
  <div v-if="phase !== 'none'" class="server-update-overlay" role="alertdialog" aria-modal="true">
    <div class="server-update-overlay__card" role="status">
      <template v-if="phase === 'updating'">
        <div class="server-update-overlay__title" v-i18n>The server is being updated</div>
        <LoadingBar class="server-update-overlay__progress"/>
        <div class="server-update-overlay__hint">
          <span v-i18n>Please wait a moment.</span>
          <span v-i18n>All moves are saved.</span>
        </div>
      </template>
      <template v-else>
        <svg class="server-update-overlay__check" width="56" height="56" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="22"/>
          <path d="M14 25 l7 7 l13 -15"/>
        </svg>
        <div class="server-update-overlay__title" v-i18n>Server updated successfully</div>
        <!-- Fills up within 10 s and then reloads by itself; a click reloads at once -->
        <button class="btn btn-submit btn-rounded server-update-overlay__reload" @click="reload">
          <span class="server-update-overlay__reload-progress" @animationend="reload"></span>
          <span class="server-update-overlay__reload-label" v-i18n>Reload</span>
        </button>
        <div class="server-update-overlay__hint">
          <span v-i18n>All games are saved.</span>
          <span v-i18n>After reloading, play continues seamlessly.</span>
        </div>
      </template>
      <!-- What the update brings: one line per commit, cut with "…"; more than three scroll inside the box -->
      <div v-if="commits.length > 0" class="server-update-overlay__commits">
        <!-- Anzahl vorneweg, damit man sofort sieht, wie groß das Update ist -->
        <div class="server-update-overlay__commits-label">
          <span v-if="commits.length === 1" v-i18n>1 commit</span>
          <span v-else :key="commits.length" v-i18n="[String(commits.length)]">${0} commits</span>
          <span aria-hidden="true"> · </span>
          <span v-i18n>Changes in this update</span>
        </div>
        <ul class="server-update-overlay__commit-list">
          <li v-for="commit in commits" :key="commit.hash" class="server-update-overlay__commit" :title="commit.subject">
            <!-- Hash führt zum Commit auf GitHub; neues Fenster, damit die Hinweisseite offen bleibt -->
            <a class="server-update-overlay__commit-hash" :href="commitUrl(commit.hash)" target="_blank" rel="noopener noreferrer">{{ commit.hash }}</a>
            <span class="server-update-overlay__commit-subject">{{ commit.subject }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import LoadingBar from '@/client/components/common/LoadingBar.vue';
import {serverUpdateCommits, serverUpdatePhase} from '@/client/utils/serverStatus';
import {FORK_REPOSITORY_URL} from '@/client/utils/RepositoryLinks';

const phase = computed(() => serverUpdatePhase.value);
const commits = computed(() => serverUpdateCommits.value);

function commitUrl(hash: string): string {
  return `${FORK_REPOSITORY_URL}/commit/${hash}`;
}

function reload(): void {
  window.location.reload();
}
</script>
