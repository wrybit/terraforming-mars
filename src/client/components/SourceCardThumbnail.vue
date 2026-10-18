<template>
  <!-- Triggering card, scaled down at the top of a tab box (or_options_tabs.less, .card-intro-card);
       shared by CardIntroBlock.vue and TabIntroBlock.vue -->
  <div class="card-intro-card" :style="boxStyle">
    <div ref="scaled" class="card-intro-card__scaled">
      <Card :card="{name: card}"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {CardName} from '@/common/cards/CardName';
import Card from '@/client/components/card/Card.vue';

defineProps<{
  card: CardName;
}>();

// Scaled with transform instead of CSS zoom: WebKit (iOS) keeps zoomed text at 9 px or more, so on the tiny card
// the texts grew and ran over each other. A transform does not change the layout box, so the outer box takes the
// scaled size of the card here; the factor itself stays in the stylesheet.
const scaled = ref<HTMLElement>();
const size = ref<{width: number, height: number}>();
let observer: ResizeObserver | undefined;

function measure(): void {
  const element = scaled.value;
  if (element === undefined) {
    return;
  }
  const transform = getComputedStyle(element).transform;
  const factor = transform === 'none' || transform === '' ? 1 : new DOMMatrix(transform).a;
  size.value = {width: element.offsetWidth * factor, height: element.offsetHeight * factor};
}

const boxStyle = computed(() => size.value === undefined ? {} : {width: size.value.width + 'px', height: size.value.height + 'px'});

onMounted(() => {
  measure();
  // jsdom (client tests) has no ResizeObserver
  if (typeof ResizeObserver !== 'undefined' && scaled.value !== undefined) {
    observer = new ResizeObserver(measure);
    observer.observe(scaled.value);
  }
});

onBeforeUnmount(() => observer?.disconnect());
</script>
