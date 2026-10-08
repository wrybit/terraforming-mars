<template>
  <!-- Mars board fullscreen. Teleport into body so the sticky column, overflow and zoom of the
       right column neither clip nor scale the modal. -->
  <Teleport to="body">
    <div v-if="visible" class="board-zoom-backdrop" ref="backdrop" role="dialog" aria-modal="true" :style="backdropStyle" @click="onBackdropClick">
      <!-- The stage only carries the flight animation; zoom sits one level deeper, otherwise it would
           scale the animation's translation too -->
      <div class="board-zoom-stage" ref="stage">
        <div :class="['board-zoom-content', {'board-zoom-content--framed': frame !== undefined}]" ref="content" :style="contentStyle">
          <slot></slot>
        </div>
      </div>
    </div>
    <!-- Optional banner on top (what is being placed, PlacementBanner.vue); the board is fitted below it -->
    <div v-if="visible" class="board-zoom-banner" ref="banner"><slot name="banner"></slot></div>
    <!-- Outside the scrolling background so close and the zoom bar stay put while panning -->
    <button v-if="visible" type="button" class="board-zoom-close" :aria-label="$t('Close')" @click.stop="$emit('close')">✕</button>
    <!-- Mobile view: zoom bar at the bottom (pinch and double tap work as well) -->
    <MobileZoomControls v-if="visible && mobileLayout" :percent="zoomPercent" @zoom="zoomAtCenter" @fit="fitWholePlanet"/>
  </Teleport>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {closeOtherOverlays, registerOverlay} from '@/client/utils/overlayCoordinator';
import {animateBoardZoom} from '@/client/components/board/boardZoomAnimation';
import {isBoardPlacementActive} from '@/client/components/board/boardPlacementActive';
import {mobileLayout} from '@/client/utils/mobileLayout';
import {DEFAULT_ZOOM_RATIO, MarsFrame, MAX_ZOOM_RATIO, PLANET_CENTER, steppedZoomRatio, wholePlanetZoom} from '@/client/components/mobile/mobileBoardZoom';
import {attachPinchZoom} from '@/client/components/board/boardPinchZoom';
import MobileZoomControls from '@/client/components/mobile/MobileZoomControls.vue';

// Free space around the board so it doesn't stick to the window edge
const VIEWPORT_MARGIN = 24;
// Distance of the banner from the window top (board_zoom_modal.less) and down to the board
const BANNER_TOP = 16;
const BANNER_GAP = 12;
// Mobile: room the stage keeps free on top anyway for ✕ (mobile.less .board-zoom-stage padding-top)
const MOBILE_STAGE_TOP = 56;

const props = defineProps<{
  open: boolean;
  // Board in the column: start and end point of the animation, hidden while the modal is open
  origin?: HTMLElement;
  // Mars: show the same section as the tab (marsFrame), so the outer space columns keep their place; other boards (Moon) whole
  frame?: MarsFrame;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  // Board in the modal is rendered (before the flight animation)
  (event: 'rendered'): void;
  // Return animation done, modal hidden
  (event: 'hidden'): void;
}>();

// Stays true while closing until the return animation is done
const visible = ref(false);
const backdrop = ref<HTMLElement | undefined>(undefined);
const stage = ref<HTMLElement | undefined>(undefined);
const content = ref<HTMLElement | undefined>(undefined);
const zoomFactor = ref(1);
const banner = ref<HTMLElement | undefined>(undefined);
// Height of the banner incl. its distances, 0 without banner
const bannerZone = ref(0);
let bannerObserver: ResizeObserver | undefined;
// Unzoomed size of the content; measured once at zoom 1 because zoomed dimensions are browser-dependent
let naturalSize: {width: number, height: number} | undefined;

function fitToViewport() {
  if (content.value === undefined) {
    return;
  }
  if (naturalSize === undefined) {
    naturalSize = {width: content.value.offsetWidth, height: content.value.offsetHeight};
  }
  if (naturalSize.width === 0 || naturalSize.height === 0) {
    return;
  }
  const availableWidth = window.innerWidth - 2 * VIEWPORT_MARGIN;
  const availableHeight = window.innerHeight - 2 * VIEWPORT_MARGIN - bannerZone.value;
  zoomFactor.value = Math.min(availableWidth / naturalSize.width, availableHeight / naturalSize.height);
}

// Window resized: desktop refits the board, mobile keeps the chosen zoom (only 100 % is recomputed)
function onResize() {
  if (mobileLayout.value) {
    wholeZoom.value = mobileWholeZoom();
  } else {
    fitToViewport();
  }
}

