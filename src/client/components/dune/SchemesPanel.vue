<template>
  <!-- House schemes (Dune module B): the own secret agendas with progress; of the others only how many they hold -->
  <div class="dune-schemes" data-test="dune-schemes">
    <template v-for="entry in schemes.players" :key="entry.color">
      <div v-if="entry.agendas !== undefined" class="dune-schemes__own">
        <PlayerChip :color="entry.color" :players="players"/>
        <div v-for="agenda in entry.agendas" :key="agenda.name" class="dune-schemes__agenda">
          <img class="dune-schemes__icon" :src="graphic(definition(agenda.name).icon)" alt="">
          <div class="dune-schemes__text">
            <b>{{ $t(agenda.name) }}</b>
            <span>{{ $t(definition(agenda.name).goal) }}: <b>{{ agenda.value }}</b></span>
          </div>
          <ol class="dune-schemes__levels">
            <li v-for="(target, index) in definition(agenda.name).targets" :key="index"
              :class="['dune-schemes__level', {'dune-schemes__level--reached': agenda.level > index}]">
              <span>{{ target }}</span><b>{{ POINTS[index] }} {{ $t('VP') }}</b>
            </li>
          </ol>
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
