<template>
  <!-- Kanly war field (Kanly tab and the input that sends Sardaukar): always a tile on the left – the one at stake with
       its owner's cube, or an empty one while there is no battle – and beside it what goes on: the place and its owner,
       every player's Sardaukar on the field as cubes of their colour; who holds the tile shows by the numbers and the
       outlined row, without a line of its own (Jens, 19 Oct 2026). With "added" (slider of the send input) the own new Sardaukar show lighter and count
       in the forecast. -->
  <div :class="['kanly-battle', {'kanly-battle--none': forecast === undefined || battle === undefined}]" data-test="kanly-battle">
    <ArrakisHex v-if="battle !== undefined" class="kanly-battle__hex" :spaceId="battle.spaceId" :space="space"/>
    <div v-else class="kanly-battle__hex kanly-battle__hex--empty arrakis-hex arrakis-hex--erg">
      <img :src="icon" alt="">
    </div>

    <div v-if="forecast !== undefined && battle !== undefined" class="kanly-battle__body">
      <div class="kanly-battle__place">
        <span class="kanly-battle__eyebrow">{{ $t('War field') }}</span>
        <span class="kanly-battle__name">{{ placeName }}
          <!-- The coordinate leads to the planet: Arrakis tab, the space blinks -->
          <button type="button" class="kanly-battle__coordinate" :title="$t('Show on Arrakis')" @click="showOnArrakis(battle.spaceId)">{{ coordinate }}</button>
        </span>
        <span v-if="forecast.owner !== undefined" class="kanly-battle__owner">
          {{ $t('Tile of') }} <PlayerChip :color="forecast.owner" :players="players"/>
        </span>
      </div>

      <ul class="kanly-battle__forces">
        <li v-for="force in forecast.forces" :key="force.color"
          :class="['kanly-battle__force', {'kanly-battle__force--holder': force.color === forecast.holder}]">
          <PlayerChip :color="force.color" :players="players"/>
          <span class="kanly-battle__role">{{ $t(roleLabel(force)) }}</span>
          <span class="kanly-battle__troops" :aria-label="String(force.sardaukar + force.added)">
            <!-- One cube in the player's colour per Sardaukar on the field, as in the mockup -->
            <BoardCube v-for="index in shownIcons(force.sardaukar)" :key="'on-' + index" class="kanly-battle__cube"
              :color="force.color" view="slight" :size="CUBE_SIZE" :spinSeed="force.color + index"/>
            <BoardCube v-for="index in addedIcons(force)" :key="'add-' + index" class="kanly-battle__cube kanly-battle__cube--added"
              :color="force.color" view="slight" :size="CUBE_SIZE" :spinSeed="force.color + 'added' + index"/>
            <span v-if="force.sardaukar + force.added === 0" class="kanly-battle__none">–</span>
          </span>
          <span class="kanly-battle__count">
            {{ force.sardaukar + force.added }}<span v-if="force.added > 0" class="kanly-battle__plus">+{{ force.added }}</span>
          </span>
        </li>
      </ul>

      <!-- The move that fits the state (Kanly tab: send Sardaukar) -->
      <slot></slot>
    </div>
    <div v-else class="kanly-battle__body">
      <span class="kanly-battle__eyebrow">{{ $t('War field') }}</span>
      <span class="kanly-battle__name">{{ $t('No battle') }}</span>
      <span class="kanly-battle__idle">{{ $t(kanly.foughtThisGeneration ? 'The battle of this generation is over' : 'No war field yet – the first to open one picks the target') }}</span>
      <!-- Kanly tab: open the Kanly -->
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {showOnArrakis} from './showOnArrakis';
import {Color} from '@/common/Color';
import {KanlyModel} from '@/common/dune/DuneModel';
import {SpaceModel} from '@/common/models/SpaceModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {tileTypeToString} from '@/common/TileType';
import {ARRAKIS_PLACE_NAMES, arrakisCoordinate} from '@/common/dune/arrakisCoordinates';
import {translateText} from '@/client/directives/i18n';
import ArrakisHex from './ArrakisHex.vue';
import BoardCube from '@/client/components/common/BoardCube.vue';
import PlayerChip from './PlayerChip.vue';
import {KanlyForce, KanlyForecast, SARDAUKAR_ICON, kanlyForecast} from './kanlyForecast';
import {duneGraphic} from './duneGraphic';

// More Sardaukar than this show as cubes up to the limit; the number beside always tells the whole
const MAXIMUM_ICONS = 6;
// Edge of a Sardaukar cube in px: larger than on the board, the cubes are the content of the row
const CUBE_SIZE = 20;

export default defineComponent({
  name: 'KanlyBattleCard',
  components: {ArrakisHex, BoardCube, PlayerChip},
  props: {
    kanly: {
      type: Object as PropType<KanlyModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    spaces: {
      type: Array as PropType<ReadonlyArray<SpaceModel>>,
      required: true,
    },
    // Own Sardaukar about to be sent (send input), counted for the viewer
    added: {
      type: Number,
      default: 0,
    },
    viewer: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
  },
  computed: {
    battle(): KanlyModel['battle'] {
      return this.kanly.battle;
    },
    forecast(): KanlyForecast | undefined {
      const added = this.viewer === undefined || this.added === 0 ? undefined : {color: this.viewer, amount: this.added};
      return kanlyForecast(this.kanly, this.players, added);
    },
    space(): SpaceModel | undefined {
      return this.spaces.find((space) => space.id === this.battle?.spaceId);
    },
    coordinate(): string {
      return this.battle === undefined ? '' : arrakisCoordinate(this.battle.spaceId);
    },
    // Place name of the board, otherwise what lies there ("City")
    placeName(): string {
      const named = this.battle === undefined ? undefined : ARRAKIS_PLACE_NAMES[this.battle.spaceId];
      if (named !== undefined) {
        return translateText(named);
      }
      const tile = this.space?.tileType;
      return tile === undefined ? '' : translateText(tileTypeToString[tile]);
    },
    CUBE_SIZE(): number {
      return CUBE_SIZE;
    },
    // Sardaukar badge on the empty tile while there is no battle
    icon(): string {
      return duneGraphic(SARDAUKAR_ICON);
    },
  },
  methods: {
    showOnArrakis,
    roleLabel(force: KanlyForce): string {
      if (force.owner) {
        return 'Defends';
      }
      if (force.opener) {
        return 'Opened the Kanly';
      }
      return force.sardaukar + force.added > 0 ? 'Attacks' : 'Not involved';
    },
    shownIcons(count: number): number {
      return Math.min(count, MAXIMUM_ICONS);
    },
    // The new ones fill the icon row up to the limit after those already on the field
    addedIcons(force: KanlyForce): number {
      return Math.min(force.added, MAXIMUM_ICONS - this.shownIcons(force.sardaukar));
    },
  },
});
</script>
