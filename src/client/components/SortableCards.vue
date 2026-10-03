<template>
<div ref="root" class="sortable-cards-root" :class="{'sortable-dragging': dragCard !== undefined}">
  <TransitionGroup tag="div" name="sortable" class="sortable-cards">
    <div
      v-for="card in getSortedCards()"
      :key="card.name"
      :data-card-name="card.name"
      class="sortable-slot"
      :class="{'sortable-placeholder': card.name === dragCard, 'card-filter-hidden': visibilityOf(card) === 'hidden', 'card-filter-dimmed': visibilityOf(card) === 'dimmed'}"
      @pointerdown="onPointerDown(card.name, $event)"
      @dragstart.prevent>
      <div class="cardbox">
        <Card :card="card"/>
      </div>
    </div>
  </TransitionGroup>
</div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {CardOrderStorage} from '@/client/utils/CardOrderStorage';
import {reorderHandManually} from '@/client/utils/handSort';
import {CardVisibility} from '@/client/utils/cardFilterState';

// From this mouse movement (px) a click becomes a drag – otherwise clicks on cards would turn into mini drags.
const DRAG_THRESHOLD_PX = 6;
// On touch devices the drag only starts after a short hold so normal scrolling keeps working.
const TOUCH_HOLD_MS = 300;

/** Current offset from a running CSS transform (matrix(a, b, c, d, x, y)), otherwise 0. */
function currentTranslation(element: HTMLElement): [number, number] {
  const match = /^matrix\((.+)\)$/.exec(getComputedStyle(element).transform);
  if (match === null) {
    return [0, 0];
  }
  const values = match[1].split(',').map((value) => parseFloat(value));
  return [values[4] ?? 0, values[5] ?? 0];
}

type PendingDrag = {
  cardName: CardName;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  /** Distance pointer ↔ top-left card corner so the card doesn't jump to the pointer. */
  offsetX: number;
  offsetY: number;
  slot: HTMLElement;
  holdTimer: number | undefined;
};

type DataModel = {
  /** When defined, it is the name of the card being dragged. */
  dragCard: CardName | undefined;
};

// Not kept reactive: pointer and DOM data change on every pointermove and don't belong in rendering.
type DragInternals = {
  pending?: PendingDrag;
  ghost?: HTMLElement;
  /** Viewport position of the ghost at left/top = 0 – compensates for transformed ancestors that shift fixed. */
  ghostOrigin?: {x: number, y: number};
  suppressClick?: boolean;
};

