<template>
  <!-- Agenda card in card proportions, variant D5 of the mockup (Jens, 20 Oct 2026): violet head with name and what is
       counted (secret agenda), sand body with the current value as the eye-catcher, the three levels as a rising stair
       with the VP as gold coins; levels not reached yet are pale. Shared by the schemes tab (SchemesPanel.vue) and the
       choice which agenda to keep (SchemesKeepInput.vue). -->
  <article class="dune-schemes__agenda">
    <header class="dune-schemes__head">
      <h4 class="dune-schemes__name">{{ $t(agenda.name) }}</h4>
      <p class="dune-schemes__goal">{{ $t(definition.goal) }}</p>
    </header>
    <div class="dune-schemes__body">
      <div class="dune-schemes__value" data-test="dune-schemes-value">
        <img class="dune-schemes__icon" :src="graphic(definition.icon)" alt="">
        <b>{{ agenda.value }}</b>
      </div>
      <ol class="dune-schemes__levels">
        <li v-for="(target, index) in definition.targets" :key="index"
          :class="['dune-schemes__level', 'dune-schemes__level--' + LEVELS[index], {'dune-schemes__level--reached': agenda.level > index}]">
          <span class="dune-schemes__points" :title="POINTS[index] + ' ' + $t('VP')">{{ POINTS[index] }}</span>
          <span class="dune-schemes__target">{{ target }}</span>
          <span class="dune-schemes__level-name">{{ $t(LEVEL_LABELS[index]) }}</span>
        </li>
      </ol>
    </div>
  </article>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {SCHEME_LEVEL_POINTS, SchemeAgenda, schemeAgenda} from '@/common/dune/schemeAgendas';
import {duneGraphic} from './duneGraphic';

// The three levels of every agenda (SCHEME_LEVEL_POINTS 3 / 5 / 8 VP), named as on the mockup cards
const LEVELS = ['easy', 'medium', 'hard'] as const;
const LEVEL_LABELS = ['Easy', 'Medium', 'Hard'] as const;

export type AgendaProgress = {name: string, value: number, level: number};

export default defineComponent({
  name: 'SchemeAgendaCard',
  props: {
    agenda: {
      type: Object as PropType<AgendaProgress>,
      required: true,
    },
  },
  computed: {
    definition(): SchemeAgenda {
      return schemeAgenda(this.agenda.name);
    },
    POINTS(): ReadonlyArray<number> {
      return SCHEME_LEVEL_POINTS;
    },
    LEVELS(): typeof LEVELS {
      return LEVELS;
    },
    LEVEL_LABELS(): typeof LEVEL_LABELS {
      return LEVEL_LABELS;
    },
  },
  methods: {
    graphic: duneGraphic,
  },
});
</script>
