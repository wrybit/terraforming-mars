<template>
  <!-- House schemes (Dune module B): the own secret agendas with progress; of the others only how many they hold -->
  <div class="dune-schemes" data-test="dune-schemes">
    <template v-for="entry in schemes.players" :key="entry.color">
      <div v-if="entry.agendas !== undefined" class="dune-schemes__own">
        <PlayerChip :color="entry.color" :players="players"/>
        <!-- Agenda cards as in the mockup: name, goal with the current value, then the three levels as coloured bars -->
        <div class="dune-schemes__cards">
          <article v-for="agenda in entry.agendas" :key="agenda.name" class="dune-schemes__agenda">
            <header class="dune-schemes__head">
              <img class="dune-schemes__icon" :src="graphic(definition(agenda.name).icon)" alt="">
              <h4 class="dune-schemes__name">{{ $t(agenda.name) }}</h4>
            </header>
            <p class="dune-schemes__goal">{{ $t(definition(agenda.name).goal) }}: <b>{{ agenda.value }}</b></p>
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
    <div class="dune-schemes__others">
      <span v-for="entry in hidden" :key="entry.color" class="dune-schemes__other">
        <PlayerChip :color="entry.color" :players="players"/> <span>{{ entry.count }} × {{ $t('secret agenda') }}</span>
      </span>
    </div>
    <p class="dune-board__hint">{{ $t(schemes.reduced ? 'Everybody holds one agenda. At game end only the highest level reached counts.' : 'Once a player reaches 35 TR, everybody keeps one of their two agendas. At game end only the highest level reached counts.') }}</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {SchemeModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {SCHEME_LEVEL_POINTS, SchemeAgenda, schemeAgenda} from '@/common/dune/schemeAgendas';
import PlayerChip from './PlayerChip.vue';
import {duneGraphic} from './duneGraphic';

// The three levels of every agenda (SCHEME_LEVEL_POINTS 3 / 5 / 8 VP), named as on the mockup cards
const LEVELS = ['easy', 'medium', 'hard'] as const;
const LEVEL_LABELS = ['Easy', 'Medium', 'Hard'] as const;

export default defineComponent({
  name: 'SchemesPanel',
  components: {PlayerChip},
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
    hidden() {
      return this.schemes.players.filter((entry) => entry.agendas === undefined);
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
