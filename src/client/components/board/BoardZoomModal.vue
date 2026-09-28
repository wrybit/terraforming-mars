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

// Freiraum rund um das Brett, damit es nicht am Fensterrand klebt
const VIEWPORT_MARGIN = 24;

const props = defineProps<{
  open: boolean;
  // Brett in der Spalte: Start- und Zielpunkt der Animation, solange das Modal offen ist ausgeblendet
  origin?: HTMLElement;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
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
  // Neuen zoom erst rendern, sonst misst die Animation das Brett noch in der alten Größe
  await nextTick();
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
}

// Klicks auf Bedienelemente im Brett (z. B. "Plättchen ein/aus") sollen das Modal nicht schließen
function onBackdropClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (target !== null && target.closest('.hide-tile-button') !== null) {
    return;
  }
  emit('close');
}

function closeOnEscape(event: KeyboardEvent) {
  if (props.open && event.key === 'Escape') {
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
