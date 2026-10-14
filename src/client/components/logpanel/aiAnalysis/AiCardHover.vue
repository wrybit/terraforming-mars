<template>
  <!-- Anything naming a card (hand chip, weighed option): hovering – or a tap on touch – shows the card itself
       next to the pointer. Without a known card it is just its content. -->
  <span v-bind="$attrs" class="ai-card-hover" :class="{'ai-card-hover--card': model !== undefined}"
    @pointerenter="show" @pointermove="move" @pointerleave="hide" @click="toggle"><slot></slot></span>
  <Teleport to="body">
    <div v-if="open && model !== undefined" class="ai-card-hover__preview" :style="position" aria-hidden="true">
      <div class="ai-card-hover__card"><Card :card="model"/></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {getCard} from '@/client/cards/ClientCardManifest';

// Two roots (chip and preview): classes of the parent go onto the chip
defineOptions({inheritAttrs: false});

const props = defineProps<{
  // Card name, possibly with a suffix ("…:SP"); undefined = no card behind it
  card?: string;
}>();

// Size of the preview (card 275 × 400 at zoom 0.6, ai_decision_dialog.less) and its distance to the pointer
const PREVIEW_WIDTH = 165;
const PREVIEW_HEIGHT = 240;
const POINTER_GAP = 16;
const EDGE = 8;

const model = computed<CardModel | undefined>(() => {
  const name = props.card?.split(':')[0] as CardName | undefined;
  return name === undefined || getCard(name) === undefined ? undefined : {name};
});

const open = ref(false);
const pointer = ref({x: 0, y: 0});

// Right of the pointer, to the left when there is no room; always fully in the window
const position = computed(() => {
  const right = pointer.value.x + POINTER_GAP;
  const x = right + PREVIEW_WIDTH > window.innerWidth - EDGE ? pointer.value.x - POINTER_GAP - PREVIEW_WIDTH : right;
  const y = Math.min(Math.max(EDGE, pointer.value.y - PREVIEW_HEIGHT / 2), window.innerHeight - PREVIEW_HEIGHT - EDGE);
  return {left: Math.max(EDGE, x) + 'px', top: y + 'px'};
});

// Type of the last pointer: a mouse shows the preview on hover, touch and pen on a tap
let pointerType = 'mouse';

function move(event: PointerEvent | MouseEvent): void {
  pointer.value = {x: event.clientX, y: event.clientY};
}

function show(event: PointerEvent): void {
  pointerType = event.pointerType;
  move(event);
  if (pointerType === 'mouse') {
    open.value = true;
  }
}

function hide(event: PointerEvent): void {
  if (event.pointerType === 'mouse') {
    open.value = false;
  }
}

// Touch has no hover: a tap opens and closes the preview
function toggle(event: MouseEvent): void {
  if (pointerType !== 'mouse') {
    move(event);
    open.value = !open.value;
  }
}
</script>