// ---------- Mobile view: planet without ring, freely zoomable and pannable by swiping ----------
// Height of the zoom bar at the bottom; the planet is centred in the area above it
const CONTROLS_HEIGHT = 72;
// Zoom at which the whole planet is visible (= 100 %)
const wholeZoom = ref(1);
const zoomPercent = computed(() => Math.round(zoomFactor.value / wholeZoom.value * 100));
// Mars: only the section of the tab (planet or ring including the outer space columns, board_zoom_modal.less)
const contentStyle = computed(() => props.frame !== undefined ? {
  'zoom': zoomFactor.value,
  'width': props.frame.width + 'px',
  'height': props.frame.height + 'px',
  '--board-frame-left': props.frame.left + 'px',
  '--board-frame-top': props.frame.top + 'px',
} : {zoom: zoomFactor.value});
let stopPinch: (() => void) | undefined;
// Desktop: the board is centred in the area below the banner; mobile: the stage starts below it
const backdropStyle = computed(() => {
  if (bannerZone.value === 0) {
    return {};
  }
  return mobileLayout.value ? {'--board-zoom-stage-top': Math.max(MOBILE_STAGE_TOP, bannerZone.value) + 'px'} : {paddingTop: bannerZone.value + 'px'};
});

// Banner height decides how much room the board has: measured on every change (rules wrap, language)
function measureBanner() {
  const element = banner.value;
  // Empty slot: the wrapper has no height and the board keeps the whole window
  const height = element === undefined ? 0 : element.offsetHeight;
  const zone = height > 0 ? BANNER_TOP + height + BANNER_GAP : 0;
  if (zone !== bannerZone.value) {
    bannerZone.value = zone;
    onResize();
  }
}

function observeBanner() {
  bannerObserver?.disconnect();
  bannerObserver = undefined;
  if (banner.value !== undefined && typeof ResizeObserver !== 'undefined') {
    bannerObserver = new ResizeObserver(() => measureBanner());
    bannerObserver.observe(banner.value);
  }
  measureBanner();
}

// Mobile, board without crop (Moon): whole board fits the area above the zoom bar
function wholeBoardZoom(): number {
  if (content.value === undefined) {
    return 1;
  }
  naturalSize ??= {width: content.value.offsetWidth, height: content.value.offsetHeight};
  if (naturalSize.width === 0 || naturalSize.height === 0) {
    return 1;
  }
  return Math.min((window.innerWidth - 2 * VIEWPORT_MARGIN) / naturalSize.width, (window.innerHeight - CONTROLS_HEIGHT - 2 * VIEWPORT_MARGIN - mobileBannerExtra()) / naturalSize.height);
}

// Mobile: what the banner covers beyond the room the stage keeps free on top anyway
function mobileBannerExtra(): number {
  return Math.max(0, bannerZone.value - MOBILE_STAGE_TOP);
}

function mobileWholeZoom(): number {
  return props.frame === undefined ? wholeBoardZoom() : wholePlanetZoom(window.innerWidth, window.innerHeight - mobileBannerExtra(), props.frame);
}

function fitMobile() {
  wholeZoom.value = mobileWholeZoom();
  // Start at 200 %: spaces are immediately tappable
  zoomFactor.value = wholeZoom.value * DEFAULT_ZOOM_RATIO;
}

// Move the planet to the centre of the visible area above the zoom bar
function centerPlanet() {
  if (props.frame === undefined) {
    centerBoard();
    return;
  }
  const element = backdrop.value;
  const board = content.value?.querySelector('.board-cont');
  if (element === undefined || board === null || board === undefined) {
    return;
  }
  const rect = board.getBoundingClientRect();
  element.scrollLeft += rect.left + PLANET_CENTER.x * zoomFactor.value - element.clientWidth / 2;
  element.scrollTop += rect.top + PLANET_CENTER.y * zoomFactor.value - (element.clientHeight - CONTROLS_HEIGHT) / 2;
}

// Set zoom to `value`; the point (`x`, `y`) in the window stays in place
function setZoom(value: number, x: number, y: number) {
  const element = backdrop.value;
  if (element === undefined) {
    return;
  }
  const clamped = Math.min(wholeZoom.value * MAX_ZOOM_RATIO, Math.max(wholeZoom.value, value));
  const ratio = clamped / zoomFactor.value;
  const pointX = element.scrollLeft + x;
  const pointY = element.scrollTop + y;
  zoomFactor.value = clamped;
  nextTick(() => {
    element.scrollLeft = pointX * ratio - x;
    element.scrollTop = pointY * ratio - y;
  });
}

