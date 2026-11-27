<template>
  <!-- Work area of the feedback overlay: zoom and crop above, the screenshot with its markers below.
       One gesture for everything: click = point, drag = area (or, while cropping, the part to keep). -->
  <div class="feedback-stage">
    <div v-if="mode === 'mark'" class="feedback-tools">
      <div class="feedback-tools__group" role="group">
        <button type="button" class="feedback-tool" :disabled="zoomIndex === 0" :aria-label="translateText('Zoom out')" @click="setZoom(zoomIndex - 1)">−</button>
        <span class="feedback-tools__zoom">{{ zoomPercent }} %</span>
        <button type="button" class="feedback-tool" :disabled="zoomIndex === ZOOM_STEPS.length - 1" :aria-label="translateText('Zoom in')" @click="setZoom(zoomIndex + 1)">+</button>
        <button type="button" class="feedback-tool" v-i18n @click="setZoom(0)">Fit</button>
      </div>
      <div class="feedback-tools__group">
        <button type="button" class="feedback-tool" :disabled="!ready" @click="startCrop">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3.5 0.5v10h10M0.5 3.5h10v10" /></svg>
          <span v-i18n>Crop</span>
        </button>
        <button v-if="!isFullCrop(crop)" type="button" class="feedback-tool" v-i18n @click="emit('update:crop', FULL_CROP)">Whole screenshot</button>
      </div>
    </div>
    <div v-else class="feedback-tools">
      <span class="feedback-tools__note" v-i18n>Drag the area to keep.</span>
      <div class="feedback-tools__group feedback-tools__end">
        <button type="button" class="feedback-tool" v-i18n @click="cancelCrop">Cancel</button>
        <button type="button" class="feedback-tool feedback-tool--primary" :disabled="pendingCrop === undefined" v-i18n @click="applyCrop">Apply</button>
      </div>
    </div>

    <div ref="viewport" class="feedback-viewport" @wheel="onWheel">
      <div class="feedback-viewport__inner">
        <div v-if="!ready" class="feedback-shot feedback-shot--placeholder">
          <span v-if="captureFailed" v-i18n>The screenshot could not be taken. Your feedback can still be sent without it.</span>
          <span v-else v-i18n>Taking screenshot …</span>
        </div>
        <div v-else ref="shot" :class="['feedback-shot', {'feedback-shot--cropping': mode === 'crop'}]" :style="shotStyle"
          @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerCancel">
          <img :src="imageUrl" :style="imageStyle" alt="" draggable="false">
          <template v-for="marker in visibleMarkers" :key="marker.number">
            <div v-if="marker.kind === 'pin'" :class="['feedback-pin', {'is-hot': hot === marker.number}]" :style="pinStyle(marker)"
              @pointerdown="startMove($event, marker)"
              @mouseenter="emit('hover', marker.number)" @mouseleave="emit('hover', undefined)">
              <FeedbackMarkerIcon kind="pin" :number="marker.number" :scale="PIN_SCALE" />
            </div>
            <div v-else :class="['feedback-area', {'is-hot': hot === marker.number}]" :style="areaStyle(marker)"
              @pointerdown="startMove($event, marker)"
              @mouseenter="emit('hover', marker.number)" @mouseleave="emit('hover', undefined)">
              <span class="feedback-area__badge">{{ marker.number }}</span>
            </div>
          </template>
          <div v-if="draft !== undefined" :class="mode === 'crop' ? 'feedback-crop-frame' : 'feedback-area feedback-area--draft'" :style="boxStyle(draft)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {translateText} from '@/client/directives/i18n';
import FeedbackMarkerIcon from './FeedbackMarkerIcon.vue';
import {Box, FULL_CROP, MarkerDraft, Point, boxBetween, clampPercent, isBigEnough, isFullCrop, isInsideCrop, toOriginal, toView} from './feedbackGeometry';

const props = defineProps<{
  /** Object URL of the screenshot; empty while it is taken */
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  captureFailed: boolean;
  markers: ReadonlyArray<MarkerDraft>;
  crop: Box;
  /** Marker highlighted from the list */
  hot: number | undefined;
}>();

const emit = defineEmits<{
  (e: 'add', marker: Box & {kind: 'pin' | 'area'}): void;
  (e: 'update:crop', crop: Box): void;
  (e: 'focus', number: number): void;
  (e: 'move', number: number, position: Point): void;
  (e: 'hover', number: number | undefined): void;
}>();

const ZOOM_STEPS = [1, 1.5, 2, 3, 4];
// Pins on the screenshot are smaller than in the list, so they cover less of what they point at
const PIN_SCALE = 0.72;
// Movement in px from which a click becomes a drag
const DRAG_THRESHOLD = 6;

const shot = ref<HTMLElement>();
const zoomIndex = ref(0);
const mode = ref<'mark' | 'crop'>('mark');
const pendingCrop = ref<Box>();
// Box being dragged, in percent of the view
const draft = ref<Box>();
let dragStart: (Point & {clientX: number, clientY: number}) | undefined;
// Marker being moved: where it and the pointer started
let moving: {number: number, origin: Point, clientX: number, clientY: number, moved: boolean} | undefined;

