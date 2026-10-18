<template>
  <!-- Kanly (Dune module F): the war field of this generation and every player's garrison -->
  <div class="dune-kanly" data-test="dune-kanly">
    <div v-if="kanly.battle" class="dune-kanly__battle">
      <span class="dune-kanly__label">{{ $t('War field') }}</span>
      <b>{{ coordinate(kanly.battle.spaceId) }}</b>
      <span v-if="kanly.battle.owner">· {{ $t('owner') }} <PlayerChip :color="kanly.battle.owner" :players="players"/></span>
      <span class="dune-kanly__troops">
        <span v-for="entry in kanly.battle.troops" :key="entry.color" class="dune-kanly__troop">
          <PlayerChip :color="entry.color" :players="players"/>
          <img :src="graphic('res-sardaukar')" alt=""><b>{{ entry.sardaukar }}</b>
        </span>
      </span>
    </div>
    <div v-else class="dune-kanly__battle dune-kanly__battle--none">
      {{ $t(kanly.foughtThisGeneration ? 'The battle of this generation is over' : 'No war field yet – the first to open one picks the target') }}
    </div>
    <div class="dune-kanly__garrisons">
      <span class="dune-kanly__label">{{ $t('Garrison') }}</span>
      <span v-for="entry in kanly.garrisons" :key="entry.color" class="dune-kanly__troop">
        <PlayerChip :color="entry.color" :players="players"/>
        <img :src="graphic('res-sardaukar')" alt=""><b>{{ entry.sardaukar }}</b>
      </span>
    </div>
    <p class="dune-board__hint">{{ $t('Recruit: 12 M€, 4 titanium, 6 steel, 5 heat or 6 energy per Sardaukar, at most 2 per action. End of generation: most Sardaukar take the tile, a tie keeps it with the owner.') }}</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {KanlyModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {arrakisCoordinate} from '@/common/dune/arrakisCoordinates';
import PlayerChip from './PlayerChip.vue';
import {duneGraphic} from './duneGraphic';

export default defineComponent({
  name: 'KanlyPanel',
  components: {PlayerChip},
  props: {
    kanly: {
      type: Object as PropType<KanlyModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
  },
  methods: {
    graphic: duneGraphic,
    coordinate: arrakisCoordinate,
  },
});
</script>
