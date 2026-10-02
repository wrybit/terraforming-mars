<template>
  <!-- Linke Hälfte der Fußzeile auf der Startseite, in einer Zeile: Build-Stand, Commit und beide Quellcode-Adressen (Fork und Original).
       Bezeichnungen bleiben unübersetzt: Fachbegriffe, und "Build" ist im Wörterbuch schon als Verb ("Baue") belegt -->
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
// Kurzform wie auf GitHub (7 Zeichen); der Link führt zum Commit im Fork, denn von dort wird gebaut
const shortCommit = settings.head.slice(0, 7);
const commitUrl = `${FORK_REPOSITORY_URL}/commit/${settings.head}`;

const repositories = [
  {label: 'Fork', name: 'wrybit', url: FORK_REPOSITORY_URL},
  {label: 'Original', name: 'terraforming-mars', url: UPSTREAM_REPOSITORY_URL},
];
</script>
