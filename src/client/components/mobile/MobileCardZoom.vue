<template>
  <div :class="['mb-card-zoom', {'mb-card-zoom--open': open, 'mb-card-zoom--neighbors-hidden': !neighborsShown}]" role="dialog" aria-modal="true">
    <!-- Karte wächst aus ihrer Position in der Liste in die Mitte und schrumpft beim Schließen dorthin zurück;
         Hintergrund unscharf (wie im Mockup), darunter kompakte Knöpfe -->
    <button type="button" class="mb-card-zoom-backdrop" :aria-label="$t('Close')" @click="close"></button>
    <!-- Karussell: alle Karten nebeneinander, per Wischen durchschiebbar, rastet auf je einer Karte ein -->
    <div ref="track" class="mb-card-zoom-track" @scroll.passive="onScroll">
      <!-- Seite der Karte relativ zur gezeigten: Nachbarn fahren von dort herein und dorthin wieder hinaus -->
      <div v-for="slide in count" :key="slide" :class="['mb-card-zoom-slide', slideSideClass(slide - 1)]" @click="onSlideClick(slide - 1)">
        <div class="mb-card-zoom-card mb-fit-off">
          <slot name="slide" :index="slide - 1"></slot>
        </div>
      </div>
    </div>
    <!-- Vor/Zurück an den Rändern, dazwischen Spielen und Schließen; fehlt ein Nachbar, bleibt sein Platz frei -->
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
  // Anzahl der Karten im Karussell; Inhalt je Karte liefert der Slot "slide"
  count: number;
  // Gezeigte Karte
  index: number;
  // Gezeigte Karte ist jetzt spielbar: Knopf "Karte spielen"
  playable?: boolean;
  // Position der angetippten Karte; Start- und Endpunkt der Animation (fehlt: nur Wachsen aus der Mitte)
  origin?: DOMRect;
}>(), {playable: false, origin: undefined});

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'play'): void;
  (event: 'update:index', index: number): void;
}>();

// Dauer muss zur Transition in mobile.less passen (@mb-card-zoom-duration)
const DURATION_MS = 260;
const NEIGHBOR_DURATION_MS = 220;
// Wartelage der Nachbarn außerhalb des Karussells; muss zu .mb-card-zoom--neighbors-hidden in mobile.less passen
const NEIGHBOR_OFFSET = '120%';
// Ruhezeit nach dem letzten Scroll-Ereignis, ab der das Wischen als beendet gilt
const SCROLL_SETTLE_MS = 120;
const open = ref(false);
// Nachbarkarten erst nach dem Wachsen hereinfahren und vor dem Schrumpfen wieder hinaus
const neighborsShown = ref(false);
const track = ref<HTMLElement | undefined>(undefined);

const hasPrevious = computed(() => props.index > 0);
const hasNext = computed(() => props.index < props.count - 1);

// Eine Karte ist schmaler als das Karussell (Nachbarn schauen herein); Abstandhalter vorn und hinten sind
// so breit, dass Karte n genau bei n * Kartenbreite mittig einrastet
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

// Tap auf eine angeschnittene Nachbarkarte blättert zu ihr
function onSlideClick(slideIndex: number) {
  if (slideIndex !== props.index) {
    emit('update:index', slideIndex);
  }
}

// Karte, auf der das Karussell gerade eingerastet ist
function scrolledIndex(): number {
  return Math.round((track.value?.scrollLeft ?? 0) / slideWidth());
}

function step(direction: 1 | -1) {
  const target = props.index + direction;
  if (target >= 0 && target < props.count) {
    emit('update:index', target);
  }
}

// Wischen beendet: gewählte Karte an den Aufrufer melden (u. a. Ziel der Schrumpf-Animation)
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

// Knöpfe und Pfeiltasten ändern index: sanft dorthin schieben
watch(() => props.index, (index) => {
  if (index !== scrolledIndex()) {
    track.value?.scrollTo({left: index * slideWidth(), behavior: 'smooth'});
  }
});

// Transform, der das Karussell so verschiebt und skaliert, dass die gezeigte Karte genau auf der angetippten liegt.
// Die Karte sitzt mittig im Karussell, deshalb genügt es, das ganze Karussell zu bewegen.
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

// Web Animations statt CSS-Transition: die Startlage gilt sofort, ohne vorher einmal gezeichnet zu werden
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

// fill 'forwards' hält die Endlage bis zum Aushängen; 'none' übergibt danach wieder ans CSS
function animate(element: HTMLElement | undefined, from: string, to: string, duration: number, fill: 'forwards' | 'none' = 'forwards'): Promise<void> {
  if (element === undefined || typeof element.animate !== 'function') {
    return Promise.resolve();
  }
  const animation = element.animate([{transform: from}, {transform: to}], {duration, easing: EASING, fill});
  return animation.finished.then(() => undefined, () => undefined);
}

// Vorige Karte fährt nach links, nächste nach rechts (und umgekehrt herein); weiter entfernte sind ohnehin unsichtbar.
// Web Animations wie beim Karussell: eine CSS-Transition lief in Safari nicht zuverlässig, die Nachbarn sprangen nur
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

// Pfeiltasten blättern (Tablet mit Tastatur), Escape schließt
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
  // Ohne Animation auf die gewählte Karte springen, bevor sie aus der Liste herauswächst
  if (track.value !== undefined) {
    track.value.scrollLeft = props.index * slideWidth();
  }
  const start = originTransform();
  open.value = true;
  animate(track.value, start, 'none', DURATION_MS).then(() => {
    // Klasse weg, die Animation hält die Nachbarn bis zu ihrem ersten Bild noch draußen
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
  // Erst die Nachbarn hinausfahren, dann schrumpft die gezeigte Karte an ihren Platz zurück
  if (neighborsShown.value && props.count > 1) {
    await slideNeighbors('out');
  }
  neighborsShown.value = false;
  open.value = false;
  await Promise.race([animate(track.value, 'none', originTransform(), DURATION_MS), new Promise((resolve) => window.setTimeout(resolve, DURATION_MS + 100))]);
  emit('close');
}
</script>
