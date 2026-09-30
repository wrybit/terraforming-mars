<template>
  <!-- Mars-Brett bildschirmfüllend. Teleport in body, damit sticky Spalte, overflow und zoom der
       rechten Spalte das Modal weder beschneiden noch mitskalieren. -->
  <Teleport to="body">
    <div v-if="visible" class="board-zoom-backdrop" ref="backdrop" role="dialog" aria-modal="true" @click="onBackdropClick">
      <!-- Die Bühne trägt nur die Flug-Animation; zoom sitzt eine Ebene tiefer, sonst würde er die
           Verschiebung der Animation mitskalieren -->
      <div class="board-zoom-stage" ref="stage">
        <div class="board-zoom-content" ref="content" :style="{zoom: zoomFactor}">
          <slot></slot>
        </div>
      </div>
    </div>
    <!-- Außerhalb des scrollenden Hintergrunds, damit Schließen und Zoom-Leiste beim Verschieben stehen bleiben -->
    <button v-if="visible" type="button" class="board-zoom-close" :aria-label="$t('Close')" @click.stop="$emit('close')">✕</button>
    <!-- Mobil-Ansicht: Zoom-Leiste unten (Pinch und Doppel-Tap gehen zusätzlich) -->
    <MobileZoomControls v-if="visible && mobileLayout" :percent="zoomPercent" @zoom="zoomAtCenter" @fit="fitWholePlanet"/>
  </Teleport>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {closeOtherOverlays, registerOverlay} from '@/client/utils/overlayCoordinator';
import {animateBoardZoom} from '@/client/components/board/boardZoomAnimation';
import {isBoardPlacementActive} from '@/client/components/board/boardPlacementActive';
import {mobileLayout} from '@/client/utils/mobileLayout';
import {DEFAULT_ZOOM_RATIO, MAX_ZOOM_RATIO, PLANET_CENTER, steppedZoomRatio, wholePlanetZoom} from '@/client/components/mobile/mobileBoardZoom';
import {attachPinchZoom} from '@/client/components/board/boardPinchZoom';
import MobileZoomControls from '@/client/components/mobile/MobileZoomControls.vue';

// Freiraum rund um das Brett, damit es nicht am Fensterrand klebt
const VIEWPORT_MARGIN = 24;

const props = defineProps<{
  open: boolean;
  // Brett in der Spalte: Start- und Zielpunkt der Animation, solange das Modal offen ist ausgeblendet
  origin?: HTMLElement;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  // Brett im Modal ist gerendert (vor der Flug-Animation)
  (event: 'rendered'): void;
  // Rück-Animation fertig, Modal ausgeblendet
  (event: 'hidden'): void;
}>();

// Bleibt beim Schließen true, bis die Rück-Animation fertig ist
const visible = ref(false);
const backdrop = ref<HTMLElement | undefined>(undefined);
const stage = ref<HTMLElement | undefined>(undefined);
const content = ref<HTMLElement | undefined>(undefined);
const zoomFactor = ref(1);
// Ungezoomte Größe des Inhalts; einmal bei zoom 1 gemessen, weil gezoomte Maße browserabhängig sind
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
  const availableHeight = window.innerHeight - 2 * VIEWPORT_MARGIN;
  zoomFactor.value = Math.min(availableWidth / naturalSize.width, availableHeight / naturalSize.height);
}

// Fenstergröße geändert: Desktop passt das Brett neu ein, mobil bleibt der gewählte Zoom (nur 100 % neu berechnet)
function onResize() {
  if (mobileLayout.value) {
    wholeZoom.value = wholePlanetZoom(window.innerWidth, window.innerHeight);
  } else {
    fitToViewport();
  }
}

// ---------- Mobil-Ansicht: Planet ohne Ring, frei zoombar und per Wischen verschiebbar ----------
// Höhe der Zoom-Leiste unten; der Planet wird im Bereich darüber mittig gesetzt
const CONTROLS_HEIGHT = 72;
// Zoom, bei dem der ganze Planet sichtbar ist (= 100 %)
const wholeZoom = ref(1);
const zoomPercent = computed(() => Math.round(zoomFactor.value / wholeZoom.value * 100));

let stopPinch: (() => void) | undefined;

function fitMobile() {
  wholeZoom.value = wholePlanetZoom(window.innerWidth, window.innerHeight);
  // Start bei 200 %: Felder sind gleich antippbar
  zoomFactor.value = wholeZoom.value * DEFAULT_ZOOM_RATIO;
}

// Planet mittig in den sichtbaren Bereich über der Zoom-Leiste schieben
function centerPlanet() {
  const element = backdrop.value;
  const board = content.value?.querySelector('.board-cont');
  if (element === undefined || board === null || board === undefined) {
    return;
  }
  const rect = board.getBoundingClientRect();
  element.scrollLeft += rect.left + PLANET_CENTER.x * zoomFactor.value - element.clientWidth / 2;
  element.scrollTop += rect.top + PLANET_CENTER.y * zoomFactor.value - (element.clientHeight - CONTROLS_HEIGHT) / 2;
}

// Zoom auf `value` setzen; der Punkt (`x`, `y`) im Fenster bleibt an seiner Stelle
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

// − und +: in 25-%-Schritten (100–300 %), um die Mitte des sichtbaren Bereichs
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
    // Doppel-Tap: nah heran bzw. zurück zum ganzen Planeten
    toggle: (x, y) => zoomFactor.value > wholeZoom.value * 1.05 ? fitWholePlanet() : setZoom(wholeZoom.value * DEFAULT_ZOOM_RATIO, x, y),
  });
}

// Brett mittig in den sichtbaren Bereich schieben (nur relevant, wenn es größer als das Fenster ist)
function centerBoard() {
  const element = backdrop.value;
  if (element !== undefined) {
    element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
  }
}

function runAnimation(direction: 'open' | 'close'): Promise<void> {
  // Mobil ohne Flug-Animation: der große Mars ist eine eigene Ansicht, kein vergrößertes Spalten-Brett
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
  visible.value = true;
  await nextTick();
  if (mobileLayout.value) {
    fitMobile();
  } else {
    fitToViewport();
  }
  emit('rendered');
  // Neuen zoom erst rendern, sonst misst die Animation das Brett noch in der alten Größe
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
  // Zwischenzeitlich wieder geöffnet: sichtbar lassen
  if (props.open) {
    return;
  }
  props.origin?.classList.remove('board-zoom-origin--hidden');
  stopPinch?.();
  stopPinch = undefined;
  visible.value = false;
  emit('hidden');
}

// Klicks auf Bedienelemente im Brett (z. B. "Plättchen ein/aus") sollen das Modal nicht schließen
function onBackdropClick(event: MouseEvent) {
  // Mobil schließt nur ✕: Wischen und Zoomen auf dem Hintergrund sollen den Mars nicht zuklappen
  if (mobileLayout.value) {
    return;
  }
  const target = event.target as HTMLElement | null;
  if (target !== null && target.closest('.hide-tile-button') !== null) {
    return;
  }
  // Während einer Feldwahl wird im Brett platziert; nur der Hintergrund verkleinert es
  if (target !== null && target.closest('.board-zoom-content') !== null && isBoardPlacementActive()) {
    return;
  }
  emit('close');
}

function closeOnEscape(event: KeyboardEvent) {
  // Offene Platzier-Bestätigung (SpaceConfirmPopover) nimmt Escape selbst als "Nein"
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
  props.origin?.classList.remove('board-zoom-origin--hidden');
  unregisterOverlay?.();
});
</script>
