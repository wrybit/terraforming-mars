<template>
  <!-- Floating preview of a milestone, award or agenda row of the VP details, like the card preview of the log:
       follows the mouse; on touch a tap pins it until the next tap anywhere -->
  <div v-if="goal !== undefined && position !== undefined" ref="panel" class="goal-preview" :style="style">
    <SchemeAgendaCard v-if="goal.kind === 'agenda'" :agenda="goal.agenda"/>
    <StatsEntityAsset v-else :kind="goal.kind" :name="goal.name"/>
  </div>
</template>

<script setup lang="ts">
import {computed, CSSProperties, nextTick, onBeforeUnmount, ref, watch} from 'vue';
import StatsEntityAsset from '@/client/components/stats/StatsEntityAsset.vue';
import SchemeAgendaCard, {AgendaProgress} from '@/client/components/dune/SchemeAgendaCard.vue';
import {CursorPosition, floatingPlacement, PanelSize} from '@/client/components/logpanel/floatingPlacement';

export type DetailGoal =
  {kind: 'milestone' | 'award', name: string} |
  {kind: 'agenda', agenda: AgendaProgress};

const goal = ref<DetailGoal | undefined>(undefined);
const position = ref<CursorPosition | undefined>(undefined);
const pinned = ref(false);
const panel = ref<HTMLElement | null>(null);
const size = ref<PanelSize | undefined>(undefined);

// First frame after a new row: not measured yet, so invisible instead of jumping
const style = computed((): CSSProperties => {
  if (position.value === undefined || size.value === undefined) {
    return {left: '0px', top: '0px', visibility: 'hidden'};
  }
  const {left, top} = floatingPlacement(position.value, size.value);
  return {left: left + 'px', top: top + 'px'};
});

watch(goal, async () => {
  size.value = undefined;
  await nextTick();
  if (panel.value instanceof HTMLElement) {
    const rect = panel.value.getBoundingClientRect();
    size.value = {width: rect.width, height: rect.height};
  }
});

function preview(next: DetailGoal, at: CursorPosition) {
  if (pinned.value) {
    return;
  }
  goal.value = next;
  position.value = at;
}

function follow(at: CursorPosition) {
  if (goal.value !== undefined && !pinned.value) {
    position.value = at;
  }
}

function hide() {
  if (!pinned.value) {
    goal.value = undefined;
    position.value = undefined;
  }
}

function closePinned() {
  window.removeEventListener('pointerdown', closePinned, true);
  pinned.value = false;
  hide();
}

// Touch: stays at the finger until the next tap anywhere (that tap may pin the next row)
function pin(next: DetailGoal, at: CursorPosition) {
  window.removeEventListener('pointerdown', closePinned, true);
  goal.value = next;
  position.value = at;
  pinned.value = true;
  setTimeout(() => window.addEventListener('pointerdown', closePinned, true));
}

onBeforeUnmount(() => window.removeEventListener('pointerdown', closePinned, true));

defineExpose({preview, follow, hide, pin});
</script>
