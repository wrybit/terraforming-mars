<template>
  <!-- Takes the free room of a Dune tab and scales its content to it as a whole (CSS zoom), so cards keep their
       proportions and grow with the box (Jens, 19 Oct 2026). In the mobile view the content keeps its own layout. -->
  <div ref="box" class="dune-fit">
    <div ref="content" class="dune-fit__content" :style="{zoom: scale}">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';
import {MOBILE_ROOT_CLASS} from '@/client/utils/mobileLayout';

const props = withDefaults(defineProps<{
  // Largest enlargement; beyond it the content stays centred in the box
  maxScale?: number;
}>(), {maxScale: 2});

// Smaller than this the content would be unreadable: the box scrolls instead
const MIN_SCALE = 0.6;

const box = ref<HTMLElement>();
const content = ref<HTMLElement>();
const scale = ref(1);
let observer: ResizeObserver | undefined;

function fit(): void {
  const boxElement = box.value;
  const contentElement = content.value;
  if (boxElement === undefined || contentElement === undefined || document.documentElement.classList.contains(MOBILE_ROOT_CLASS)) {
    scale.value = 1;
    return;
  }
  // Natural size measured at zoom 1, then put back right away (no paint in between)
  const previous = contentElement.style.zoom;
  contentElement.style.zoom = '1';
  const width = contentElement.offsetWidth;
  const height = contentElement.offsetHeight;
  contentElement.style.zoom = previous;
  if (width === 0 || height === 0 || boxElement.clientWidth === 0 || boxElement.clientHeight === 0) {
    return;
  }
  const fitted = Math.min(props.maxScale, boxElement.clientWidth / width, boxElement.clientHeight / height);
  // Rounded, so tiny measuring differences don't make the observer loop
  scale.value = Math.max(MIN_SCALE, Math.floor(fitted * 100) / 100);
}

onMounted(() => {
  fit();
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => fit());
    if (box.value !== undefined) {
      observer.observe(box.value);
    }
    if (content.value !== undefined) {
      observer.observe(content.value);
    }
  }
});

onBeforeUnmount(() => observer?.disconnect());
</script>
