<template>
  <div :class="['mb-card-zoom', {'mb-card-zoom--open': open, 'mb-card-zoom--neighbors-hidden': !neighborsShown}]" role="dialog" aria-modal="true">
    <!-- Card grows from its position in the list to the center and shrinks back there on close;
         background blurred (like in the mockup), compact buttons below -->
    <button type="button" class="mb-card-zoom-backdrop" :aria-label="$t('Close')" @click="close"></button>
    <!-- Carousel: all cards side by side, swipeable, snaps to one card at a time -->
    <div ref="track" class="mb-card-zoom-track" @scroll.passive="onScroll">
      <!-- Side of the card relative to the shown one: neighbors slide in from there and back out there -->
      <div v-for="slide in count" :key="slide" :class="['mb-card-zoom-slide', slideSideClass(slide - 1)]" @click="onSlideClick(slide - 1)">
        <div class="mb-card-zoom-card mb-fit-off">
          <slot name="slide" :index="slide - 1"></slot>
        </div>
      </div>
    </div>
    <!-- Previous/next at the edges, Play and Close in between; if a neighbor is missing, its slot stays empty -->
    <div class="mb-card-zoom-actions">
      <button type="button" class="mb-card-zoom-step" :class="{'mb-card-zoom-step--hidden': !hasPrevious}" :disabled="!hasPrevious"
        :aria-label="$t('Previous card')" @click="step(-1)">‹</button>
      <div class="mb-card-zoom-main">
        <AppButton v-if="playable" :title="$t('Play card')" type="submit" @click="$emit('play')"/>
        <button type="button" class="mb-card-zoom-close" @click="close">{{ $t('Close') }}</button>
      </div>
      <button type="button" class="mb-card-zoom-step" :class="{'mb-card-zoom-step--hidden': !hasNext}" :disabled="!hasNext"
        :aria-label="$t('Next card')" @click="step(1)">›</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';

const props = withDefaults(defineProps<{
  // Number of cards in the carousel; the "slide" slot provides each card's content
  count: number;
  // Shown card
  index: number;
  // Shown card is playable now: "Play card" button
  playable?: boolean;
  // Position of the tapped card; start and end point of the animation (missing: only grow from the center)
  origin?: DOMRect;
}>(), {playable: false, origin: undefined});

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'play'): void;
  (event: 'update:index', index: number): void;
}>();

// Duration must match the transition in mobile.less (@mb-card-zoom-duration)
const DURATION_MS = 260;
const NEIGHBOR_DURATION_MS = 220;
// Waiting position of the neighbors outside the carousel; must match .mb-card-zoom--neighbors-hidden in mobile.less
const NEIGHBOR_OFFSET = '120%';
// Idle time after the last scroll event after which swiping counts as finished
const SCROLL_SETTLE_MS = 120;
const open = ref(false);
// Slide neighbor cards in only after growing and back out before shrinking
const neighborsShown = ref(false);
const track = ref<HTMLElement | undefined>(undefined);

const hasPrevious = computed(() => props.index > 0);
const hasNext = computed(() => props.index < props.count - 1);

// A card is narrower than the carousel (neighbors peek in); spacers at the front and back are
// so wide that card n snaps centered exactly at n * card width
function slideWidth(): number {
  const slide = track.value?.querySelector<HTMLElement>('.mb-card-zoom-slide');
  return slide?.offsetWidth || 1;
}

function slideSideClass(slideIndex: number): string {
  if (slideIndex < props.index) {
    return 'mb-card-zoom-slide--before';
  }
  return slideIndex > props.index ? 'mb-card-zoom-slide--after' : '';
}

// Tap on a partially visible neighbor card pages to it
function onSlideClick(slideIndex: number) {
  if (slideIndex !== props.index) {
    emit('update:index', slideIndex);
  }
}

// Card the carousel is currently snapped to
function scrolledIndex(): number {
  return Math.round((track.value?.scrollLeft ?? 0) / slideWidth());
}

function step(direction: 1 | -1) {
  const target = props.index + direction;
  if (target >= 0 && target < props.count) {
    emit('update:index', target);
  }
}

