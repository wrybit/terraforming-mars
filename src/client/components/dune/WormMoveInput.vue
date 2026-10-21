<template>
  <!-- Shai-Hulud: how far the worm moves (WORM_TITLE). A piece of Arrakis around the worm with the placed tiles and
       their owners' cubes; the spaces the worm can end on carry the distance and are chosen by a click (or the number
       key). The chosen way glows, the button confirms. Server: wormChoices (server/dune/Worm.ts). -->
  <div ref="root" class="worm-move" data-test="worm-move">
    <!-- Two sentences, one line each (Jens, 21 Oct 2026) -->
    <p class="worm-move__hint">
      <span class="worm-move__hint-line">{{ $t('Click the space the worm moves to.') }}</span>
      <span class="worm-move__hint-line">{{ $t('Every tile it crosses is hit.') }}</span>
    </p>
    <div class="worm-map" :style="{width: stageWidth + 'px', height: stageHeight + 'px'}">
      <div class="worm-map__board" :style="{width: box.width + 'px', height: box.height + 'px', transform: 'scale(' + scale + ')'}">
        <ArrakisHex v-for="cell in cells" :key="cell.id" :spaceId="cell.id" :space="cell.space" :board="playerView.game.gameOptions.boardName"
          :class="['worm-map__cell', {
            'worm-map__cell--context': cell.role === 'context',
            'worm-map__cell--way': onChosenWay(cell.id),
          }]"
          :style="{left: (cell.x - box.left) + 'px', top: (cell.y - box.top) + 'px'}"/>
        <!-- Rolled heading: a white disc with an arrow on the edge of the worm's space it leaves through (Jens, 21 Oct 2026) -->
        <span v-if="heading !== undefined" class="worm-map__heading" aria-hidden="true"
          :style="{left: heading.x + 'px', top: heading.y + 'px'}">
          <svg viewBox="0 0 16 16" :style="{transform: 'rotate(' + heading.angle + 'deg)'}"><path d="M3 8h9M8 3.5 12.5 8 8 12.5"/></svg>
        </span>
        <!-- Targets on top, as labels with a radio: number keys and screen readers work like for every choice -->
        <label v-for="(target, index) in targets" :key="'target-' + index"
          :class="['worm-map__target', {'worm-map__target--chosen': chosen === index}]"
          :style="{left: target.x + 'px', top: target.y + 'px'}"
          :title="$t(optionTitle(index))">
          <input type="radio" class="choice-option-input" name="worm-distance" :checked="chosen === index" @change="chosen = index">
          <span class="worm-map__distance">{{ target.distance }}</span>
        </label>
      </div>
    </div>
    <p class="worm-move__chosen">{{ chosen === undefined ? '' : $t(optionTitle(chosen)) }}</p>
    <TabPanelFooterSlot>
      <div v-if="showsave" class="worm-move__actions">
        <AppButton hotkey="proceed" size="big" :disabled="chosen === undefined" :title="$t(buttonLabel)" @click="save"/>
      </div>
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import {SpaceModel} from '@/common/models/SpaceModel';
import {Message} from '@/common/logs/Message';
import {arrakisNeighbours, arrakisSpacePosition} from '@/common/dune/arrakisCoordinates';
import {ArrakisLayout, arrakisLayout} from '@/common/dune/arrakisLayout';
import ArrakisHex from './ArrakisHex.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';

// Size of a space on the drawn board (board.less @board-space-width/-height)
const SPACE_WIDTH = 46;
const SPACE_HEIGHT = 51;
// The piece of the map is drawn larger than the board, but never wider than the box
const MAXIMUM_SCALE = 2.4;
// …and never taller than this, so the button stays in view
const MAXIMUM_HEIGHT = 380;
// Rings of neighbours around the worm: as far as it can move at most
const RINGS = 3;

type Cell = {id: string, x: number, y: number, role: 'worm' | 'way' | 'context', space: SpaceModel | undefined};
type Target = {x: number, y: number, distance: number};

let observer: ResizeObserver | undefined;

