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
      :target="link.external ? '_blank' : undefined">
      <span class="start-screen-link-content">
        <MobileGlyph class="start-screen-link-icon" :name="link.icon" :strokeWidth="2"/>
        <!-- v-i18n am Text-Span: die Übersetzung sucht den exakten Textinhalt, das Symbol würde stören -->
        <span v-i18n>{{ link.label }}</span>
      </span>
    </a>
  </div>
</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';
import {GlyphName} from '@/client/components/mobile/mobileGlyphs';
import * as constants from '@/common/constants';
import {WIKI_URLS} from '@/client/utils/WikiLinks';
import {UPSTREAM_REPOSITORY_URL} from '@/client/utils/RepositoryLinks';

type StartScreenLink = {label: string, icon: GlyphName, href: string, external: boolean};

// Alles außer "Neues Spiel" öffnet einen neuen Tab (external), damit die Startseite offen bleibt.
// Reihenfolge = Reihenfolge der Planeten-Hintergründe; ein neuer Eintrag schiebt alle folgenden eine Reihe weiter
const links: ReadonlyArray<StartScreenLink> = [
  {label: 'New game', icon: 'newGame', href: 'new-game', external: false},
  {label: 'Game rules', icon: 'rules', href: 'https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks', external: true},
  {label: 'Statistics', icon: 'statistics', href: 'stats', external: true},
  {label: 'Cards list', icon: 'cardsList', href: 'cards', external: true},
  {label: 'Board game', icon: 'boardGame', href: 'https://boardgamegeek.com/boardgame/167791/terraforming-mars', external: true},
  {label: 'About us', icon: 'about', href: UPSTREAM_REPOSITORY_URL + '#-contributors-', external: true},
  {label: 'Whats new?', icon: 'updates', href: WIKI_URLS.changelog, external: true},
  {label: 'Discord', icon: 'discord', href: constants.DISCORD_INVITE, external: true},
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