const ready = computed(() => props.imageUrl !== '');
const zoomPercent = computed(() => Math.round(ZOOM_STEPS[zoomIndex.value] * 100));
const visibleMarkers = computed(() => props.markers.filter((marker) => isInsideCrop(marker, props.crop)));

// The cropped part keeps its proportions; the image inside is moved and enlarged
const shotStyle = computed(() => ({
  aspectRatio: `${props.imageWidth * props.crop.width} / ${props.imageHeight * props.crop.height}`,
  width: `${ZOOM_STEPS[zoomIndex.value] * 100}%`,
}));
const imageStyle = computed(() => ({
  width: `${100 / props.crop.width * 100}%`,
  left: `${-props.crop.x / props.crop.width * 100}%`,
  top: `${-props.crop.y / props.crop.height * 100}%`,
}));

function pinStyle(marker: MarkerDraft) {
  const view = toView(marker, props.crop);
  return {left: `${view.x}%`, top: `${view.y}%`};
}

function areaStyle(marker: MarkerDraft) {
  const view = toView(marker, props.crop);
  return boxStyle({...view, width: marker.width / props.crop.width * 100, height: marker.height / props.crop.height * 100});
}

function boxStyle(box: Box) {
  return {left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%`};
}

function setZoom(index: number): void {
  zoomIndex.value = Math.max(0, Math.min(ZOOM_STEPS.length - 1, index));
}

// Ctrl/Cmd + wheel zooms like in image viewers; the plain wheel keeps scrolling
function onWheel(event: WheelEvent): void {
  if (!event.ctrlKey && !event.metaKey) {
    return;
  }
  event.preventDefault();
  setZoom(zoomIndex.value + (event.deltaY < 0 ? 1 : -1));
}

function startCrop(): void {
  pendingCrop.value = undefined;
  draft.value = undefined;
  mode.value = 'crop';
}

function cancelCrop(): void {
  draft.value = undefined;
  mode.value = 'mark';
}

function applyCrop(): void {
  if (pendingCrop.value !== undefined) {
    emit('update:crop', pendingCrop.value);
    zoomIndex.value = 0;
  }
  draft.value = undefined;
  mode.value = 'mark';
}

function viewPoint(event: PointerEvent): Point {
  const box = shot.value?.getBoundingClientRect();
  if (box === undefined || box.width === 0 || box.height === 0) {
    return {x: 0, y: 0};
  }
  return {
    x: clampPercent((event.clientX - box.left) / box.width * 100),
    y: clampPercent((event.clientY - box.top) / box.height * 100),
  };
}

// Markers can be moved afterwards; a click without moving selects its text instead
function startMove(event: PointerEvent, marker: MarkerDraft): void {
  if (mode.value !== 'mark' || event.button !== 0) {
    return;
  }
  event.stopPropagation();
  moving = {number: marker.number, origin: {x: marker.x, y: marker.y}, clientX: event.clientX, clientY: event.clientY, moved: false};
  shot.value?.setPointerCapture?.(event.pointerId);
}

function continueMove(event: PointerEvent): void {
  const box = shot.value?.getBoundingClientRect();
  if (moving === undefined || box === undefined || box.width === 0) {
    return;
  }
  const deltaX = event.clientX - moving.clientX;
  const deltaY = event.clientY - moving.clientY;
  if (!moving.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
    return;
  }
  moving.moved = true;
  // Pixel movement → percent of the original screenshot (the view shows only the crop)
  emit('move', moving.number, {
    x: clampPercent(moving.origin.x + deltaX / box.width * props.crop.width),
    y: clampPercent(moving.origin.y + deltaY / box.height * props.crop.height),
  });
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0) {
    return;
  }
  dragStart = {...viewPoint(event), clientX: event.clientX, clientY: event.clientY};
  shot.value?.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event: PointerEvent): void {
  if (moving !== undefined) {
    continueMove(event);
    return;
  }
  if (dragStart === undefined) {
    return;
  }
  if (draft.value === undefined && Math.hypot(event.clientX - dragStart.clientX, event.clientY - dragStart.clientY) < DRAG_THRESHOLD) {
    return;
  }
  draft.value = boxBetween(dragStart, viewPoint(event));
}

function onPointerUp(event: PointerEvent): void {
  if (moving !== undefined) {
    if (!moving.moved) {
      emit('focus', moving.number);
    }
    moving = undefined;
    return;
  }
  if (dragStart === undefined) {
    return;
  }
  const start = toOriginal(dragStart, props.crop);
  const box = boxBetween(start, toOriginal(viewPoint(event), props.crop));
  const dragged = draft.value !== undefined;
  if (mode.value === 'crop') {
    // The frame stays visible until "Apply"
    pendingCrop.value = dragged && isBigEnough(box) ? box : undefined;
    if (pendingCrop.value === undefined) {
      draft.value = undefined;
    }
  } else {
    draft.value = undefined;
    if (!dragged) {
      emit('add', {kind: 'pin', ...start, width: 0, height: 0});
    } else if (isBigEnough(box)) {
      emit('add', {kind: 'area', ...box});
    }
  }
  dragStart = undefined;
}

function onPointerCancel(): void {
  dragStart = undefined;
  moving = undefined;
  if (mode.value === 'mark') {
    draft.value = undefined;
  }
}
</script>
