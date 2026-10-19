<template>
  <!-- Kanly war field (Kanly tab and the input that sends Sardaukar): which tile is at stake and whose it is, every
       player's Sardaukar on the field, and who holds the tile at the end of the generation as things stand.
       With "added" (slider of the send input) the own new Sardaukar show as a lighter part and count in the forecast. -->
  <div v-if="forecast !== undefined && battle !== undefined" class="kanly-battle" data-test="kanly-battle">
    <div class="kanly-battle__field">
      <ArrakisHex class="kanly-battle__hex" :spaceId="battle.spaceId" :space="space"/>
      <div class="kanly-battle__place">
        <span class="kanly-battle__eyebrow">{{ $t('War field') }}</span>
        <span class="kanly-battle__name">{{ placeName }} <span class="kanly-battle__coordinate">{{ coordinate }}</span></span>
        <span v-if="forecast.owner !== undefined" class="kanly-battle__owner">
          {{ $t('Tile of') }} <PlayerChip :color="forecast.owner" :players="players"/>
        </span>
      </div>
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

    <p :class="['kanly-battle__verdict', {'kanly-battle__verdict--change': forecast.changes}]">
      <span v-if="added > 0" class="kanly-battle__eyebrow">{{ $t('After sending') }}</span>
      <span>{{ verdict[0] }}<PlayerChip v-if="forecast.holder !== undefined" :color="forecast.holder" :players="players"/>{{ verdict[1] }}</span>
    </p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
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
import {KanlyForce, KanlyForecast, kanlyForecast} from './kanlyForecast';

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
    // Text around the holder's chip: "${0} takes the tile …" split at the player
    verdict(): [string, string] {
      const key = this.forecast?.changes === true ? '${0} takes the tile at the end of the generation' : '${0} keeps the tile at the end of the generation';
      const [before, after] = translateText(key).split('${0}');
      return [before ?? '', after ?? ''];
    },
  },
  methods: {
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
