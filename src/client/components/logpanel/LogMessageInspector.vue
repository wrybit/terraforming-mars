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
import {computed, ref} from 'vue';
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

function showModal(message: LogMessage) {
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

defineExpose({show, showModal, preview, hidePreview});
</script>