export default defineComponent({
  name: 'WormMoveInput',
  components: {ArrakisHex, AppButton, TabPanelFooterSlot},
  props: {
    playerView: {
      type: Object as PropType<PlayerViewModel>,
      required: true,
    },
    playerinput: {
      type: Object as PropType<OrOptionsModel>,
      required: true,
    },
    onsave: {
      type: Function as PropType<(out: InputResponse) => void>,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  data() {
    return {
      chosen: undefined as number | undefined,
      width: 600,
    };
  },
  computed: {
    // The game's Arrakis board (standard or large)
    layout(): ArrakisLayout {
      return arrakisLayout(this.playerView.game.gameOptions.boardName);
    },
    wormSpace(): string | undefined {
      return this.playerView.game.dune?.worm?.spaceId;
    },
    // Spaces crossed per option (same order as the options)
    ways(): ReadonlyArray<ReadonlyArray<string>> {
      return this.playerView.game.dune?.worm?.choices ?? [];
    },
    cells(): Array<Cell> {
      const worm = this.wormSpace;
      if (worm === undefined) {
        return [];
      }
      const way = new Set(this.ways.flat());
      // The worm in the middle and three rings around it: the heading is rolled already, so only the spaces on its
      // way count; the rings show the neighbourhood half transparent
      const shown = new Set<string>([worm]);
      let ring = [worm];
      for (let step = 0; step < RINGS; step++) {
        const next: Array<string> = [];
        for (const id of ring) {
          for (const neighbour of arrakisNeighbours(this.layout, id)) {
            if (!shown.has(neighbour)) {
              shown.add(neighbour);
              next.push(neighbour);
            }
          }
        }
        ring = next;
      }
      way.forEach((id) => shown.add(id));
      const spaces = this.playerView.game.spaces;
      const cells: Array<Cell> = [];
      for (const id of shown) {
        const position = arrakisSpacePosition(this.layout, id);
        if (position !== undefined) {
          const role = id === worm ? 'worm' : way.has(id) ? 'way' : 'context';
          cells.push({id, ...position, role, space: spaces.find((space) => space.id === id)});
        }
      }
      return cells;
    },
    // Bounding box of the cells; cell positions relative to it
    box(): {left: number, top: number, width: number, height: number} {
      const xs = this.cells.map((cell) => cell.x);
      const ys = this.cells.map((cell) => cell.y);
      const left = Math.min(...xs);
      const top = Math.min(...ys);
      return {left, top, width: Math.max(...xs) - left + SPACE_WIDTH, height: Math.max(...ys) - top + SPACE_HEIGHT};
    },
    targets(): Array<Target> {
      return this.ways.map((way, index) => {
        const end = way.length > 0 ? way[way.length - 1] : this.wormSpace;
        const position = end === undefined ? undefined : arrakisSpacePosition(this.layout, end);
        return {x: (position?.x ?? 0) - this.box.left, y: (position?.y ?? 0) - this.box.top, distance: way.length || index + 1};
      });
    },
    // Middle of the edge between the worm's space and the first space of its way. Every option runs the same heading,
    // so the first step of the first option is enough; blocked (no way) shows nothing
    heading(): {x: number, y: number, angle: number} | undefined {
      const worm = this.wormSpace;
      const first = this.ways.find((way) => way.length > 0)?.[0];
      const from = worm === undefined ? undefined : arrakisSpacePosition(this.layout, worm);
      const to = first === undefined ? undefined : arrakisSpacePosition(this.layout, first);
      if (from === undefined || to === undefined) {
        return undefined;
      }
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      return {
        x: from.x - this.box.left + SPACE_WIDTH / 2 + dx / 2,
        y: from.y - this.box.top + SPACE_HEIGHT / 2 + dy / 2,
        angle: Math.atan2(dy, dx) * 180 / Math.PI,
      };
    },
    scale(): number {
      return Math.min(MAXIMUM_SCALE, this.width / Math.max(1, this.box.width), MAXIMUM_HEIGHT / Math.max(1, this.box.height));
    },
    stageWidth(): number {
      return Math.round(this.box.width * this.scale);
    },
    stageHeight(): number {
      return Math.round(this.box.height * this.scale);
    },
    buttonLabel(): string {
      const option = this.chosen === undefined ? undefined : this.playerinput.options[this.chosen];
      return option?.buttonLabel ?? 'Move';
    },
  },
  mounted() {
    const root = this.$refs.root as HTMLElement;
    this.width = root.clientWidth || this.width;
    observer = new ResizeObserver(() => {
      this.width = root.clientWidth || this.width;
    });
    observer.observe(root);
  },
  beforeUnmount() {
    observer?.disconnect();
    observer = undefined;
  },
  methods: {
    onChosenWay(id: string): boolean {
      return this.chosen !== undefined && (this.ways[this.chosen] ?? []).includes(id);
    },
    optionTitle(index: number): string | Message {
      const option: PlayerInputModel | undefined = this.playerinput.options[index];
      return option?.title ?? '';
    },
    save(): void {
      if (this.chosen !== undefined) {
        this.onsave({type: 'or', index: this.chosen, response: {type: 'option'}});
      }
    },
  },
});
</script>
