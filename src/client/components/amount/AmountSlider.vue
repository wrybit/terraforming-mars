<template>
  <!-- Slider with −/+ and min/max scale (amount_slider.less). display: contents, so slider row and scale
       become rows of the surrounding grid and line up with the side tiles (AmountConverter.vue) -->
  <div class="amount-slider-group">
    <div class="amount-slider-row">
      <AppButton type="minus" :disabled="modelValue <= min" @click="set(modelValue - 1)" />
      <div ref="slider" :class="['amount-slider', {'amount-slider--dragging': dragging}]" role="slider" tabindex="0"
        :aria-valuemin="min" :aria-valuemax="max" :aria-valuenow="modelValue"
        @pointerdown="startDrag" @keydown="onKey">
        <div class="amount-slider__track">
          <div class="amount-slider__fill" :style="{width: fillWidth}"></div>
          <div class="amount-slider__rail">
            <span v-for="tick in ticks" :key="tick.value" :class="['amount-slider__tick', {'amount-slider__tick--on': tick.value <= modelValue}]" :style="{left: tick.left}"></span>
          </div>
        </div>
        <div ref="thumbs" class="amount-slider__thumbs">
          <div class="amount-slider__thumb" :style="{left: percent + '%'}">{{ modelValue }}</div>
        </div>
      </div>
      <AppButton type="plus" :disabled="modelValue >= max" @click="set(modelValue + 1)" />
    </div>
    <div class="amount-slider-scale">
      <button type="button" @click="set(min)">{{ min }}</button>
      <button type="button" @click="set(max)">{{ max }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, ref} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';

const props = defineProps<{
  modelValue: number;
  min: number;
  max: number;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void;
}>();

const thumbs = ref<HTMLElement>();
const dragging = ref(false);

const span = computed(() => props.max - props.min);
const percent = computed(() => span.value === 0 ? 100 : (props.modelValue - props.min) / span.value * 100);
// The fill reaches the thumb centre plus half the track height, so the end ticks are surrounded by the fill
const fillWidth = computed(() => `calc((100% - var(--amount-track-height)) * ${percent.value / 100} + var(--amount-track-height))`);
const ticks = computed(() => {
  const result = [];
  for (let value = props.min; value <= props.max; value++) {
    result.push({value, left: (span.value === 0 ? 100 : (value - props.min) / span.value * 100) + '%'});
  }
  return result;
});

function set(value: number) {
  const clamped = Math.max(props.min, Math.min(props.max, Math.round(value)));
  if (clamped !== props.modelValue) {
    emit('update:modelValue', clamped);
  }
}

// Value under the pointer, measured on the inset rail the thumb runs on
function valueAt(clientX: number): number {
  const rect = thumbs.value?.getBoundingClientRect();
  if (rect === undefined || rect.width === 0) {
    return props.modelValue;
  }
  return props.min + (clientX - rect.left) / rect.width * span.value;
}

function onMove(event: PointerEvent) {
  event.preventDefault();
  set(valueAt(event.clientX));
}

function stopDrag() {
  dragging.value = false;
  document.body.classList.remove('amount-slider-dragging');
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', stopDrag);
  window.removeEventListener('pointercancel', stopDrag);
}

// No text selection while dragging (preventDefault + body class)
function startDrag(event: PointerEvent) {
  event.preventDefault();
  dragging.value = true;
  document.body.classList.add('amount-slider-dragging');
  set(valueAt(event.clientX));
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    event.preventDefault();
    set(props.modelValue - 1);
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    event.preventDefault();
    set(props.modelValue + 1);
  }
}

onBeforeUnmount(stopDrag);
</script>
