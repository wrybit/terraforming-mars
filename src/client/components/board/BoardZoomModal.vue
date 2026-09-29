<template>
  <!-- Mars-Brett bildschirmfüllend. Teleport in body, damit sticky Spalte, overflow und zoom der
       rechten Spalte das Modal weder beschneiden noch mitskalieren. -->
  <Teleport to="body">
    <div v-if="visible" class="board-zoom-backdrop" ref="backdrop" role="dialog" aria-modal="true" @click="onBackdropClick">
      <button type="button" class="board-zoom-close" :aria-label="$t('Close')" @click.stop="$emit('close')">✕</button>
      <!-- Die Bühne trägt nur die Flug-Animation; zoom sitzt eine Ebene tiefer, sonst würde er die
           Verschiebung der Animation mitskalieren -->
      <div class="board-zoom-stage" ref="stage">
        <div class="board-zoom-content" ref="content" :style="{zoom: zoomFactor}">
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {closeOtherOverlays, registerOverlay} from '@/client/utils/overlayCoordinator';
import {animateBoardZoom} from '@/client/components/board/boardZoomAnimation';
import {isBoardPlacementActive} from '@/client/components/board/boardPlacementActive';
import {mobileLayout} from '@/client/utils/mobileLayout';
import {mobileBoardZoom} from '@/client/components/mobile/mobileBoardZoom';

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
  const fitZoom = Math.min(availableWidth / naturalSize.width, availableHeight / naturalSize.height);
  // Mobil-Ansicht: größer als der Bildschirm, damit die Felder antippbar sind; man verschiebt das Brett per Wischen
  zoomFactor.value = mobileLayout.value ? Math.max(fitZoom, mobileBoardZoom(window.innerWidth, window.innerHeight)) : fitZoom;
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
  if (backdrop.value === undefined || stage.value === undefined) {
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
  fitToViewport();
  emit('rendered');
  // Neuen zoom erst rendern, sonst misst die Animation das Brett noch in der alten Größe
  await nextTick();
  centerBoard();
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
  visible.value = false;
  emit('hidden');
}

// Klicks auf Bedienelemente im Brett (z. B. "Plättchen ein/aus") sollen das Modal nicht schließen
function onBackdropClick(event: MouseEvent) {
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
  window.addEventListener('resize', fitToViewport);
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
  window.removeEventListener('resize', fitToViewport);
  props.origin?.classList.remove('board-zoom-origin--hidden');
  unregisterOverlay?.();
});
</script>
