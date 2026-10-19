<template>
  <!-- Shai-Hulud trail: all of Arrakis small, the worm's way as a line, a numbered stop where each generation's move
       ended and the worm token where it lies now (WormTrailModel, server/dune/Worm.ts moveWorm) -->
  <figure class="worm-trail" data-test="worm-trail">
    <svg class="worm-trail__map" :viewBox="viewBox" role="img" :aria-label="$t('Trail of the worm')">
      <polygon v-for="cell in cells" :key="cell.id" :points="cell.points" :class="['worm-trail__hex', 'arrakis-zone--' + cell.zone]"/>
      <!-- Older moves fade, so the way reads from old to new. Each move a dotted light line on an orange glow, so it
           stands out on both the light and the dark sand (Jens, 19 Oct 2026) -->
      <g v-for="line in lines" :key="'line-' + line.index" :style="{opacity: line.opacity}">
        <polyline class="worm-trail__glow" :points="line.points"/>
        <polyline class="worm-trail__line" :points="line.points"/>
      </g>
      <circle class="worm-trail__start" :cx="start.x" :cy="start.y" r="7"/>
      <image class="worm-trail__worm" :href="token" :x="now.x - WORM_SIZE / 2" :y="now.y - WORM_SIZE / 2" :width="WORM_SIZE" :height="WORM_SIZE"/>
      <g v-for="stop in stops" :key="'stop-' + stop.spaceId" class="worm-trail__stop" :transform="'translate(' + stop.x + ' ' + stop.y + ')'">
        <title>{{ stop.title }}</title>
        <rect :x="-stop.width / 2" :y="-STOP_HEIGHT / 2" :width="stop.width" :height="STOP_HEIGHT" :rx="STOP_HEIGHT / 2"/>
        <text text-anchor="middle" dominant-baseline="central">{{ stop.label }}</text>
      </g>
    </svg>
    <figcaption class="worm-trail__legend">
      <span class="worm-trail__key"><span class="worm-trail__key-start"></span>{{ $t('Starting space') }}</span>
      <span class="worm-trail__key"><span class="worm-trail__key-stop">x</span>{{ $t('Stop at the end of the generation') }}</span>
    </figcaption>
  </figure>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {WormTrailModel} from '@/common/dune/DuneModel';
import {arrakisCoordinate, arrakisSpaceIds, arrakisSpacePosition} from '@/common/dune/arrakisCoordinates';
import {ArrakisLayout, arrakisLayout} from '@/common/dune/arrakisLayout';
import {BoardName} from '@/common/boards/BoardName';
import {duneGraphic} from './duneGraphic';

// Size of a space on the drawn board (board.less @board-space-width/-height); the map uses board pixels
const SPACE_WIDTH = 46;
const SPACE_HEIGHT = 51;
// Gap between the hexes, so the terrain reads as single spaces
const HEX_GAP = 1.5;
const MARGIN = 4;
const WORM_SIZE = 34;
// Stop badge: height and width per digit, so "12" or "3, 7" still fit
const STOP_HEIGHT = 18;
const STOP_PADDING = 10;
const DIGIT_WIDTH = 7.5;
// The stop where the worm lies now moves to the top right of its space, so the worm token stays visible
const NOW_OFFSET = 15;
// Opacity of the oldest move; the newest one is fully opaque
const OLDEST_OPACITY = 0.35;

type Point = {x: number, y: number};
type Cell = {id: string, zone: string, points: string};
type Line = {index: number, points: string, opacity: number};
type Stop = Point & {spaceId: string, label: string, title: string, width: number};

function center(layout: ArrakisLayout, spaceId: string): Point {
  const position = arrakisSpacePosition(layout, spaceId) ?? {x: 0, y: 0};
  return {x: position.x + SPACE_WIDTH / 2, y: position.y + SPACE_HEIGHT / 2};
}