// − and +: in 25 % steps (100–300 %), around the centre of the visible area
function zoomAtCenter(factor: number) {
  const ratio = steppedZoomRatio(zoomFactor.value / wholeZoom.value, factor > 1 ? 1 : -1);
  setZoom(wholeZoom.value * ratio, window.innerWidth / 2, (window.innerHeight - CONTROLS_HEIGHT) / 2);
}

async function fitWholePlanet() {
  zoomFactor.value = wholeZoom.value;
  await nextTick();
  centerPlanet();
}

function startGestures() {
  stopPinch?.();
  stopPinch = backdrop.value === undefined ? undefined : attachPinchZoom(backdrop.value, {
    zoomBy: (factor, x, y) => setZoom(zoomFactor.value * factor, x, y),
    // Double tap: zoom in close or back to the whole planet
    toggle: (x, y) => zoomFactor.value > wholeZoom.value * 1.05 ? fitWholePlanet() : setZoom(wholeZoom.value * DEFAULT_ZOOM_RATIO, x, y),
  });
}

// Move the board to the centre of the visible area (only relevant if it is larger than the window)
function centerBoard() {
  const element = backdrop.value;
  if (element !== undefined) {
    element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
  }
}

function runAnimation(direction: 'open' | 'close'): Promise<void> {
  // Mobile without flight animation: the large Mars is a view of its own, not an enlarged column board
  if (backdrop.value === undefined || stage.value === undefined || mobileLayout.value) {
    return Promise.resolve();
  }
  return animateBoardZoom({
    direction,
    backdrop: backdrop.value,
    stage: stage.value,
    origin: props.origin,
  });
}

async function show() {
  closeOtherOverlays(overlayKey);
  zoomFactor.value = 1;
  // Content may have changed (Mars or Moon): measure again
  naturalSize = undefined;
  visible.value = true;
  await nextTick();
  observeBanner();
  if (mobileLayout.value) {
    fitMobile();
  } else {
    fitToViewport();
  }
  emit('rendered');
  // Render the new zoom first, otherwise the animation still measures the board at the old size
  await nextTick();
  if (mobileLayout.value) {
    centerPlanet();
    startGestures();
  } else {
    centerBoard();
  }
  props.origin?.classList.add('board-zoom-origin--hidden');
  await runAnimation('open');
}

async function hide() {
  await runAnimation('close');
  // Reopened in the meantime: keep visible
  if (props.open) {
    return;
  }
  props.origin?.classList.remove('board-zoom-origin--hidden');
  stopPinch?.();
  stopPinch = undefined;
  bannerObserver?.disconnect();
  bannerObserver = undefined;
  bannerZone.value = 0;
  visible.value = false;
  emit('hidden');
}

// Clicks on controls in the board (e.g. "tiles on/off") should not close the modal
function onBackdropClick(event: MouseEvent) {
  // On mobile only ✕ closes: swiping and zooming on the background should not collapse Mars
  if (mobileLayout.value) {
    return;
  }
  const target = event.target as HTMLElement | null;
  if (target !== null && target.closest('.hide-tile-button') !== null) {
    return;
  }
  // During a space selection placing happens in the board; only the background shrinks it
  if (target !== null && target.closest('.board-zoom-content') !== null && isBoardPlacementActive()) {
    return;
  }
  emit('close');
}

function closeOnEscape(event: KeyboardEvent) {
  // An open placement confirmation (SpaceConfirmPopover) handles Escape itself as "No"
  if (props.open && event.key === 'Escape' && document.querySelector('.space-confirm') === null) {
    emit('close');
  }
}

const overlayKey = 'board-zoom-modal';
let unregisterOverlay: (() => void) | undefined;

watch(() => props.open, (open) => {
  if (open) {
    show();
  } else if (visible.value) {
    hide();
  }
});

onMounted(() => {
  window.addEventListener('keydown', closeOnEscape);
  window.addEventListener('resize', onResize);
  unregisterOverlay = registerOverlay(overlayKey, () => {
    if (props.open) {
      emit('close');
    }
  });
  if (props.open) {
    show();
  }
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', closeOnEscape);
  window.removeEventListener('resize', onResize);
  stopPinch?.();
  bannerObserver?.disconnect();
  props.origin?.classList.remove('board-zoom-origin--hidden');
  unregisterOverlay?.();
});
</script>
