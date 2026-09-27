<template>
  <CardPanel
    v-if="selectedMessage !== undefined"
    :message="selectedMessage"
    :players="viewModel.players"
    :floating="previewPosition !== undefined"
    :style="previewStyle"
    @hide="selectedMessage = undefined"/>
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

function show(message: LogMessage) {
  selectedMessage.value = message;
  previewPosition.value = undefined;
}

function preview(message: LogMessage, position: PreviewPosition) {
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

defineExpose({show, preview, hidePreview});
</script>
