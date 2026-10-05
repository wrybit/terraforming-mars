<template>
<div class="start-screen" :class="{'start-screen--intro': introPlaying, 'start-screen--loading': loading}">
  <!-- Preloader: until fonts and images are loaded, everything else stays hidden -->
  <div v-if="loading" class="start-screen-preloader" role="progressbar" :aria-valuenow="Math.round(loadProgress * 100)" aria-valuemin="0" aria-valuemax="100">
    <div class="start-screen-preloader-fill" :style="{width: `${loadProgress * 100}%`}"></div>
  </div>
  <!-- Settings menu (language, help, settings) at the top left; own class for the intro (start_intro.less) -->
  <PageToolbar class="start-screen-toolbar"/>
  <div class="start-screen-links" :class="{'start-screen-links--globe': globeReady}">
    <div class="start-screen-header start-screen-link--title">
      <!-- Logo: own frame so the intro can move it as a whole -->
      <div class="start-screen-title" :ref="setLogo" :style="logoOffset">
        <div class="start-screen-title-top">TERRAFORMING</div>
        <div class="start-screen-title-bottom">MARS</div>
      </div>
    </div>
    <!-- Row in the planet image (planets.jpg) follows from the position: row 0 is the title -->
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
      <!-- Planet surface: WebGL (planetGlobeRenderer.ts) or without WebGL flat via CSS (planetFlatRenderer.ts) -->
      <canvas class="start-screen-link-planet" :ref="(element) => setCanvas(index, element)" aria-hidden="true"></canvas>
      <span class="start-screen-link-content">
        <MobileGlyph class="start-screen-link-icon" :name="link.icon" :strokeWidth="2"/>
        <!-- v-i18n on the text span: the translation looks up the exact text content, the icon would interfere -->
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
import PageToolbar from '@/client/components/PageToolbar.vue';
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';
import {GlyphName} from '@/client/components/mobile/mobileGlyphs';
import * as constants from '@/common/constants';
import {WIKI_URLS} from '@/client/utils/WikiLinks';
import {UPSTREAM_REPOSITORY_URL} from '@/client/utils/RepositoryLinks';
import {prefersReducedMotion} from '@/client/utils/motion';

type StartScreenLink = {label: string, icon: GlyphName, planet: PlanetStripeName, href: string, external: boolean};

// Everything except "New game" opens a new tab (external), so the start page stays open.
// Order = order of the planet backgrounds (globe row); planet = stripe in planet-stripes.jpg
const links: ReadonlyArray<StartScreenLink> = [
  {label: 'New game', icon: 'newGame', planet: 'venus', href: 'new-game', external: false},
  {label: 'Statistics', icon: 'statistics', planet: 'earth', href: 'stats', external: true},
  {label: 'Cards list', icon: 'cardsList', planet: 'mars', href: 'cards', external: true},
  {label: 'Game rules', icon: 'rules', planet: 'jupiter', href: 'https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks', external: true},
  {label: 'Board game', icon: 'boardGame', planet: 'saturn', href: 'https://boardgamegeek.com/boardgame/167791/terraforming-mars', external: true},
  {label: 'Updates', icon: 'updates', planet: 'darkBlue', href: WIKI_URLS.changelog, external: true},
  {label: 'Discord', icon: 'discord', planet: 'neptune', href: constants.DISCORD_INVITE, external: true},
  {label: 'Team', icon: 'about', planet: 'moon', href: UPSTREAM_REPOSITORY_URL + '#-contributors-', external: true},
];

const previousViewport = ref('');

// Rotating planets: as soon as the renderer is ready, the planet surface replaces the image planets.jpg
const globeReady = ref(false);
const canvases: Array<HTMLCanvasElement | undefined> = [];
// Index of each menu item in the PlanetRotation (if a canvas is missing, the indices would otherwise shift)
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

// Highlight (glow, rotation): mouse hover, keyboard focus or first tap on touch devices
const activeIndex = ref<number | undefined>(undefined);
const lastPointerType = ref('');
// Double tap: if the second tap comes within this time, it opens the link immediately without anything glowing first
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

// Touch: first tap highlights, second opens the link; a quick double tap opens directly
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

// A tap outside the menu items removes the highlight
function onDocumentPointerDown(event: PointerEvent): void {
  if (activeIndex.value !== undefined && !(event.target instanceof Element && event.target.closest('.start-screen-link'))) {
    deactivate(activeIndex.value);
  }
}

// Globe position from the actual layout (globeLayout.ts); title background gets scale and offset as CSS variables
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
  // WebGL curves the stripe and lights it; without WebGL it rotates flat via CSS
  const renderer = await PlanetGlobeRenderer.create() ?? new PlanetFlatRenderer();
  const layout = measureLayout();
  if (layout === undefined) {
    return;
  }
  rotation = new PlanetRotation(renderer, prefersReducedMotion());
  links.forEach((link, index) => {
    const canvas = canvases[index];
    const placement = layout.placements[index];
    if (canvas !== undefined && placement !== undefined) {
      rotationIndexes[index] = rotation?.add(canvas, placement, PLANET_STRIPES[link.planet]);
    }
  });
  globeReady.value = true;
  // Button dimensions change with window width/height (phone, tablet): then measure and draw again
  const container = canvases[0]?.parentElement?.parentElement;
  if (container) {
    resizeObserver = new ResizeObserver(() => relayout());
    resizeObserver.observe(container);
  }
  // draw after switching to glass, once the canvas is visible and measured
  await nextTick();
  relayout();
}

// Intro on every load; a click or key press skips it
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

// Preloader: not in automated browsers (screenshots), they wait for loading themselves
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
