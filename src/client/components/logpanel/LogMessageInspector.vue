<template>
  <CardPanel
    v-if="selectedMessage !== undefined"
    :message="selectedMessage"
    :players="viewModel.players"
    :floating="previewPosition !== undefined"
    :modal="modal"
    :style="previewStyle"
    @hide="selectedMessage = undefined; modal = false"/>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {closeOtherOverlays, registerOverlay} from '@/client/utils/overlayCoordinator';
import {LogMessage} from '@/common/logs/LogMessage';
import {ViewModel} from '@/common/models/PlayerModel';
import CardPanel from '@/client/components/logpanel/CardPanel.vue';

defineProps<{
  viewModel: ViewModel;
}>();

const selectedMessage = ref<LogMessage | undefined>(undefined);
// Window coordinates: vertical center (top) and right edge of the preview
type PreviewPosition = {top: number, right: number};

// undefined = pinned by click (touch), otherwise hover preview at the log row
const previewPosition = ref<PreviewPosition | undefined>(undefined);

const previewStyle = computed(() => {
  const position = previewPosition.value;
  return position === undefined ? undefined : {top: position.top + 'px', right: position.right + 'px'};
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

function preview(message: LogMessage, position: PreviewPosition) {
  // Don't replace an open modal by hovering over other rows
  if (modal.value) {
    return;
  }
  selectedMessage.value = message;
  previewPosition.value = position;
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

defineExpose({show, showModal, preview, hidePreview});
</script>
