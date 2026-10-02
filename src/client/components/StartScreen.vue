<template>
<div class="start-screen" :class="{'start-screen--intro': introPlaying, 'start-screen--loading': loading}">
  <!-- Preloader: bis Schriften und Bilder da sind, bleibt alles andere verborgen -->
  <div v-if="loading" class="start-screen-preloader" role="progressbar" :aria-valuenow="Math.round(loadProgress * 100)" aria-valuemin="0" aria-valuemax="100">
    <div class="start-screen-preloader-fill" :style="{width: `${loadProgress * 100}%`}"></div>
  </div>
  <!-- Sprache und Einstellungen oben rechts als Milchglas-Buttons, wie im Spiel -->
  <div class="start-screen-toolbar">
    <LanguageIcon/>
    <PreferencesIcon/>
  </div>
  <div class="start-screen-links" :class="{'start-screen-links--globe': globeReady}">
    <div class="start-screen-header start-screen-link--title">
      <!-- Logo: eigener Rahmen, damit das Intro es als Ganzes bewegen kann -->
      <div class="start-screen-title" :ref="setLogo" :style="logoOffset">
        <div class="start-screen-title-top">TERRAFORMING</div>
        <div class="start-screen-title-bottom">MARS</div>
      </div>
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
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import {GlobeLayout, measureGlobeLayout} from '@/client/components/startScreen/globeLayout';
import {INTRO_DURATION, logoOffsetToCenter, shouldPlayIntro} from '@/client/components/startScreen/startIntro';
import {preloadStartAssets} from '@/client/components/startScreen/startAssets';
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
  {label: 'Statistics', icon: 'statistics', planet: 'earth', href: 'stats', external: true},
  {label: 'Game rules', icon: 'rules', planet: 'mars', href: 'https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks', external: true},
  {label: 'Cards list', icon: 'cardsList', planet: 'jupiter', href: 'cards', external: true},
  {label: 'Board game', icon: 'boardGame', planet: 'saturn', href: 'https://boardgamegeek.com/boardgame/167791/terraforming-mars', external: true},
  {label: 'Updates', icon: 'updates', planet: 'darkBlue', href: WIKI_URLS.changelog, external: true},
  {label: 'Discord', icon: 'discord', planet: 'neptune', href: constants.DISCORD_INVITE, external: true},
  {label: 'Team', icon: 'about', planet: 'moon', href: UPSTREAM_REPOSITORY_URL + '#-contributors-', external: true},
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

// Lage des Globus aus dem tatsächlichen Layout (globeLayout.ts); Titel-Hintergrund bekommt Maßstab und Versatz als CSS-Variablen
function measureLayout(): GlobeLayout | undefined {
  const buttons = canvases.map((canvas) => canvas?.parentElement).filter((element): element is HTMLElement => element instanceof HTMLElement);
  const container = buttons[0]?.parentElement;
  const title = container?.querySelector('.start-screen-header');
  const layout = measureGlobeLayout(buttons, title instanceof HTMLElement ? title : undefined);
  if (layout !== undefined && container) {
    container.style.setProperty('--globe-scale', String(layout.scale));
    container.style.setProperty('--globe-title-offset', `${layout.titleOffset}px`);
  }
  return layout;
}

function relayout(): void {
  const layout = measureLayout();
  if (layout === undefined || rotation === undefined) {
    return;
  }
  rotationIndexes.forEach((rotationIndex, index) => {
    const placement = layout.placements[index];
    if (rotationIndex !== undefined && placement !== undefined) {
      rotation?.setPlacement(rotationIndex, placement);
    }
  });
  rotation.drawAll();
}

async function startGlobe(): Promise<void> {
  // WebGL wölbt den Streifen und beleuchtet ihn; ohne WebGL dreht er flach per CSS
  const renderer = await PlanetGlobeRenderer.create() ?? new PlanetFlatRenderer();
  const layout = measureLayout();
  if (layout === undefined) {
    return;
  }
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  rotation = new PlanetRotation(renderer, reducedMotion);
  links.forEach((link, index) => {
    const canvas = canvases[index];
    const placement = layout.placements[index];
    if (canvas !== undefined && placement !== undefined) {
      rotationIndexes[index] = rotation?.add(canvas, placement, PLANET_STRIPES[link.planet]);
    }
  });
  globeReady.value = true;
  // Buttonmaße ändern sich mit der Fensterbreite/-höhe (Handy, Tablet): dann neu vermessen und zeichnen
  const container = canvases[0]?.parentElement?.parentElement;
  if (container) {
    resizeObserver = new ResizeObserver(() => relayout());
    resizeObserver.observe(container);
  }
  // nach dem Umschalten auf Glas zeichnen, wenn die Canvas sichtbar und vermessen ist
  await nextTick();
  relayout();
}

// Intro bei jedem Laden; Klick oder Taste überspringt es
const introPlaying = ref(false);
const logoOffset = ref<Record<string, string>>({});
let logo: HTMLElement | undefined;
let introTimer: number | undefined;

function setLogo(element: unknown): void {
  logo = element instanceof HTMLElement ? element : undefined;
}

function endIntro(): void {
  introPlaying.value = false;
  window.clearTimeout(introTimer);
  document.removeEventListener('pointerdown', endIntro, true);
  document.removeEventListener('keydown', endIntro, true);
}

function startIntro(): void {
  if (!shouldPlayIntro() || logo === undefined) {
    return;
  }
  const offset = logoOffsetToCenter(logo);
  logoOffset.value = {'--intro-logo-x': `${offset.x}px`, '--intro-logo-y': `${offset.y}px`};
  introPlaying.value = true;
  introTimer = window.setTimeout(endIntro, INTRO_DURATION);
  document.addEventListener('pointerdown', endIntro, true);
  document.addEventListener('keydown', endIntro, true);
}

// Preloader: in automatisierten Browsern (Screenshots) nicht, die warten selbst aufs Laden
const loading = ref(false);
const loadProgress = ref(0);

async function preload(): Promise<void> {
  if (navigator.webdriver) {
    return;
  }
  loading.value = true;
  await preloadStartAssets((share) => loadProgress.value = share);
  loading.value = false;
  await nextTick();
}

onMounted(async () => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
  await preload();
  startIntro();
  if (typeof ResizeObserver !== 'undefined') {
    void startGlobe();
  }
});

onBeforeUnmount(() => {
  endIntro();
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
