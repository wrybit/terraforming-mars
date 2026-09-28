<template>
  <!-- Mars-Brett bildschirmfüllend. Teleport in body, damit sticky Spalte, overflow und zoom der
       rechten Spalte das Modal weder beschneiden noch mitskalieren. -->
  <Teleport to="body">
    <div v-if="open" class="board-zoom-backdrop" role="dialog" aria-modal="true" @click="onBackdropClick">
      <button type="button" class="board-zoom-close" :aria-label="$t('Close')" @click.stop="$emit('close')">✕</button>
      <div class="board-zoom-content" ref="content" :style="{zoom: zoomFactor}">
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {closeOtherOverlays, registerOverlay} from '@/client/utils/overlayCoordinator';

// Freiraum rund um das Brett, damit es nicht am Fensterrand klebt
const VIEWPORT_MARGIN = 24;

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
}>();

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

watch(() => props.open, async (open) => {
  if (open) {
    closeOtherOverlays(overlayKey);
    zoomFactor.value = 1;
    await nextTick();
    fitToViewport();
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
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', closeOnEscape);
  window.removeEventListener('resize', fitToViewport);
  unregisterOverlay?.();
});
</script>
