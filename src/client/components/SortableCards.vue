<template>
<div ref="root" class="sortable-cards-root" :class="{'sortable-dragging': dragCard !== undefined}">
  <TransitionGroup tag="div" name="sortable" class="sortable-cards">
    <div
      v-for="card in getSortedCards()"
      :key="card.name"
      :data-card-name="card.name"
      class="sortable-slot"
      :class="{'sortable-placeholder': card.name === dragCard}"
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

// Ab dieser Mausbewegung (px) wird aus einem Klick ein Drag – sonst würden Klicks auf Karten zu Mini-Drags.
const DRAG_THRESHOLD_PX = 6;
// Auf Touch-Geräten startet der Drag erst nach kurzem Halten, damit normales Scrollen weiter funktioniert.
const TOUCH_HOLD_MS = 300;

type PendingDrag = {
  cardName: CardName;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  /** Abstand Zeiger ↔ linke obere Kartenecke, damit die Karte nicht zum Zeiger springt. */
  offsetX: number;
  offsetY: number;
  slot: HTMLElement;
  holdTimer: number | undefined;
};

type DataModel = {
  /** Mapping from card name to its order */
  cardOrder: {[x: string]: number};
  /** When defined, it is the name of the card being dragged. */
  dragCard: CardName | undefined;
};

// Nicht reaktiv gehalten: Zeiger- und DOM-Daten ändern sich bei jedem pointermove und gehören nicht ins Rendering.
type DragInternals = {
  pending?: PendingDrag;
  ghost?: HTMLElement;
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
  },
  data(): DataModel {
    const cache = CardOrderStorage.getCardOrder(this.playerId);
    const cardOrder: {[x: string]: number} = {};
    const keys = Object.keys(cache);
    let max = 0;
    for (const key of keys) {
      if (this.cards.find((card) => card.name === key) !== undefined) {
        cardOrder[key] = cache[key];
        max = Math.max(max, cache[key]);
      }
    }
    max++;
    for (const card of this.cards) {
      if (cardOrder[card.name] === undefined) {
        cardOrder[card.name] = max++;
      }
    }
    return {
      cardOrder: cardOrder,
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
    getSortedCards() {
      return CardOrderStorage.getOrdered(
        this.cardOrder,
        this.cards,
      );
    },
    /**
     * Die gezogene Karte übernimmt den Platz der Zielkarte; die übrigen rücken nach.
     * Unabhängig von der Anordnung (Raster oder eine Spalte) und ohne Flackern,
     * weil der Zeiger danach über dem Platzhalter liegt.
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
      cardNames.forEach((cardName, index) => this.cardOrder[cardName] = index + 1);
      CardOrderStorage.updateCardOrder(this.playerId, this.cardOrder);
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
          // Bewegung vor Ablauf der Haltezeit = Scrollen, kein Drag.
          this.finishDrag();
          return;
        }
        this.startDrag(event.clientX, event.clientY);
      }
      this.positionGhost(event.clientX, event.clientY);
      this.updateDropPosition(event.clientX, event.clientY);
    },
    onTouchMove(event: TouchEvent): void {
      // Während eines laufenden Drags darf der Browser nicht scrollen.
      if (this.dragCard !== undefined) {
        event.preventDefault();
      }
    },
    onPointerUp(): void {
      const wasDragging = this.dragCard !== undefined;
      this.finishDrag();
      if (wasDragging) {
        // Der Klick nach dem Loslassen soll keine Kartenaktion auslösen.
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
      const root = this.$refs.root as HTMLElement | undefined;
      if (pending === undefined || root === undefined) {
        return;
      }
      // Kopie der Karte als schwebende „Hand“-Karte; der Original-Slot bleibt als Platzhalter stehen.
      const ghost = pending.slot.cloneNode(true) as HTMLElement;
      ghost.classList.remove('sortable-placeholder');
      ghost.classList.add('sortable-ghost');
      ghost.removeAttribute('data-card-name');
      root.appendChild(ghost);
      this.internals().ghost = ghost;
      this.dragCard = pending.cardName;
      this.positionGhost(clientX, clientY);
    },
    positionGhost(clientX: number, clientY: number): void {
      const {pending, ghost} = this.internals();
      const root = this.$refs.root as HTMLElement | undefined;
      if (pending === undefined || ghost === undefined || root === undefined) {
        return;
      }
      // Relativ zum Wurzelelement statt position: fixed – transformierte Vorfahren würden fixed sonst verschieben.
      const rootRect = root.getBoundingClientRect();
      ghost.style.left = `${clientX - pending.offsetX - rootRect.left}px`;
      ghost.style.top = `${clientY - pending.offsetY - rootRect.top}px`;
    },
    updateDropPosition(clientX: number, clientY: number): void {
      const root = this.$refs.root as HTMLElement | undefined;
      if (root === undefined) {
        return;
      }
      const slots = root.querySelectorAll<HTMLElement>('.sortable-slot[data-card-name]');
      for (const slot of Array.from(slots)) {
        const rect = slot.getBoundingClientRect();
        const inside = clientX >= rect.left && clientX < rect.left + rect.width &&
          clientY >= rect.top && clientY < rect.top + rect.height;
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
      drag.pending = undefined;
      this.dragCard = undefined;
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
      window.removeEventListener('pointercancel', this.onPointerCancel);
      window.removeEventListener('touchmove', this.onTouchMove);
    },
  },
});
</script>
