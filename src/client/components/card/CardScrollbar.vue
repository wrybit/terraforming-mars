<template>
  <!-- Dune cards: own scrollbar of the content (the browser's is hidden), shown while the pointer is over the card or
       the content scrolls. A click on it must not choose the card (cards sit in a label with their checkbox). -->
  <!-- Hidden with visibility, not display: the track keeps its height to measure while the content does not scroll -->
  <div class="card-scrollbar" :class="{'card-scrollbar-active': active, 'card-scrollbar-idle': !state.scrolls}" aria-hidden="true"
       @click.stop.prevent @pointerdown.stop>
    <div class="card-scrollbar-thumb" :style="{top: state.thumbTop + 'px', height: state.thumbHeight + 'px'}" @pointerdown.stop.prevent="grab"></div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {cardScrollState, CardScrollState, scrollTopForThumb} from './cardScrollArea';
import {cancelLayoutJob, scheduleLayoutJob} from '@/client/utils/layoutBatch';

// How long the scrollbar stays visible after the content scrolled (touch screens have no hover)
const ACTIVE_AFTER_SCROLL_MS = 900;

export default defineComponent({
  name: 'CardScrollbar',
  props: {
    content: {
      type: Object as PropType<HTMLElement | undefined>,
      required: false,
      default: undefined,
    },
  },
  data() {
    return {
      state: {scrolls: false, fadeTop: 0, fadeBottom: 0, thumbTop: 0, thumbHeight: 0} as CardScrollState,
      active: false,
      activeTimer: undefined as number | undefined,
      resizeObserver: undefined as ResizeObserver | undefined,
    };
  },
  watch: {
    content(next: HTMLElement | undefined, previous: HTMLElement | undefined) {
      this.release(previous);
      this.attach(next);
    },
  },
  mounted() {
    this.attach(this.content);
  },
  beforeUnmount() {
    this.release(this.content);
    window.clearTimeout(this.activeTimer);
  },
  methods: {
    attach(content: HTMLElement | undefined): void {
      if (content === undefined) {
        return;
      }
      content.addEventListener('scroll', this.onScroll, {passive: true});
      // The content grows when fonts load or the icon rows are zoomed: its children are watched, not only the box
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.update());
        this.resizeObserver.observe(content);
        Array.from(content.children).forEach((child) => this.resizeObserver?.observe(child));
      }
      this.update();
    },
    release(content: HTMLElement | undefined): void {
      cancelLayoutJob(this);
      content?.removeEventListener('scroll', this.onScroll);
      content?.classList.remove('card-content-scrolls');
      this.resizeObserver?.disconnect();
      this.resizeObserver = undefined;
    },
    onScroll(): void {
      this.update();
      this.active = true;
      window.clearTimeout(this.activeTimer);
      this.activeTimer = window.setTimeout(() => this.active = false, ACTIVE_AFTER_SCROLL_MS);
    },
    /** Thumb and fades for the current scroll position; the fades are a mask on the content (theme-extra.css) */
    update(): void {
      const content = this.content;
      if (content === undefined) {
        return;
      }
      // Measured together with all other cards of the frame (layoutBatch.ts): one style recalculation for a whole tab
      // of cards instead of one per card
      scheduleLayoutJob(this, {
        measure: () => cardScrollState({top: content.scrollTop, height: content.scrollHeight, visible: content.clientHeight},
          (this.$el as HTMLElement).offsetHeight),
        apply: (state) => {
          this.state = state;
          // Only then the content is a scroll container; otherwise the wheel scrolls the page (theme-extra.css)
          content.classList.toggle('card-content-scrolls', state.scrolls);
          content.style.setProperty('--card-fade-top', state.fadeTop + 'px');
          content.style.setProperty('--card-fade-bottom', state.fadeBottom + 'px');
        },
      });
    },
    grab(event: PointerEvent): void {
      const content = this.content;
      if (content === undefined) {
        return;
      }
      const track = this.$el as HTMLElement;
      // Screen pixels per card pixel: small cards, magnified cards and the log scale the card
      const scale = track.getBoundingClientRect().height / (track.offsetHeight || 1);
      const start = {y: event.clientY, top: content.scrollTop};
      const move = (moveEvent: PointerEvent) => {
        const distance = (moveEvent.clientY - start.y) / scale;
        content.scrollTop = scrollTopForThumb(start.top, distance, {height: content.scrollHeight, visible: content.clientHeight},
          track.offsetHeight, this.state.thumbHeight);
      };
      const stop = () => {
        track.classList.remove('card-scrollbar-dragging');
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
      };
      track.classList.add('card-scrollbar-dragging');
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', stop);
    },
  },
});
</script>
