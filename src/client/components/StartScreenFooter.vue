<template>
  <!-- Teile der Fußzeile auf der Startseite: Build-Stand und beide Quellcode-Adressen (Fork und Original) -->
  <span class="start-screen-footer-group">
    <span class="nowrap"><span v-i18n>deployed</span>: {{ settings.builtAt }}</span>
    <span class="nowrap"><span v-i18n>version</span>: {{ settings.head }}</span>
  </span>
  <span class="start-screen-footer-group">
    <a v-for="repository in repositories" :key="repository.url" class="start-screen-footer-repository nowrap" :href="repository.url" target="_blank">
      <img src="assets/misc/github.png" alt="" class="start-screen-footer-github">
      {{ $t(repository.label) }}: {{ repository.url.replace('https://github.com/', '') }}
    </a>
  </span>
</template>

<script setup lang="ts">
import settings from '@/genfiles/settings.json';
import {FORK_REPOSITORY_URL, UPSTREAM_REPOSITORY_URL} from '@/client/utils/RepositoryLinks';

const repositories = [
  {label: 'Fork', url: FORK_REPOSITORY_URL},
  {label: 'Original', url: UPSTREAM_REPOSITORY_URL},
];
</script>
