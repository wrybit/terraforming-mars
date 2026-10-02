<template>
<div class="start-screen">
  <!-- Sprache und Einstellungen oben rechts als Milchglas-Buttons, wie im Spiel -->
  <div class="start-screen-toolbar">
    <LanguageIcon/>
    <PreferencesIcon/>
  </div>
  <div class="start-screen-links" :class="{'start-screen-links--globe': globeReady}">
    <div class="start-screen-header start-screen-link--title">
      <!-- Titel liegt auf der obersten Globus-Reihe (Merkur), wie die Buttons auf Glas -->
      <canvas class="start-screen-link-planet" :ref="setTitleCanvas" aria-hidden="true"></canvas>
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
      @mouseenter="setHovered(index, true)"
      @mouseleave="setHovered(index, false)"
      @focus="setHovered(index, true)"
      @blur="setHovered(index, false)">
      <!-- Planeten-Oberfläche: WebGL (planetGlobeRenderer.ts) oder ohne WebGL flach per CSS (planetFlatRenderer.ts) -->
      <canvas class="start-screen-link-planet" :ref="(element) => setCanvas(index, element)" aria-hidden="true"></canvas>
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
import {PlanetGlobeRenderer} from '@/client/components/startScreen/planetGlobeRenderer';
import {PlanetFlatRenderer} from '@/client/components/startScreen/planetFlatRenderer';
import {PlanetRotation} from '@/client/components/startScreen/planetRotation';
import {PLANET_STRIPES, PlanetStripeName} from '@/client/components/startScreen/planetStripes';
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';
import {GlyphName} from '@/client/components/mobile/mobileGlyphs';
import * as constants from '@/common/constants';
import {WIKI_URLS} from '@/client/utils/WikiLinks';
import {UPSTREAM_REPOSITORY_URL} from '@/client/utils/RepositoryLinks';

type StartScreenLink = {label: string, icon: GlyphName, planet: PlanetStripeName, href: string, external: boolean};

// Alles außer "Neues Spiel" öffnet einen neuen Tab (external), damit die Startseite offen bleibt.
// Reihenfolge = Reihenfolge der Planeten-Hintergründe (Globus-Reihe); planet = Streifen in planet-stripes.jpg
const links: ReadonlyArray<StartScreenLink> = [
  {label: 'New game', icon: 'newGame', planet: 'venus', href: 'new-game', external: false},
  {label: 'Game rules', icon: 'rules', planet: 'earth', href: 'https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks', external: true},
  {label: 'Statistics', icon: 'statistics', planet: 'mars', href: 'stats', external: true},
  {label: 'Cards list', icon: 'cardsList', planet: 'jupiter', href: 'cards', external: true},
  {label: 'Board game', icon: 'boardGame', planet: 'saturn', href: 'https://boardgamegeek.com/boardgame/167791/terraforming-mars', external: true},
  {label: 'Developer team', icon: 'about', planet: 'darkBlue', href: UPSTREAM_REPOSITORY_URL + '#-contributors-', external: true},
  {label: 'Updates', icon: 'updates', planet: 'neptune', href: WIKI_URLS.changelog, external: true},
  {label: 'Discord', icon: 'discord', planet: 'moon', href: constants.DISCORD_INVITE, external: true},
];

const previousViewport = ref('');

// Drehende Planeten: sobald der Zeichner bereit ist, ersetzt die Planeten-Fläche das Bild planets.jpg
const globeReady = ref(false);
const canvases: Array<HTMLCanvasElement | undefined> = [];
let titleCanvas: HTMLCanvasElement | undefined;
// Index jedes Menüpunkts in der PlanetRotation (fehlt eine Canvas, verschieben sich die Indizes sonst)
const rotationIndexes: Array<number | undefined> = [];
let rotation: PlanetRotation | undefined;
let resizeObserver: ResizeObserver | undefined;

function setCanvas(index: number, element: unknown): void {
  canvases[index] = element instanceof HTMLCanvasElement ? element : undefined;
}

function setTitleCanvas(element: unknown): void {
  titleCanvas = element instanceof HTMLCanvasElement ? element : undefined;
}

function setHovered(index: number, hovered: boolean): void {
  const rotationIndex = rotationIndexes[index];
  if (rotationIndex !== undefined) {
    rotation?.setHovered(rotationIndex, hovered);
  }
}

async function startGlobe(): Promise<void> {
  // WebGL wölbt den Streifen und beleuchtet ihn; ohne WebGL dreht er flach per CSS
  const renderer = await PlanetGlobeRenderer.create() ?? new PlanetFlatRenderer();
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  rotation = new PlanetRotation(renderer, reducedMotion);
  links.forEach((link, index) => {
    const canvas = canvases[index];
    if (canvas !== undefined) {
      rotationIndexes[index] = rotation?.add(canvas, index + 1, PLANET_STRIPES[link.planet]);
    }
  });
  // Titel: Reihe 0, dreht sich nicht (kein Hover)
  if (titleCanvas !== undefined) {
    rotation.add(titleCanvas, 0, PLANET_STRIPES.mercury);
  }
  globeReady.value = true;
  // Buttonmaße ändern sich mit der Fensterbreite/-höhe (Handy): dann neu zeichnen
  const container = canvases[0]?.parentElement?.parentElement;
  if (container) {
    resizeObserver = new ResizeObserver(() => rotation?.drawAll());
    resizeObserver.observe(container);
  }
  rotation.drawAll();
}

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    void startGlobe();
  }
});

onBeforeUnmount(() => {
  rotation?.stop();
  resizeObserver?.disconnect();
});

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
