<template>
  <!-- House schemes (Dune module B): the own secret agendas with progress, the rules as a short list below. Every player
       holds agendas, so the others are not listed; after the game everybody's are shown, then with the player's name -->
  <div class="dune-schemes" data-test="dune-schemes">
    <!-- Agendas grow with the box only up to the size of a project card (Jens, 20 Oct 2026) -->
    <DuneFitBox :maxScale="1">
      <template v-for="entry in schemes.players" :key="entry.color">
        <div v-if="entry.agendas !== undefined" class="dune-schemes__own">
          <PlayerChip v-if="owned.length > 1" :color="entry.color" :players="players"/>
          <!-- Agenda cards in card proportions: name, what is counted, the current value as the eye-catcher (icon and
               large number in a box), then the three levels as coloured bars at the bottom -->
          <div class="dune-schemes__cards">
            <article v-for="agenda in entry.agendas" :key="agenda.name" class="dune-schemes__agenda">
              <h4 class="dune-schemes__name">{{ $t(agenda.name) }}</h4>
              <p class="dune-schemes__goal">{{ $t(definition(agenda.name).goal) }}</p>
              <div class="dune-schemes__value" data-test="dune-schemes-value">
                <img class="dune-schemes__icon" :src="graphic(definition(agenda.name).icon)" alt="">
                <b>{{ agenda.value }}</b>
              </div>
              <ol class="dune-schemes__levels">
                <li v-for="(target, index) in definition(agenda.name).targets" :key="index"
                  :class="['dune-schemes__level', 'dune-schemes__level--' + LEVELS[index], {'dune-schemes__level--reached': agenda.level > index}]">
                  <span class="dune-schemes__level-name">{{ $t(LEVEL_LABELS[index]) }}</span>
                  <span class="dune-schemes__target">{{ target }}</span>
                  <span class="dune-schemes__points">{{ POINTS[index] }} {{ $t('VP') }}</span>
                </li>
              </ol>
            </article>
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
import {SCHEME_LEVEL_POINTS, SchemeAgenda, schemeAgenda} from '@/common/dune/schemeAgendas';
import PlayerChip from './PlayerChip.vue';
import DuneRuleCards from './DuneRuleCards.vue';
import DuneFitBox from './DuneFitBox.vue';
import {SCHEMES_RULES} from './duneRules';
import {duneGraphic} from './duneGraphic';

// The three levels of every agenda (SCHEME_LEVEL_POINTS 3 / 5 / 8 VP), named as on the mockup cards
const LEVELS = ['easy', 'medium', 'hard'] as const;
const LEVEL_LABELS = ['Easy', 'Medium', 'Hard'] as const;

export default defineComponent({
  name: 'SchemesPanel',
  components: {PlayerChip, DuneRuleCards, DuneFitBox},
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
    POINTS(): ReadonlyArray<number> {
      return SCHEME_LEVEL_POINTS;
    },
    LEVELS(): typeof LEVELS {
      return LEVELS;
    },
    LEVEL_LABELS(): typeof LEVEL_LABELS {
      return LEVEL_LABELS;
    },
    SCHEMES_RULES(): typeof SCHEMES_RULES {
      return SCHEMES_RULES;
    },
    // Players whose agendas the viewer sees: the own ones, everybody's after the game
    owned() {
      return this.schemes.players.filter((entry) => entry.agendas !== undefined);
    },
  },
  methods: {
    graphic: duneGraphic,
    definition(name: string): SchemeAgenda {
      return schemeAgenda(name);
    },
  },
});
</script>
