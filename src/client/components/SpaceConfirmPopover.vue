<template>
  <!-- Bestätigung einer Plättchen-Platzierung als Sprechblase direkt am gewählten Feld (statt Vollbild-Dialog).
       Teleport in body, damit Spalten-Overflow und Zoom der rechten Spalte sie nicht beschneiden. -->
  <Teleport to="body">
    <div v-if="anchor !== undefined" ref="popover" role="dialog" aria-modal="false"
      :class="['space-confirm', 'space-confirm--' + placement.side]"
      :style="{left: placement.left + 'px', top: placement.top + 'px'}">
      <div class="space-confirm-message" v-i18n>Place your tile here?</div>
      <div class="space-confirm-actions">
        <button type="button" class="space-confirm-button space-confirm-button--primary" @click="$emit('accept')" v-i18n>Yes</button>
        <button type="button" class="space-confirm-button" @click="$emit('dismiss')" v-i18n>No</button>
      </div>
      <label class="space-confirm-skip">
        <input type="checkbox" :checked="false" @change="$emit('hide', ($event.target as HTMLInputElement).checked)">
        <span v-i18n>Don't ask again</span>
      </label>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {nextTick, onBeforeUnmount, ref, watch} from 'vue';
import {PopoverPlacement, spaceConfirmPosition} from '@/client/components/spaceConfirmPosition';

const props = defineProps<{
  // Das gewählte Feld; undefined = Blase geschlossen
  anchor: HTMLElement | undefined;
}>();

const emit = defineEmits<{
  (event: 'accept'): void;
  (event: 'dismiss'): void;
  (event: 'hide', hide: boolean): void;
}>();

const popover = ref<HTMLElement>();
const placement = ref<PopoverPlacement>({side: 'right', left: -9999, top: -9999});

// Lage neu berechnen (Feld kann sich beim Scrollen/Größenändern verschieben)
function reposition() {
  if (props.anchor === undefined || popover.value === undefined) {
    return;
  }
  const size = popover.value.getBoundingClientRect();
  placement.value = spaceConfirmPosition(props.anchor.getBoundingClientRect(), size.width, size.height, window.innerWidth, window.innerHeight);
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('dismiss');
  }
}

function listen(active: boolean) {
  if (active) {
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true); // true: auch Scrollen in der rechten Spalte
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('resize', reposition);
    window.removeEventListener('scroll', reposition, true);
    window.removeEventListener('keydown', closeOnEscape);
  }
}

watch(() => props.anchor, async (anchor, previous) => {
  if (previous === undefined && anchor !== undefined) {
    listen(true);
  } else if (anchor === undefined && previous !== undefined) {
    listen(false);
  }
  if (anchor !== undefined) {
    await nextTick(); // erst gerendert lässt sich die Größe der Blase messen
    reposition();
  }
});

onBeforeUnmount(() => {
  if (props.anchor !== undefined) {
    listen(false);
  }
});
</script>
