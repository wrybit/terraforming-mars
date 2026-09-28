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
// Fensterkoordinaten der oberen rechten Ecke
type PreviewPosition = {top: number, right: number};

// undefined = per Klick angeheftet (Touch), sonst Hover-Vorschau an der Log-Zeile
const previewPosition = ref<PreviewPosition | undefined>(undefined);

const previewStyle = computed(() => {
  const position = previewPosition.value;
  return position === undefined ? undefined : {top: position.top + 'px', right: position.right + 'px'};
});

// Modal über der rechten Spalte für Zeilen mit vielen Karten
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
  // Ein offenes Modal nicht durch Hover über andere Zeilen ersetzen
  if (modal.value) {
    return;
  }
  selectedMessage.value = message;
  previewPosition.value = position;
}

// Nur die Hover-Vorschau schließen, ein per Klick angeheftetes Panel bleibt
function hidePreview() {
  if (previewPosition.value !== undefined) {
    selectedMessage.value = undefined;
    previewPosition.value = undefined;
  }
}

// Als Overlay anmelden: schließt sich, wenn ein anderes Overlay öffnet (overlayCoordinator.ts)
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
