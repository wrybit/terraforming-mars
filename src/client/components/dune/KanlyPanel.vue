<template>
  <!-- Kanly (Dune module F): the war field of this generation (always a tile, KanlyBattleCard), every player's garrison
       and the rules as a short list below -->
  <div class="dune-kanly" data-test="dune-kanly">
    <!-- The moves sit on the war field card, their input opens right below it (Jens, 19 Oct 2026) -->
    <KanlyBattleCard :kanly="kanly" :players="players" :spaces="spaces" :board="board">
      <KanlyMoveButton v-if="kanly.battle !== undefined" :moveTitle="JOIN_KANLY_TITLE" label="Send Sardaukar" :reason="joinReason"/>
      <KanlyMoveButton v-else-if="!kanly.foughtThisGeneration" :moveTitle="OPEN_KANLY_TITLE" label="Open Kanly" :cost="OPEN_KANLY_COST"
        :reason="openReason"/>
    </KanlyBattleCard>
    <DuneMovePanel tab="kanly"/>
    <!-- Every player's garrison as a card of its own; the cards share the width (Jens, 19 Oct 2026) -->
    <section class="dune-kanly__garrisons">
      <h4 class="dune-kanly__label">{{ $t('Garrison') }}</h4>
      <ul class="dune-kanly__troops">
        <li v-for="entry in kanly.garrisons" :key="entry.color" class="dune-kanly__troop">
          <PlayerChip :color="entry.color" :players="players"/>
          <span class="dune-kanly__strength"><img :src="graphic('res-sardaukar')" alt=""><b>{{ entry.sardaukar }}</b></span>
        </li>
      </ul>
    </section>
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
import {BoardName} from '@/common/boards/BoardName';
import DuneRuleCards from './DuneRuleCards.vue';
import DuneMovePanel from './DuneMovePanel.vue';
import KanlyMoveButton from './KanlyMoveButton.vue';
import {JOIN_KANLY_TITLE, OPEN_KANLY_TITLE} from '@/common/dune/duneActionTitles';
import {isKanlyTargetTile, OPEN_KANLY_COST} from '@/common/dune/kanlyBattle';
import {vueRoot} from '@/client/components/vueRoot';
import {Color} from '@/common/Color';
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
    /** The game's Arrakis board (standard or large): names its spaces and gives their terrain */
    board: {
      type: String as PropType<BoardName>,
      default: BoardName.ARRAKIS,
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
    ownColor(): Color | undefined {
      return vueRoot(this).playerView?.thisPlayer?.color;
    },
    ownGarrison(): number {
      return this.kanly.garrisons.find((entry) => entry.color === this.ownColor)?.sardaukar ?? 0;
    },
    // Why "Send Sardaukar" is off: an empty garrison, otherwise it is simply not the player's action now
    joinReason(): string {
      return this.ownGarrison < 1 ? 'No Sardaukar in your garrison' : 'Only during your action';
    },
    // Why "Open Kanly" is off, in the order the server checks (server/dune/Kanly.ts openInput)
    openReason(): string {
      const megacredits = vueRoot(this).playerView?.thisPlayer?.megacredits ?? 0;
      if (this.ownGarrison < 1) {
        return 'No Sardaukar in your garrison';
      }
      if (megacredits < OPEN_KANLY_COST) {
        return 'Not enough M€';
      }
      const hasTarget = this.spaces.some((space) => space.color !== undefined && space.color !== this.ownColor &&
        space.tileType !== undefined && isKanlyTargetTile(space.tileType));
      if (!hasTarget) {
        return 'No target: no opponent has a greenery, city or special tile';
      }
      return 'Only during your action';
    },
  },
  methods: {
    graphic: duneGraphic,
  },
});
</script>