// Swiping finished: report the chosen card to the caller (among other things the target of the shrink animation)
let settleTimer = 0;
function onScroll() {
  window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(() => {
    const index = scrolledIndex();
    if (index !== props.index && index >= 0 && index < props.count) {
      emit('update:index', index);
    }
  }, SCROLL_SETTLE_MS);
}

// Buttons and arrow keys change index: scroll there smoothly
watch(() => props.index, (index) => {
  if (index !== scrolledIndex()) {
    track.value?.scrollTo({left: index * slideWidth(), behavior: 'smooth'});
  }
});

// Transform that moves and scales the carousel so that the shown card lies exactly on the tapped one.
// The card sits centered in the carousel, so moving the whole carousel is enough.
function originTransform(): string {
  const slide = track.value?.children[props.index] as HTMLElement | undefined;
  const element = slide?.querySelector<HTMLElement>('.mb-card-zoom-card > *');
  if (props.origin === undefined || element === null || element === undefined) {
    return 'scale(0.6)';
  }
  const target = element.getBoundingClientRect();
  const scale = props.origin.width / target.width;
  const x = props.origin.left + props.origin.width / 2 - (target.left + target.width / 2);
  const y = props.origin.top + props.origin.height / 2 - (target.top + target.height / 2);
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

// Web Animations instead of a CSS transition: the start position applies immediately, without being painted once first
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

// fill 'forwards' holds the end position until unmount; 'none' hands back to the CSS afterwards
function animate(element: HTMLElement | undefined, from: string, to: string, duration: number, fill: 'forwards' | 'none' = 'forwards'): Promise<void> {
  if (element === undefined || typeof element.animate !== 'function') {
    return Promise.resolve();
  }
  const animation = element.animate([{transform: from}, {transform: to}], {duration, easing: EASING, fill});
  return animation.finished.then(() => undefined, () => undefined);
}

// Previous card slides to the left, next to the right (and in reverse when entering); cards further away are invisible anyway.
// Web Animations like the carousel: a CSS transition didn't run reliably in Safari, the neighbors only jumped
async function slideNeighbors(direction: 'in' | 'out'): Promise<void> {
  const neighbors = [{index: props.index - 1, sign: '-'}, {index: props.index + 1, sign: ''}];
  const animations = neighbors.map(({index, sign}) => {
    const card = track.value?.children[index]?.querySelector<HTMLElement>('.mb-card-zoom-card') ?? undefined;
    const outside = `translateX(${sign}${NEIGHBOR_OFFSET})`;
    return direction === 'in' ?
      animate(card, outside, 'none', NEIGHBOR_DURATION_MS, 'none') :
      animate(card, 'none', outside, NEIGHBOR_DURATION_MS);
  });
  await Promise.all(animations);
}

// Arrow keys page (tablet with keyboard), Escape closes
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    step(-1);
  } else if (event.key === 'ArrowRight') {
    step(1);
  } else if (event.key === 'Escape') {
    close();
  }
}

onMounted(() => {
  // Jump to the chosen card without animation before it grows out of the list
  if (track.value !== undefined) {
    track.value.scrollLeft = props.index * slideWidth();
  }
  const start = originTransform();
  open.value = true;
  animate(track.value, start, 'none', DURATION_MS).then(() => {
    // Class removed, the animation keeps the neighbors outside until their first frame
    neighborsShown.value = true;
    return slideNeighbors('in');
  });
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.clearTimeout(settleTimer);
  window.removeEventListener('keydown', onKeydown);
});

let closing = false;
async function close() {
  if (closing) {
    return;
  }
  closing = true;
  // First slide the neighbors out, then the shown card shrinks back to its place
  if (neighborsShown.value && props.count > 1) {
    await slideNeighbors('out');
  }
  neighborsShown.value = false;
  open.value = false;
  await Promise.race([animate(track.value, 'none', originTransform(), DURATION_MS), new Promise((resolve) => window.setTimeout(resolve, DURATION_MS + 100))]);
  emit('close');
}
</script>
