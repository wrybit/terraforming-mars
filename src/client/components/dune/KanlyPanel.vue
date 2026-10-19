<template>
  <!-- Kanly (Dune module F): the war field of this generation (always a tile, KanlyBattleCard), every player's garrison
       and the rules as a short list below -->
  <div class="dune-kanly" data-test="dune-kanly">
    <!-- The moves sit on the war field card, their input opens right below it (Jens, 19 Oct 2026) -->
    <KanlyBattleCard :kanly="kanly" :players="players" :spaces="spaces">
      <KanlyMoveButton v-if="kanly.battle !== undefined" :title="JOIN_KANLY_TITLE" label="Send Sardaukar"/>
      <KanlyMoveButton v-else-if="!kanly.foughtThisGeneration" :title="OPEN_KANLY_TITLE" label="Open Kanly" :cost="OPEN_KANLY_COST"/>
    </KanlyBattleCard>
    <DuneMovePanel tab="kanly"/>
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
import DuneMovePanel from './DuneMovePanel.vue';
import KanlyMoveButton from './KanlyMoveButton.vue';
import {JOIN_KANLY_TITLE, OPEN_KANLY_TITLE} from '@/common/dune/duneActionTitles';
import {OPEN_KANLY_COST} from '@/common/dune/kanlyBattle';
import {KANLY_RULES} from './duneRules';
import {duneGraphic} from './duneGraphic';

export default defineComponent({
  name: 'KanlyPanel',
  components: {PlayerChip, KanlyBattleCard, DuneRuleCards, DuneMovePanel, KanlyMoveButton},
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
    JOIN_KANLY_TITLE(): string {
      return JOIN_KANLY_TITLE;
    },
    OPEN_KANLY_TITLE(): string {
      return OPEN_KANLY_TITLE;
    },
    OPEN_KANLY_COST(): number {
      return OPEN_KANLY_COST;
    },
  },
  methods: {
    graphic: duneGraphic,
  },
});
</script>
