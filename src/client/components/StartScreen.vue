<template>
<div class="start-screen">
  <!-- Sprache und Einstellungen oben rechts als Milchglas-Buttons, wie im Spiel -->
  <div class="start-screen-toolbar">
    <LanguageIcon/>
    <PreferencesIcon/>
  </div>
  <div class="start-screen-links" :class="{'start-screen-links--globe': globeReady}">
    <div class="start-screen-header start-screen-link--title">
      <div class="start-screen-title-top">TERRAFORMING</div>
      <div class="start-screen-title-bottom">MARS</div>
    </div>
    <!-- Reihe im Planeten-Bild (planets.jpg) ergibt sich aus der Position: Reihe 0 ist der Titel -->
    <a v-for="(link, index) in links"
      :key="link.label"
      class="start-screen-link"
      :class="{'start-screen-link--active': activeIndex === index}"
      :style="{'--sprite-row': index + 1}"
      :href="link.href"
      :target="link.external ? '_blank' : undefined"
      @pointerdown="lastPointerType = $event.pointerType"
      @pointerenter="$event.pointerType === 'mouse' && activate(index)"
      @pointerleave="$event.pointerType === 'mouse' && deactivate(index)"
      @focus="($event.target as HTMLElement).matches(':focus-visible') && activate(index)"
      @blur="deactivate(index)"
      @click="onClick(index, $event)">
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
// Index jedes Menüpunkts in der PlanetRotation (fehlt eine Canvas, verschieben sich die Indizes sonst)
const rotationIndexes: Array<number | undefined> = [];
let rotation: PlanetRotation | undefined;
let resizeObserver: ResizeObserver | undefined;

function setCanvas(index: number, element: unknown): void {
  canvases[index] = element instanceof HTMLCanvasElement ? element : undefined;
}

function setHovered(index: number, hovered: boolean): void {
  const rotationIndex = rotationIndexes[index];
  if (rotationIndex !== undefined) {
    rotation?.setHovered(rotationIndex, hovered);
  }
}

// Hervorhebung (Leuchten, Drehen): Maus-Hover, Tastatur-Fokus oder erster Tap auf Touch-Geräten
const activeIndex = ref<number | undefined>(undefined);
const lastPointerType = ref('');
// Doppel-Tap: kommt der zweite Tap innerhalb dieser Zeit, öffnet er den Link sofort, ohne dass vorher etwas leuchtet
const DOUBLE_TAP_WINDOW = 300;
let pendingTap: {index: number, timer: number} | undefined;

function activate(index: number): void {
  if (activeIndex.value !== undefined && activeIndex.value !== index) {
    setHovered(activeIndex.value, false);
  }
  activeIndex.value = index;
  setHovered(index, true);
}

function deactivate(index: number): void {
  if (activeIndex.value === index) {
    activeIndex.value = undefined;
    setHovered(index, false);
  }
}

// Touch: erster Tap hebt hervor, zweiter öffnet den Link; ein schneller Doppel-Tap öffnet direkt
function onClick(index: number, event: MouseEvent): void {
  if (lastPointerType.value !== 'touch' || activeIndex.value === index) {
    return;
  }
  if (pendingTap?.index === index) {
    window.clearTimeout(pendingTap.timer);
    pendingTap = undefined;
    return;
  }
  event.preventDefault();
  if (pendingTap !== undefined) {
    window.clearTimeout(pendingTap.timer);
  }
  pendingTap = {
    index,
    timer: window.setTimeout(() => {
      pendingTap = undefined;
      activate(index);
    }, DOUBLE_TAP_WINDOW),
  };
}

// Tap außerhalb der Menüpunkte nimmt die Hervorhebung zurück
function onDocumentPointerDown(event: PointerEvent): void {
  if (activeIndex.value !== undefined && !(event.target instanceof Element && event.target.closest('.start-screen-link'))) {
    deactivate(activeIndex.value);
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
  document.addEventListener('pointerdown', onDocumentPointerDown);
  if (typeof ResizeObserver !== 'undefined') {
    void startGlobe();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  if (pendingTap !== undefined) {
    window.clearTimeout(pendingTap.timer);
  }
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