export default defineComponent({
  name: 'SortableCards',
  components: {
    Card,
  },
  props: {
    cards: {
      type: Array as () => Array<CardModel>,
      required: true,
    },
    playerId: {
      type: String,
      required: true,
    },
    // Card filter: hidden cards stay in the list (their place in the manual order is kept), only not shown
    visibility: {
      type: Function as unknown as () => (card: CardModel) => CardVisibility,
      required: false,
    },
  },
  // Order comes from CardOrderStorage (reactive): sorting in the hand tab or in a selection dialog
  // (handSort.ts) shows up here immediately; new cards go at the end.
  data(): DataModel {
    return {
      dragCard: undefined,
    };
  },
  created() {
    (this as unknown as {drag: DragInternals}).drag = {};
  },
  beforeUnmount() {
    this.finishDrag();
  },
  methods: {
    internals(): DragInternals {
      return (this as unknown as {drag: DragInternals}).drag;
    },
    visibilityOf(card: CardModel): CardVisibility {
      return this.visibility?.(card) ?? 'shown';
    },
    getSortedCards() {
      return CardOrderStorage.getOrdered(
        CardOrderStorage.getCardOrder(this.playerId),
        this.cards,
      );
    },
    /**
     * The dragged card takes the target card's place; the others shift along.
     * Independent of the arrangement (grid or single column) and without flicker,
     * because the pointer then lies over the placeholder.
     */
    moveDraggedCard(target: CardName): void {
      if (this.dragCard === undefined || target === this.dragCard) {
        return;
      }
      const cardNames = this.getSortedCards().map((card) => card.name);
      const dragIndex = cardNames.indexOf(this.dragCard);
      const targetIndex = cardNames.indexOf(target);
      if (dragIndex === -1 || targetIndex === -1) {
        return;
      }
      cardNames.splice(dragIndex, 1);
      cardNames.splice(targetIndex, 0, this.dragCard);
      reorderHandManually(this.playerId, cardNames);
    },
    onPointerDown(cardName: CardName, event: PointerEvent): void {
      if (event.button !== 0 || this.internals().pending !== undefined) {
        return;
      }
      const slot = event.currentTarget as HTMLElement;
      const rect = slot.getBoundingClientRect();
      const pointerType = event.pointerType || 'mouse';
      const pending: PendingDrag = {
        cardName,
        pointerId: event.pointerId,
        pointerType,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        slot,
        holdTimer: undefined,
      };
      this.internals().pending = pending;
      if (pointerType === 'touch') {
        pending.holdTimer = window.setTimeout(() => this.startDrag(event.clientX, event.clientY), TOUCH_HOLD_MS);
        window.addEventListener('touchmove', this.onTouchMove, {passive: false});
      }
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
      window.addEventListener('pointercancel', this.onPointerCancel);
    },
    onPointerMove(event: PointerEvent): void {
      const pending = this.internals().pending;
      if (pending === undefined) {
        return;
      }
      if (this.dragCard === undefined) {
        const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
        if (distance < DRAG_THRESHOLD_PX) {
          return;
        }
        if (pending.pointerType === 'touch') {
          // Movement before the hold time elapses = scrolling, not a drag.
          this.finishDrag();
          return;
        }
        this.startDrag(event.clientX, event.clientY);
      }
      this.positionGhost(event.clientX, event.clientY);
      this.updateDropPosition(event.clientX, event.clientY);
    },
    onTouchMove(event: TouchEvent): void {
      // The browser must not scroll during an active drag.
      if (this.dragCard !== undefined) {
        event.preventDefault();
      }
    },
    onPointerUp(): void {
      const wasDragging = this.dragCard !== undefined;
      this.finishDrag();
      if (wasDragging) {
        // The click after releasing must not trigger a card action.
        this.internals().suppressClick = true;
        window.addEventListener('click', this.onClickAfterDrag, {capture: true, once: true});
        window.setTimeout(() => this.internals().suppressClick = false, 0);
      }
    },
    onPointerCancel(): void {
      this.finishDrag();
    },
    onClickAfterDrag(event: MouseEvent): void {
      if (this.internals().suppressClick) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    startDrag(clientX: number, clientY: number): void {
      const pending = this.internals().pending;
      if (pending === undefined) {
        return;
      }
      // Copy of the card as a floating "hand" card; the original slot stays as a placeholder.
      const ghost = pending.slot.cloneNode(true) as HTMLElement;
      ghost.classList.remove('sortable-placeholder');
      ghost.classList.add('sortable-ghost');
      ghost.removeAttribute('data-card-name');
      // Directly on body: otherwise banner/player list (own stacking contexts) lie over the card.
      // The preference classes (preferences_*) also sit on body, so the look stays the same.
      document.body.appendChild(ghost);
      // Measure the origin once (without rotation), then only calculate.
      ghost.style.transform = 'none';
      ghost.style.left = '0px';
      ghost.style.top = '0px';
      const origin = ghost.getBoundingClientRect();
      ghost.style.transform = '';
      this.internals().ghostOrigin = {x: origin.left, y: origin.top};
      this.internals().ghost = ghost;
      this.dragCard = pending.cardName;
      document.documentElement.classList.add('sortable-grabbing');
      this.positionGhost(clientX, clientY);
    },
    positionGhost(clientX: number, clientY: number): void {
      const {pending, ghost, ghostOrigin} = this.internals();
      if (pending === undefined || ghost === undefined || ghostOrigin === undefined) {
        return;
      }
      ghost.style.left = `${clientX - pending.offsetX - ghostOrigin.x}px`;
      ghost.style.top = `${clientY - pending.offsetY - ghostOrigin.y}px`;
    },
    updateDropPosition(clientX: number, clientY: number): void {
      const root = this.$refs.root as HTMLElement | undefined;
      if (root === undefined) {
        return;
      }
      const slots = root.querySelectorAll<HTMLElement>('.sortable-slot[data-card-name]');
      for (const slot of Array.from(slots)) {
        const rect = slot.getBoundingClientRect();
        // While gliding (sortable-move) the card is still offset. Without this subtraction
        // the pointer would hit the departing card again and it would jump back and forth.
        const [shiftX, shiftY] = currentTranslation(slot);
        const left = rect.left - shiftX;
        const top = rect.top - shiftY;
        const inside = clientX >= left && clientX < left + rect.width &&
          clientY >= top && clientY < top + rect.height;
        if (inside) {
          this.moveDraggedCard(slot.dataset.cardName as CardName);
          return;
        }
      }
    },
    finishDrag(): void {
      const drag = this.internals();
      if (drag.pending?.holdTimer !== undefined) {
        window.clearTimeout(drag.pending.holdTimer);
      }
      drag.ghost?.remove();
      drag.ghost = undefined;
      drag.ghostOrigin = undefined;
      drag.pending = undefined;
      this.dragCard = undefined;
      document.documentElement.classList.remove('sortable-grabbing');
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
      window.removeEventListener('pointercancel', this.onPointerCancel);
      window.removeEventListener('touchmove', this.onTouchMove);
    },
  },
});
</script>
