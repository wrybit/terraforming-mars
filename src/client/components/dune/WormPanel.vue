<template>
  <!-- Shai-Hulud (Dune module C): the worm's trail on a small map of Arrakis, the die of its last move, what comes next
       and what it does to the spaces it crosses -->
  <div class="dune-worm" data-test="dune-worm">
    <div class="dune-worm__overview">
      <WormTrail :trail="worm.trail"/>
      <dl class="dune-worm__facts">
        <div class="dune-worm__fact">
          <dt>{{ $t('Position') }}</dt>
          <dd><b>{{ coordinate(worm.spaceId) }}</b></dd>
        </div>
        <div v-if="worm.chooser !== undefined" class="dune-worm__fact">
          <dt>{{ $t('Moving now') }}</dt>
          <dd><span class="dune-worm__die">{{ worm.roll }}</span> <span class="dune-worm__arrow">{{ arrow(worm.direction) }}</span>
            <span v-if="worm.turned" class="dune-worm__turned">{{ $t('turned') }}</span>
            <PlayerChip :color="worm.chooser" :players="players"/> {{ $t('chooses the distance') }}</dd>
        </div>
        <div v-else-if="worm.roll !== undefined" class="dune-worm__fact">
          <dt>{{ $t('Last move') }}</dt>
          <dd><span class="dune-worm__die">{{ worm.roll }}</span> <span class="dune-worm__arrow">{{ arrow(worm.direction) }}</span>
            <span v-if="worm.turned" class="dune-worm__turned">{{ $t('turned') }}</span>
            <span v-if="worm.path.length === 0">{{ $t('blocked') }}</span></dd>
        </div>
        <div class="dune-worm__fact">
          <dt>{{ $t('Next move') }}</dt>
          <dd>{{ $t('end of generation, the player with the least TR chooses 1–3 spaces') }}<br>{{ $t('Rock in the way: the worm turns clockwise to the next free direction') }}</dd>
        </div>
      </dl>
    </div>
    <ul class="dune-worm__effects">
      <li v-for="effect in EFFECTS" :key="effect.tile">
        <img class="dune-worm__tile" :src="graphic(effect.tile)" alt="">
        <span>{{ $t(effect.text) }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {WormModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {arrakisCoordinate} from '@/common/dune/arrakisCoordinates';
import {duneGraphic} from './duneGraphic';
import PlayerChip from './PlayerChip.vue';
import WormTrail from './WormTrail.vue';

// Heading index of the move, clockwise from top left (server/dune/Worm.ts wormDirection)
const ARROWS = ['↖', '↗', '→', '↘', '↙', '←'];

const EFFECTS = [
  {tile: 'tile-small-spicefield', text: 'Spice field: +1 spice for each adjacent tile of a player'},
  {tile: 'tile-small-sietch', text: 'City: worm riders, the owner gains 1 spice and 2 heat'},
  {tile: 'tile-small-planting', text: 'Greenery: trampled, the owner loses 3 plants'},
  {tile: 'tile-small-special', text: 'Special tile: damaged, the owner loses 3 M€'},
  {tile: 'special-worm-domain', text: 'Natural Preserve: the worm stops, the owner gains 1 TR'},
];

export default defineComponent({
  name: 'WormPanel',
  components: {PlayerChip, WormTrail},
  props: {
    worm: {
      type: Object as PropType<WormModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
  },
  computed: {
    EFFECTS(): typeof EFFECTS {
      return EFFECTS;
    },
  },
  methods: {
    graphic: duneGraphic,
    coordinate(spaceId: string): string {
      return arrakisCoordinate(spaceId);
    },
    arrow(direction: number | undefined): string {
      return direction === undefined ? '' : ARROWS[direction];
    },
  },
});
</script>
