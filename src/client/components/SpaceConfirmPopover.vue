<template>
  <!-- Confirmation of a tile placement as a speech bubble right at the chosen space (instead of a full-screen dialog).
       Teleported into body so the column overflow and the right column's zoom don't clip it. -->
  <Teleport to="body">
    <div v-if="anchor !== undefined" ref="popover" role="dialog" aria-modal="false"
      :class="['space-confirm', 'space-confirm--' + placement.side]"
      :style="{left: placement.left + 'px', top: placement.top + 'px'}">
      <div class="space-confirm-message" v-i18n>Place your tile here?</div>
      <div class="space-confirm-actions">
        <!-- Yes green, no red (colors from button_tones.less) -->
        <button type="button" class="space-confirm-button space-confirm-button--yes" @click="$emit('accept')" v-i18n>Yes</button>
        <button type="button" class="space-confirm-button space-confirm-button--no" @click="$emit('dismiss')" v-i18n>No</button>
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
  // The chosen space; undefined = bubble closed
  anchor: HTMLElement | undefined;
}>();

const emit = defineEmits<{
  (event: 'accept'): void;
  (event: 'dismiss'): void;
  (event: 'hide', hide: boolean): void;
}>();

const popover = ref<HTMLElement>();
const placement = ref<PopoverPlacement>({side: 'right', left: -9999, top: -9999});

// Recompute the position (the space can move on scroll/resize)
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
    window.addEventListener('scroll', reposition, true); // true: also scrolling in the right column
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
    await nextTick(); // the bubble's size can only be measured once rendered
    reposition();
  }
});

onBeforeUnmount(() => {
  if (props.anchor !== undefined) {
    listen(false);
  }
});
</script>