function hexPoints(layout: ArrakisLayout, spaceId: string): string {
  const {x, y} = center(layout, spaceId);
  const halfWidth = SPACE_WIDTH / 2 - HEX_GAP;
  const halfHeight = SPACE_HEIGHT / 2 - HEX_GAP;
  return [[0, -halfHeight], [halfWidth, -halfHeight / 2], [halfWidth, halfHeight / 2], [0, halfHeight], [-halfWidth, halfHeight / 2], [-halfWidth, -halfHeight / 2]]
    .map(([dx, dy]) => `${x + dx},${y + dy}`).join(' ');
}

export default defineComponent({
  name: 'WormTrail',
  props: {
    trail: {
      type: Object as PropType<WormTrailModel>,
      required: true,
    },
    /** The game's Arrakis board (standard or large) */
    board: {
      type: String as PropType<BoardName>,
      default: BoardName.ARRAKIS,
    },
  },
  computed: {
    layout(): ArrakisLayout {
      return arrakisLayout(this.board);
    },
    WORM_SIZE(): number {
      return WORM_SIZE;
    },
    STOP_HEIGHT(): number {
      return STOP_HEIGHT;
    },
    token(): string {
      return duneGraphic('token-worm');
    },
    cells(): Array<Cell> {
      return arrakisSpaceIds(this.layout).map((id) => ({id, zone: this.layout.zones[id] ?? 'erg', points: hexPoints(this.layout, id)}));
    },
    viewBox(): string {
      const positions = arrakisSpaceIds(this.layout).map((id) => arrakisSpacePosition(this.layout, id) ?? {x: 0, y: 0});
      const left = Math.min(...positions.map((position) => position.x)) - MARGIN;
      const top = Math.min(...positions.map((position) => position.y)) - MARGIN;
      const right = Math.max(...positions.map((position) => position.x)) + SPACE_WIDTH + MARGIN;
      const bottom = Math.max(...positions.map((position) => position.y)) + SPACE_HEIGHT + MARGIN;
      return `${left} ${top} ${right - left} ${bottom - top}`;
    },
    // Space the worm left for each move, so a move's line starts where the one before ended
    origins(): Array<string> {
      const origins: Array<string> = [];
      let at = this.trail.start;
      for (const move of this.trail.moves) {
        origins.push(at);
        at = move.path.length > 0 ? move.path[move.path.length - 1] : at;
      }
      return origins;
    },
    nowSpace(): string {
      const last = this.trail.moves.length;
      return last === 0 ? this.trail.start : this.endOf(last - 1);
    },
    start(): Point {
      return center(this.layout, this.trail.start);
    },
    now(): Point {
      return center(this.layout, this.nowSpace);
    },
    lines(): Array<Line> {
      const count = this.trail.moves.length;
      return this.trail.moves
        .map((move, index) => ({
          index,
          points: [this.origins[index], ...move.path].map((id) => {
            const point = center(this.layout, id);
            return `${point.x},${point.y}`;
          }).join(' '),
          opacity: count <= 1 ? 1 : OLDEST_OPACITY + (1 - OLDEST_OPACITY) * index / (count - 1),
        }))
        .filter((_line, index) => this.trail.moves[index].path.length > 0);
    },
    // One badge per space the worm stopped on, with every generation it stopped there (blocked moves stay put)
    stops(): Array<Stop> {
      const generations = new Map<string, Array<number>>();
      this.trail.moves.forEach((move, index) => {
        const end = this.endOf(index);
        generations.set(end, [...(generations.get(end) ?? []), move.generation]);
      });
      return [...generations.entries()].map(([spaceId, list]) => {
        const label = list.join(', ');
        const point = center(this.layout, spaceId);
        const offset = spaceId === this.nowSpace ? NOW_OFFSET : 0;
        return {
          spaceId,
          label,
          title: `${arrakisCoordinate(this.layout, spaceId)}: ${label}`,
          width: STOP_PADDING + DIGIT_WIDTH * label.length,
          x: point.x + offset,
          y: point.y - offset,
        };
      });
    },
  },
  methods: {
    endOf(index: number): string {
      const path = this.trail.moves[index].path;
      return path.length > 0 ? path[path.length - 1] : this.origins[index];
    },
  },
});
</script>
