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
        <!-- Effect of every space with a tile as a chip, on its own layer so it stays readable on the faded spaces -->
        <WormEffectChip v-for="effect in effects" :key="'chip-' + effect.id" :chip="effect.chip"
          :class="['worm-map__chip', {'worm-map__chip--on-way': onChosenWay(effect.id)}]"
          :style="{left: effect.x + 'px', top: effect.y + 'px'}"/>
        <!-- The chosen way as a line, so the corners of a bounce read at a glance -->
        <svg v-if="wayLine !== ''" class="worm-map__line" :width="box.width" :height="box.height" aria-hidden="true">
          <polyline class="worm-map__line-glow" :points="wayLine"/>
          <polyline class="worm-map__line-dash" :points="wayLine"/>
        </svg>
        <!-- Heading: a white disc with an arrow on the edge the worm leaves through – at the start and after every
             bounce, along the longest way (Jens, 21 Oct 2026) -->
        <span v-for="(heading, index) in headings" :key="'heading-' + index" class="worm-map__heading" aria-hidden="true"
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
    <WormVegetationBar :vegetation="playerView.game.oxygenLevel" :maximum="maximumVegetation"/>
    <p class="worm-move__chosen">{{ chosen === undefined ? '' : $t(optionTitle(chosen)) }}</p>
    <!-- What the chosen way does, summed up per player -->
    <div v-if="outcome.length > 0" class="worm-move__outcome">
      <span v-for="row in outcome" :key="row.color" class="worm-move__outcome-player">
        <PlayerCube :color="row.color" :size="14"/>
        <WormEffectChip v-for="(chip, index) in row.chips" :key="index" :chip="chip"/>
      </span>
    </div>
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
import WormEffectChip from './WormEffectChip.vue';
import WormVegetationBar from './WormVegetationBar.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {WormChip, Heading, wormEffect, wormHeadings, wormOutcome} from './wormMoveDisplay';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {Color} from '@/common/Color';
import AppButton from '@/client/components/common/AppButton.vue';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';

// Size of a space on the drawn board (board.less @board-space-width/-height)
const SPACE_WIDTH = 46;
const SPACE_HEIGHT = 51;
// The piece of the map is drawn larger than the board, but never wider than the box
const MAXIMUM_SCALE = 2.4;
// …and never taller than this, so the button stays in view
const MAXIMUM_HEIGHT = 380;
// …and shrinks with the tab, so hint, vegetation track and result stay in view, but not below this
const MINIMUM_HEIGHT = 200;
// Rings of neighbours around the worm: as far as it can move at most
const RINGS = 3;
// Effect chip: its middle in the lower part of the space, below cube and tile picture
const CHIP_Y = 40;

type Cell = {id: string, x: number, y: number, role: 'worm' | 'way' | 'context', space: SpaceModel | undefined};
type Target = {x: number, y: number, distance: number};

let observer: ResizeObserver | undefined;

export default defineComponent({
  name: 'WormMoveInput',
  components: {ArrakisHex, AppButton, TabPanelFooterSlot, WormEffectChip, WormVegetationBar, PlayerCube},
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
      height: MAXIMUM_HEIGHT,
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
    spaceById(): Map<string, SpaceModel> {
      return new Map(this.playerView.game.spaces.map((space) => [space.id, space]));
    },
    // Effect chip on every shown space with a tile (not under the worm), in the lower part of the hex
    effects(): Array<{id: string, x: number, y: number, chip: WormChip}> {
      const list: Array<{id: string, x: number, y: number, chip: WormChip}> = [];
      for (const cell of this.cells) {
        const effect = cell.role === 'worm' ? undefined : this.effectOf(cell.id);
        if (effect !== undefined) {
          list.push({id: cell.id, x: cell.x - this.box.left + SPACE_WIDTH / 2, y: cell.y - this.box.top + CHIP_Y, chip: effect.chip});
        }
      }
      return list;
    },
    wayLine(): string {
      const way = this.chosen === undefined ? [] : this.ways[this.chosen] ?? [];
      return way.length === 0 ? '' : this.centers([this.wormSpace ?? '', ...way]).map((point) => point.x + ',' + point.y).join(' ');
    },
    // Along the longest way: the shorter ones are its beginnings
    headings(): Array<Heading> {
      const longest = this.ways[this.ways.length - 1] ?? [];
      return longest.length === 0 ? [] : wormHeadings(this.centers([this.wormSpace ?? '', ...longest]));
    },
    outcome(): Array<{color: Color, chips: Array<WormChip>}> {
      const way = this.chosen === undefined ? [] : this.ways[this.chosen] ?? [];
      return wormOutcome(way.map((id) => this.effectOf(id)));
    },
    maximumVegetation(): number {
      return getGlobalParameterMaximums(this.playerView.game.gameOptions.boardName).oxygen;
    },
    scale(): number {
      return Math.min(MAXIMUM_SCALE, this.width / Math.max(1, this.box.width), this.height / Math.max(1, this.box.height));
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
  watch: {
    // The result line comes and goes with the choice: measure again once it is drawn
    chosen() {
      this.$nextTick(() => this.measure());
    },
  },
  mounted() {
    const root = this.$refs.root as HTMLElement;
    this.$nextTick(() => this.measure());
    observer = new ResizeObserver(() => this.measure());
    observer.observe(root);
    if (root.parentElement !== null) {
      observer.observe(root.parentElement);
    }
  },
  beforeUnmount() {
    observer?.disconnect();
    observer = undefined;
  },
  methods: {
    measure(): void {
      const root = this.$refs.root as HTMLElement | undefined;
      if (root === undefined) {
        return;
      }
      this.width = root.clientWidth || this.width;
      // Room from the top of this box down to the footer of the tab (it sits inside the scrolling tab) minus
      // everything but the map: the map takes what is left. The children, not the box: it fills the tab
      const panel = root.parentElement;
      const map = root.querySelector<HTMLElement>('.worm-map');
      if (panel !== null && map !== null) {
        const footer = panel.querySelector<HTMLElement>('.or-tab-footer');
        const bottom = (footer ?? panel).getBoundingClientRect()[footer === null ? 'bottom' : 'top'];
        const children = [...root.children].filter((child): child is HTMLElement => child instanceof HTMLElement && child.offsetParent !== null);
        const gap = parseFloat(getComputedStyle(root).rowGap) || 0;
        const others = children.filter((child) => child !== map).reduce((sum, child) => sum + child.offsetHeight, 0) + gap * children.length;
        const room = Math.floor(bottom - root.getBoundingClientRect().top - others);
        this.height = Math.max(MINIMUM_HEIGHT, Math.min(MAXIMUM_HEIGHT, room));
      }
    },
    effectOf(id: string) {
      const space = this.spaceById.get(id);
      return space === undefined ? undefined : wormEffect(space, arrakisNeighbours(this.layout, id).map((neighbour) => this.spaceById.get(neighbour)));
    },
    // Centres of spaces in the coordinates of the map piece
    centers(ids: ReadonlyArray<string>): Array<{x: number, y: number}> {
      return ids.map((id) => {
        const position = arrakisSpacePosition(this.layout, id) ?? {x: 0, y: 0};
        return {x: position.x - this.box.left + SPACE_WIDTH / 2, y: position.y - this.box.top + SPACE_HEIGHT / 2};
      });
    },
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
