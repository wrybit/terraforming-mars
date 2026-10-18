<template>
  <!-- CHOAM contracts (Dune module D): the open offers at the exchange -->
  <div class="dune-choam" data-test="dune-choam">
    <ul v-if="choam.offers.length > 0" class="dune-choam__offers">
      <li v-for="offer in choam.offers" :key="offer.color" class="dune-choam__offer">
        <PlayerChip :color="offer.color" :players="players"/>
        <span class="dune-choam__goods"><b>{{ offer.giveAmount }}</b><img :src="icon(offer.give)" alt=""></span>
        <span class="dune-choam__arrow">⇄</span>
        <span class="dune-choam__goods"><b>{{ offer.wantAmount }}</b><img :src="icon(offer.want)" alt=""></span>
      </li>
    </ul>
    <p v-else class="dune-choam__empty">{{ $t('No open offers') }}</p>
    <p class="dune-board__hint">{{ $t('Offer (action): goods leave your stock with a wish. Accept (action): first come, first served; both pay 1 M€. Offers nobody took return at the end of the generation.') }}</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ChoamModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Resource} from '@/common/Resource';
import PlayerChip from './PlayerChip.vue';
import {duneGraphic} from './duneGraphic';

// Pictures of the resources in the Dune theme
const RESOURCE_GRAPHIC: Record<Resource, string> = {
  megacredits: 'coin',
  steel: 'res-plasteel',
  titanium: 'res-spice',
  plants: 'res-plant',
  energy: 'res-moisture',
  heat: 'res-water',
};

export default defineComponent({
  name: 'ChoamPanel',
  components: {PlayerChip},
  props: {
    choam: {
      type: Object as PropType<ChoamModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
  },
  methods: {
    icon(resource: Resource): string {
      return duneGraphic(RESOURCE_GRAPHIC[resource]);
    },
  },
});
</script>
