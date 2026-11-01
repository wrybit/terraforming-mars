import {Tag} from '@/common/cards/Tag';
import {InterfaceTagsType, TagDetails} from '@/client/components/overview/playerTagDetails';

// Sums for the tag tooltip of the player table (PlayersTableTagTooltip.vue):
// a column across all players and all tags of one player.

// Real card tags only: special columns (no tag, colonies, influence …) are counters, not tags.
// City is left out on purpose: it is a building as well and would count those cards twice.
const CARD_TAGS: ReadonlySet<string> = new Set(Object.values(Tag));
const EXCLUDED_FROM_PLAYER_TOTAL: ReadonlyArray<InterfaceTagsType> = [Tag.CITY];

export function countsTowardPlayerTotal(tag: InterfaceTagsType): boolean {
  return CARD_TAGS.has(tag) && !EXCLUDED_FROM_PLAYER_TOTAL.includes(tag);
}

// All tags of a player, with event and wild, without city and "no tag"
export function playerTagTotal(details: TagDetails): number {
  return details.tagsInOrder.reduce((sum, detail) => countsTowardPlayerTotal(detail.name) ? sum + detail.count : sum, 0);
}

// One column summed over all players
export function columnTotal(tag: InterfaceTagsType, allDetails: ReadonlyArray<TagDetails>): number {
  return allDetails.reduce((sum, details) => sum + (details.tagsInOrder.find((detail) => detail.name === tag)?.count ?? 0), 0);
}

// Distance between the mouse pointer and the tooltip, and minimum distance to the window edge
const POINTER_OFFSET_X = 14;
const POINTER_OFFSET_Y = 18;
const VIEWPORT_MARGIN = 8;

type Size = {width: number, height: number};

// Hangs below and right of the pointer; at the right or bottom window edge it switches to the other side
export function tagTooltipPosition(pointer: {x: number, y: number}, tooltip: Size, viewport: Size): {left: number, top: number} {
  let left = pointer.x + POINTER_OFFSET_X;
  let top = pointer.y + POINTER_OFFSET_Y;
  if (left + tooltip.width > viewport.width - VIEWPORT_MARGIN) {
    left = pointer.x - POINTER_OFFSET_X - tooltip.width;
  }
  if (top + tooltip.height > viewport.height - VIEWPORT_MARGIN) {
    top = pointer.y - POINTER_OFFSET_Y - tooltip.height;
  }
  return {left: Math.max(VIEWPORT_MARGIN, left), top: Math.max(VIEWPORT_MARGIN, top)};
}
