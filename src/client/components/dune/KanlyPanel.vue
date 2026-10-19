<template>
  <!-- Kanly (Dune module F): the war field of this generation (always a tile, KanlyBattleCard), every player's garrison
       and the rules as a short list below -->
  <div class="dune-kanly" data-test="dune-kanly">
    <KanlyBattleCard :kanly="kanly" :players="players" :spaces="spaces"/>
    <div class="dune-kanly__garrisons">
      <span class="dune-kanly__label">{{ $t('Garrison') }}</span>
      <span v-for="entry in kanly.garrisons" :key="entry.color" class="dune-kanly__troop">
        <PlayerChip :color="entry.color" :players="players"/>
        <img :src="graphic('res-sardaukar')" alt=""><b>{{ entry.sardaukar }}</b>
      </span>
    </div>
    <DuneRuleCards :rules="KANLY_RULES"/>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {KanlyModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {SpaceModel} from '@/common/models/SpaceModel';
import PlayerChip from './PlayerChip.vue';
import KanlyBattleCard from './KanlyBattleCard.vue';
import DuneRuleCards from './DuneRuleCards.vue';
import {KANLY_RULES} from './duneRules';
import {duneGraphic} from './duneGraphic';

export default defineComponent({
  name: 'KanlyPanel',
  components: {PlayerChip, KanlyBattleCard, DuneRuleCards},
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
  },
  computed: {
    KANLY_RULES(): typeof KANLY_RULES {
      return KANLY_RULES;
    },
  },
  methods: {
    graphic: duneGraphic,
  },
});
</script>
