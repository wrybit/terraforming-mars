<template>
<div class="start-screen">
  <!-- Sprache und Einstellungen oben rechts als Milchglas-Buttons, wie im Spiel -->
  <div class="start-screen-toolbar">
    <LanguageIcon/>
    <PreferencesIcon/>
  </div>
  <div class="start-screen-links">
    <div class="start-screen-header start-screen-link--title">
      <div class="start-screen-title-top">TERRAFORMING</div>
      <div class="start-screen-title-bottom">MARS</div>
    </div>
    <!-- Reihe im Planeten-Bild (planets.jpg) ergibt sich aus der Position: Reihe 0 ist der Titel -->
    <a v-for="(link, index) in links"
      :key="link.label"
      class="start-screen-link"
      :style="{'--sprite-row': index + 1}"
      :href="link.href"
      :target="link.external ? '_blank' : undefined"
      v-i18n>{{ link.label }}</a>
  </div>
</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import * as constants from '@/common/constants';
import {WIKI_URLS} from '@/client/utils/WikiLinks';
import {UPSTREAM_REPOSITORY_URL} from '@/client/utils/RepositoryLinks';

type StartScreenLink = {label: string, href: string, external: boolean};

// Reihenfolge = Reihenfolge der Planeten-Hintergründe; ein neuer Eintrag schiebt alle folgenden eine Reihe weiter
const links: ReadonlyArray<StartScreenLink> = [
  {label: 'New game', href: 'new-game', external: false},
  {label: 'Game rules', href: 'https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks', external: true},
  {label: 'Statistics', href: 'stats', external: false},
  {label: 'Cards list', href: 'cards', external: true},
  {label: 'Board game', href: 'https://boardgamegeek.com/boardgame/167791/terraforming-mars', external: true},
  {label: 'About us', href: UPSTREAM_REPOSITORY_URL + '#README', external: true},
  {label: 'Whats new?', href: WIKI_URLS.changelog, external: true},
  {label: 'Join us on Discord', href: constants.DISCORD_INVITE, external: true},
];

const previousViewport = ref('');

// Set the viewport width to width=device-width on the start screen so mobile browsers use their actual CSS viewport width.
// The current global viewport is width=1260, which prevents the home page from using the device width on phones.
// This is a temporary solution in order to make this edit scoped to the start screen.
// TODO: Once responsiveness covers the whole project, this code should be removed and the tag in index.html should be updated directly.
onMounted(() => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport !== null) {
    previousViewport.value = viewport.getAttribute('content') ?? '';
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1, viewport-fit=cover',
    );
  }
});

onBeforeUnmount(() => {
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute('content', previousViewport.value);
});
</script>
