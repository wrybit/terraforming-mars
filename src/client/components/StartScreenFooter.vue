<template>
  <!-- Left half of the footer on the start page, in one row: build state, commit and both source code addresses (fork and original).
       Labels stay untranslated: technical terms, and "Build" is already taken as a verb ("Baue") in the dictionary -->
  <ul class="start-screen-footer-facts">
    <li>Build: {{ builtAt }}</li>
    <li>Commit: <a :href="commitUrl" target="_blank">#{{ shortCommit }}</a></li>
    <li v-for="repository in repositories" :key="repository.url" class="start-screen-footer-repository">
      <img src="assets/misc/github.png" alt="" class="start-screen-footer-github">
      {{ repository.label }}: <a :href="repository.url" target="_blank">{{ repository.name }}</a>
    </li>
  </ul>
</template>

<script setup lang="ts">
import settings from '@/genfiles/settings.json';
import {FORK_REPOSITORY_URL, UPSTREAM_REPOSITORY_URL} from '@/client/utils/RepositoryLinks';
import {formatBuildTime} from '@/client/utils/formatBuildTime';

const builtAt = formatBuildTime(settings.builtAt);
// Short form as on GitHub (7 characters); the link goes to the commit in the fork, since that is what gets built
const shortCommit = settings.head.slice(0, 7);
const commitUrl = `${FORK_REPOSITORY_URL}/commit/${settings.head}`;

const repositories = [
  {label: 'Fork', name: 'wrybit', url: FORK_REPOSITORY_URL},
  {label: 'Original', name: 'terraforming-mars', url: UPSTREAM_REPOSITORY_URL},
];
</script>
