<template>
  <!-- House schemes (Dune module B): the own secret agendas with progress, the rules as a short list below. Every player
       holds agendas, so the others are not listed; after the game everybody's are shown, then with the player's name -->
  <div class="dune-schemes" data-test="dune-schemes">
    <!-- Agendas grow with the box only up to the size of a project card (Jens, 20 Oct 2026) -->
    <DuneFitBox :maxScale="1">
      <template v-for="entry in schemes.players" :key="entry.color">
        <div v-if="entry.agendas !== undefined" class="dune-schemes__own">
          <PlayerChip v-if="owned.length > 1" :color="entry.color" :players="players"/>
          <div class="dune-schemes__cards">
            <SchemeAgendaCard v-for="agenda in entry.agendas" :key="agenda.name" :agenda="agenda"/>
          </div>
        </div>
      </template>
    </DuneFitBox>
    <DuneRuleCards :rules="SCHEMES_RULES"/>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {SchemeModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import PlayerChip from './PlayerChip.vue';
import SchemeAgendaCard from './SchemeAgendaCard.vue';
import DuneRuleCards from './DuneRuleCards.vue';
import DuneFitBox from './DuneFitBox.vue';
import {SCHEMES_RULES} from './duneRules';

export default defineComponent({
  name: 'SchemesPanel',
  components: {PlayerChip, SchemeAgendaCard, DuneRuleCards, DuneFitBox},
  props: {
    schemes: {
      type: Object as PropType<SchemeModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
  },
  computed: {
    SCHEMES_RULES(): typeof SCHEMES_RULES {
      return SCHEMES_RULES;
    },
    // Players whose agendas the viewer sees: the own ones, everybody's after the game
    owned() {
      return this.schemes.players.filter((entry) => entry.agendas !== undefined);
    },
  },
});
</script>
