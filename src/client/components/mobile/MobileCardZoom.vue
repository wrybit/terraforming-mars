<template>
  <div :class="['mb-card-zoom', {'mb-card-zoom--open': open}]" role="dialog" aria-modal="true">
    <!-- Karte wächst aus ihrer Position in der Liste in die Mitte und schrumpft beim Schließen dorthin zurück;
         Hintergrund unscharf (wie im Mockup), darunter kompakte Knöpfe -->
    <button type="button" class="mb-card-zoom-backdrop" :aria-label="$t('Close')" @click="close"></button>
    <div ref="cardHolder" class="mb-card-zoom-card mb-fit-off">
      <Card :card="card"/>
    </div>
    <div class="mb-card-zoom-actions">
      <AppButton v-if="playable" :title="$t('Play card')" type="submit" @click="$emit('play')"/>
      <button type="button" class="mb-card-zoom-close" @click="close">{{ $t('Close') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {nextTick, onMounted, ref} from 'vue';
import {CardModel} from '@/common/models/CardModel';
import Card from '@/client/components/card/Card.vue';
import AppButton from '@/client/components/common/AppButton.vue';

const props = defineProps<{
  card: CardModel;
  // Karte ist jetzt spielbar: Knopf "Karte spielen" (öffnet das Karussell mit dieser Karte)
  playable: boolean;
  // Position der angetippten Karte; Start- und Endpunkt der Animation (fehlt: nur Ein-/Ausblenden)
  origin?: DOMRect;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'play'): void;
}>();

// Dauer muss zur Transition in mobile.less passen (@mb-card-zoom-duration)
const DURATION_MS = 260;
const open = ref(false);
const cardHolder = ref<HTMLElement | undefined>(undefined);

// Transform, der die große Karte genau auf die angetippte legt
function originTransform(): string {
  const element = cardHolder.value?.firstElementChild as HTMLElement | null | undefined;
  if (props.origin === undefined || element === null || element === undefined) {
    return 'scale(0.6)';
  }
  const target = element.getBoundingClientRect();
  const scale = props.origin.width / target.width;
  const x = props.origin.left + props.origin.width / 2 - (target.left + target.width / 2);
  const y = props.origin.top + props.origin.height / 2 - (target.top + target.height / 2);
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

function setTransform(value: string) {
  if (cardHolder.value !== undefined) {
    cardHolder.value.style.transform = value;
  }
}

onMounted(async () => {
  setTransform(originTransform());
  await nextTick();
  // Erst nach dem Zeichnen der Startlage umschalten, sonst springt die Karte ohne Animation
  requestAnimationFrame(() => requestAnimationFrame(() => {
    open.value = true;
    setTransform('');
  }));
});

function close() {
  open.value = false;
  setTransform(originTransform());
  window.setTimeout(() => emit('close'), DURATION_MS);
}
</script>
