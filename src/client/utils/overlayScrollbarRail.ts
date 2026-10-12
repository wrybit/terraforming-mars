// One overlay scrollbar (one direction of one scroll area): the bar element, its placement and the
// mouse interaction (drag the thumb, click the track to page). Visibility timing: overlayScrollbars.ts.
import {innerBox, frameOf, isScrollable, scrollMetrics} from '@/client/utils/overlayScrollbarArea';
import {Box, railBox, ScrollAxis, scrollDeltaForDrag, snapToFrame, thumbGeometry} from '@/client/utils/overlayScrollbarGeometry';

// Share of a page the track click scrolls, so a bit of the previous view stays for orientation
const PAGE_SHARE = 0.9;

/** Where the bar of this area lies (also its hover zone), whether it is shown or not. */
export function railBoxOf(scrollArea: Element, axis: ScrollAxis): Box {
  const edges = snapToFrame(innerBox(scrollArea), innerBox(frameOf(scrollArea)));
  const other: ScrollAxis = axis === 'vertical' ? 'horizontal' : 'vertical';
  return railBox(edges, axis, isScrollable(scrollArea, other));
}

export class OverlayScrollbarRail {
  public readonly element: HTMLDivElement;
  private readonly thumb: HTMLDivElement;
  private dragging = false;

  constructor(private readonly scrollArea: Element, private readonly axis: ScrollAxis, private readonly onDragEnd: () => void) {
    this.element = document.createElement('div');
    this.element.className = `overlay-scrollbar overlay-scrollbar--${axis}`;
    this.element.setAttribute('aria-hidden', 'true');
    // Top layer: the bar must also lie above modal dialogs (showModal), whose content scrolls too
    this.element.setAttribute('popover', 'manual');
    this.thumb = document.createElement('div');
    this.thumb.className = 'overlay-scrollbar__thumb';
    this.element.appendChild(this.thumb);
    document.body.appendChild(this.element);
    this.thumb.addEventListener('pointerdown', (event) => this.startDrag(event));
    this.element.addEventListener('pointerdown', (event) => this.pageTowards(event));
  }

  public get isDragging(): boolean {
    return this.dragging;
  }

  public get isVisible(): boolean {
    return this.element.classList.contains('overlay-scrollbar--visible');
  }

  public box(): Box {
    return railBoxOf(this.scrollArea, this.axis);
  }

  public show(): void {
    if (!this.isVisible) {
      this.raiseToTop();
    }
    this.place();
    this.element.classList.add('overlay-scrollbar--visible');
  }

  public hide(): void {
    this.element.classList.remove('overlay-scrollbar--visible', 'overlay-scrollbar--hovered');
  }

  /** Under the pointer: stays visible and becomes grabbable – same size and place, nothing jumps. */
  public setHovered(hovered: boolean): void {
    this.element.classList.toggle('overlay-scrollbar--hovered', hovered);
  }

  public get isHovered(): boolean {
    return this.element.classList.contains('overlay-scrollbar--hovered');
  }

  public remove(): void {
    this.element.remove();
  }

  private place(): void {
    const box = this.box();
    Object.assign(this.element.style, {
      left: `${box.left}px`, top: `${box.top}px`,
      width: `${box.right - box.left}px`, height: `${box.bottom - box.top}px`,
    });
    const thumb = thumbGeometry(scrollMetrics(this.scrollArea, this.axis), this.track(box));
    if (this.axis === 'vertical') {
      Object.assign(this.thumb.style, {top: `${thumb.offset}px`, height: `${thumb.length}px`});
    } else {
      Object.assign(this.thumb.style, {left: `${thumb.offset}px`, width: `${thumb.length}px`});
    }
  }

  private track(box: Box): number {
    return this.axis === 'vertical' ? box.bottom - box.top : box.right - box.left;
  }

  // A popover opened earlier lies below a dialog opened later: reopening puts it on top again
  private raiseToTop(): void {
    if (typeof this.element.showPopover !== 'function') {
      return;
    }
    if (this.element.matches(':popover-open')) {
      this.element.hidePopover();
    }
    this.element.showPopover();
  }

  private pointerPosition(event: PointerEvent): number {
    return this.axis === 'vertical' ? event.clientY : event.clientX;
  }

  private scrollTo(position: number): void {
    if (this.axis === 'vertical') {
      this.scrollArea.scrollTop = position;
    } else {
      this.scrollArea.scrollLeft = position;
    }
  }

  private startDrag(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.thumb.setPointerCapture(event.pointerId);
    this.dragging = true;
    this.element.classList.add('overlay-scrollbar--dragging');
    const start = this.pointerPosition(event);
    const startScroll = scrollMetrics(this.scrollArea, this.axis).position;
    const move = (moveEvent: PointerEvent) => {
      const delta = scrollDeltaForDrag(this.pointerPosition(moveEvent) - start, scrollMetrics(this.scrollArea, this.axis), this.track(this.box()));
      this.scrollTo(startScroll + delta);
    };
    const end = () => {
      this.dragging = false;
      this.element.classList.remove('overlay-scrollbar--dragging');
      this.thumb.removeEventListener('pointermove', move);
      this.thumb.removeEventListener('pointerup', end);
      this.thumb.removeEventListener('pointercancel', end);
      this.onDragEnd();
    };
    this.thumb.addEventListener('pointermove', move);
    this.thumb.addEventListener('pointerup', end);
    this.thumb.addEventListener('pointercancel', end);
  }

  private pageTowards(event: PointerEvent): void {
    const thumb = this.thumb.getBoundingClientRect();
    const before = this.axis === 'vertical' ? event.clientY < thumb.top : event.clientX < thumb.left;
    const page = scrollMetrics(this.scrollArea, this.axis).viewport * PAGE_SHARE * (before ? -1 : 1);
    this.scrollArea.scrollBy(this.axis === 'vertical' ? {top: page, behavior: 'smooth'} : {left: page, behavior: 'smooth'});
  }
}
