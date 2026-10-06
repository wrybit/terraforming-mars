<template>
  <CardPanel
    v-if="selectedMessage !== undefined"
    :message="selectedMessage"
    :players="viewModel.players"
    :floating="previewPosition !== undefined"
    :modal="modal"
    ref="cardPanel"
    :style="previewStyle"
    @hide="selectedMessage = undefined; modal = false"/>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {closeOtherOverlays, registerOverlay} from '@/client/utils/overlayCoordinator';
import {LogMessage} from '@/common/logs/LogMessage';
import {ViewModel} from '@/common/models/PlayerModel';
import CardPanel from '@/client/components/logpanel/CardPanel.vue';

defineProps<{
  viewModel: ViewModel;
}>();

const selectedMessage = ref<LogMessage | undefined>(undefined);
// Mouse position in window coordinates; the hover preview sits at the top right of it and follows it
type CursorPosition = {x: number, y: number};
type PanelSize = {width: number, height: number};

// Gap between the mouse pointer and the preview's nearest corner
const CURSOR_GAP = 16;
// Minimum distance of the preview from the window edges
const VIEWPORT_MARGIN = 8;

// undefined = pinned by click (touch), otherwise hover preview following the mouse
const previewPosition = ref<CursorPosition | undefined>(undefined);
// Measured size of the preview: needed to keep it inside the window (several cards stack upwards)
const panelSize = ref<PanelSize | undefined>(undefined);
const cardPanel = ref<InstanceType<typeof CardPanel> | undefined>(undefined);

// Top right of the pointer; if there is no room, flip to the left of it or push it down
function placement(cursor: CursorPosition, size: PanelSize): {left: number, top: number} {
  let left = cursor.x + CURSOR_GAP;
  if (left + size.width > window.innerWidth - VIEWPORT_MARGIN) {
    left = Math.max(VIEWPORT_MARGIN, cursor.x - CURSOR_GAP - size.width);
  }
  const top = Math.min(
    Math.max(VIEWPORT_MARGIN, cursor.y - CURSOR_GAP - size.height),
    window.innerHeight - VIEWPORT_MARGIN - size.height);
  return {left, top: Math.max(VIEWPORT_MARGIN, top)};
}

const previewStyle = computed(() => {
  const cursor = previewPosition.value;
  if (cursor === undefined) {
    return undefined;
  }
  // First frame after a new row: the size isn't measured yet, so stay invisible instead of jumping
  const size = panelSize.value;
  if (size === undefined) {
    return {left: '0px', top: '0px', visibility: 'hidden'};
  }
  const {left, top} = placement(cursor, size);
  return {left: left + 'px', top: top + 'px'};
});

// The cards differ per row (one to three, colonies, global events): measure after each change
watch([selectedMessage, () => previewPosition.value !== undefined], async () => {
  panelSize.value = undefined;
  if (previewPosition.value === undefined) {
    return;
  }
  await nextTick();
  const element = cardPanel.value?.$refs.panel as HTMLElement | undefined;
  if (element !== undefined) {
    const rect = element.getBoundingClientRect();
    panelSize.value = {width: rect.width, height: rect.height};
  }
});

// Modal over the right column for rows with many cards
const modal = ref(false);

function show(message: LogMessage) {
  selectedMessage.value = message;
  previewPosition.value = undefined;
  modal.value = false;
}

const LOG_CARDS_OVERLAY = 'log-cards';

function showModal(message: LogMessage) {
  closeOtherOverlays(LOG_CARDS_OVERLAY);
  selectedMessage.value = message;
  previewPosition.value = undefined;
  modal.value = true;
}

function preview(message: LogMessage, position: CursorPosition) {
  // Don't replace an open modal by hovering over other rows
  if (modal.value) {
    return;
  }
  selectedMessage.value = message;
  previewPosition.value = position;
}

// Mouse moved within the log: the open hover preview follows it
function follow(position: CursorPosition) {
  if (previewPosition.value !== undefined) {
    previewPosition.value = position;
  }
}

// Only close the hover preview; a panel pinned by click stays
function hidePreview() {
  if (previewPosition.value !== undefined) {
    selectedMessage.value = undefined;
    previewPosition.value = undefined;
  }
}

// Register as overlay: closes when another overlay opens (overlayCoordinator.ts)
let unregisterOverlay: (() => void) | undefined;
onMounted(() => {
  unregisterOverlay = registerOverlay(LOG_CARDS_OVERLAY, () => {
    if (modal.value) {
      selectedMessage.value = undefined;
      modal.value = false;
    }
  });
});
onBeforeUnmount(() => unregisterOverlay?.());

defineExpose({show, showModal, preview, follow, hidePreview});
</script>
