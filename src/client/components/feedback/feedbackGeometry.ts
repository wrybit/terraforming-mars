// Positions on the feedback screenshot. Markers and the crop are stored in percent of the ORIGINAL
// screenshot, so cropping again or undoing the crop never moves a marker; the view only maps them.
import {FeedbackMarkerKind} from '@/common/feedback/FeedbackReport';

export type Point = {x: number, y: number};
/** In percent of the original screenshot */
export type Box = Point & {width: number, height: number};

export type MarkerDraft = Box & {
  kind: FeedbackMarkerKind,
  number: number,
  text: string,
};

export const FULL_CROP: Box = {x: 0, y: 0, width: 100, height: 100};
/** Smallest area or crop in percent; anything smaller was meant as a click */
export const MIN_BOX_PERCENT = 2;

export function isFullCrop(crop: Box): boolean {
  return crop.x === 0 && crop.y === 0 && crop.width === 100 && crop.height === 100;
}

/** Original percent → percent of the cropped view */
export function toView(point: Point, crop: Box): Point {
  return {x: (point.x - crop.x) / crop.width * 100, y: (point.y - crop.y) / crop.height * 100};
}

/** Percent of the cropped view → original percent */
export function toOriginal(point: Point, crop: Box): Point {
  return {x: crop.x + point.x * crop.width / 100, y: crop.y + point.y * crop.height / 100};
}

/** Box spanned by two points (any drag direction), in original percent */
export function boxBetween(start: Point, end: Point): Box {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function isBigEnough(box: Box): boolean {
  return box.width > MIN_BOX_PERCENT && box.height > MIN_BOX_PERCENT;
}

/** A pin counts when its tip is inside, an area when it overlaps the crop */
export function isInsideCrop(marker: Box, crop: Box): boolean {
  return marker.x + marker.width >= crop.x && marker.x <= crop.x + crop.width &&
    marker.y + marker.height >= crop.y && marker.y <= crop.y + crop.height;
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
