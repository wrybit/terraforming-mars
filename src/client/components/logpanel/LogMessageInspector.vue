<template>
  <CardPanel
    v-if="selectedMessage !== undefined"
    :message="selectedMessage"
    :action="selectedAction"
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
import {LogAction} from '@/client/components/logpanel/logActions';
import {CursorPosition, floatingPlacement, PanelSize} from '@/client/components/logpanel/floatingPlacement';

defineProps<{
  viewModel: ViewModel;
}>();

const emit = defineEmits<{
  // The preview opened by itself (pinPreview) was closed by a click anywhere
  (event: 'pinnedClosed'): void;
}>();

const selectedMessage = ref<LogMessage | undefined>(undefined);
// Grouped action row of the message, if any: its effects show under the card
const selectedAction = ref<LogAction | undefined>(undefined);
// undefined = pinned by click (touch), otherwise hover preview following the mouse
const previewPosition = ref<CursorPosition | undefined>(undefined);
// Measured size of the preview: needed to keep it inside the window (several cards stack upwards)
const panelSize = ref<PanelSize | undefined>(undefined);
const cardPanel = ref<InstanceType<typeof CardPanel> | undefined>(undefined);

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
  const {left, top} = floatingPlacement(cursor, size);
  return {left: left + 'px', top: top + 'px'};
});

// The cards differ per row (one to three, colonies, global events): measure after each change
watch([selectedMessage, () => previewPosition.value !== undefined], async () => {
  panelSize.value = undefined;
  if (previewPosition.value === undefined) {
    return;
  }
  await nextTick();
  // Vue setzt den Ref auf null, wenn CardPanel nichts rendert (Zeile ohne Karten) – nicht auf undefined
  const element = cardPanel.value?.$refs.panel as HTMLElement | null | undefined;
  if (element instanceof HTMLElement) {
    const rect = element.getBoundingClientRect();
    panelSize.value = {width: rect.width, height: rect.height};
  }
});

// Modal over the right column for rows with many cards
const modal = ref(false);

function show(message: LogMessage, action?: LogAction) {
  selectedMessage.value = message;
  selectedAction.value = action;
  previewPosition.value = undefined;
  modal.value = false;
}

const LOG_CARDS_OVERLAY = 'log-cards';

function showModal(message: LogMessage) {
  closeOtherOverlays(LOG_CARDS_OVERLAY);
  selectedMessage.value = message;
  selectedAction.value = undefined;
  previewPosition.value = undefined;
  modal.value = true;
}

// Preview opened by itself (newly drawn cards, drawnCards.ts): looks like the hover preview, but stays
// where it is until the next click anywhere – hovering other rows or leaving the log doesn't close it
const pinned = ref(false);

function closePinned() {
  window.removeEventListener('pointerdown', closePinned, true);
  if (!pinned.value) {
    return;
  }
  pinned.value = false;
  selectedMessage.value = undefined;
  previewPosition.value = undefined;
  modal.value = false;
  emit('pinnedClosed');
}

function pinPreview(message: LogMessage, position: CursorPosition | undefined) {
  if (position === undefined) {
    showModal(message);
  } else {
    selectedMessage.value = message;
    selectedAction.value = undefined;
    previewPosition.value = position;
    modal.value = false;
  }
  pinned.value = true;
  window.removeEventListener('pointerdown', closePinned, true);
  window.addEventListener('pointerdown', closePinned, true);
}

function preview(message: LogMessage, position: CursorPosition, action?: LogAction) {
  // Don't replace an open modal or a pinned preview by hovering over other rows
  if (modal.value || pinned.value) {
    return;
  }
  selectedMessage.value = message;
  selectedAction.value = action;
  previewPosition.value = position;
}

// Mouse moved within the log: the open hover preview follows it
function follow(position: CursorPosition) {
  if (previewPosition.value !== undefined && !pinned.value) {
    previewPosition.value = position;
  }
}

// Only close the hover preview; a panel pinned by click stays
function hidePreview() {
  if (previewPosition.value !== undefined && !pinned.value) {
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
onBeforeUnmount(() => {
  unregisterOverlay?.();
  window.removeEventListener('pointerdown', closePinned, true);
});

defineExpose({show, showModal, preview, pinPreview, follow, hidePreview});
</script>
