<template>
  <!-- Envy of the great houses (CHOAM, formerly suspicion): the track with every player's marker. Each step has a
       name from the story instead of a number (Jens 24 Oct 2026: concord … ostracism); only the loss stays a number. -->
  <div class="dune-smuggling" data-test="dune-smuggling">
    <ol class="dune-smuggling__track" :style="{'--dune-track-steps': LEVELS.length}">
      <li v-for="level in LEVELS" :key="level" :class="['dune-smuggling__step', 'dune-smuggling__step--' + level]">
        <span class="dune-smuggling__level">{{ $t(LEVEL_NAMES[level]) }}</span>
        <!-- What the step costs at the end of the generation: the influence icon next to the loss (Jens, 19 Oct 2026) -->
        <span v-if="penalty(level) > 0" class="dune-smuggling__penalty">−{{ penalty(level) }}<img class="dune-smuggling__penalty-icon" :src="INFLUENCE_ICON" alt=""></span>
        <!-- Free steps: nothing to say, the empty line keeps the markers of all steps at the same height -->
        <span v-else class="dune-smuggling__penalty dune-smuggling__penalty--free"></span>
        <span class="dune-smuggling__markers">
          <!-- Each player's marker as the acrylic cube of their colour, seen from above with its shadow and turned at
               random per step, like the cubes on the board (Jens 25 Oct 2026) -->
          <BoardCube v-for="entry in at(level)" :key="entry.color" class="dune-smuggling__marker" :color="entry.color"
            :size="20" :spinSeed="'suspicion-' + entry.color + '-' + level" :title="name(entry.color)"/>
        </span>
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {MAX_SUSPICION, SmugglingModel, suspicionPenalty} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import BoardCube from '@/client/components/common/BoardCube.vue';
import {duneGraphic} from './duneGraphic';

const INFLUENCE_ICON = duneGraphic('res-landsraad');
const LEVELS = Array.from({length: MAX_SUSPICION + 1}, (_, level) => level);
// Names of the steps, from harmony with the houses to being shunned by them (English, translated on display)
const LEVEL_NAMES: ReadonlyArray<string> = ['Concord', 'Whispers', 'Distrust', 'Grudge', 'Enmity', 'Ostracism'];

export default defineComponent({
  name: 'SmugglingPanel',
  components: {BoardCube},
  props: {
    smuggling: {
      type: Object as PropType<SmugglingModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    // Without the rules text (CHOAM tab of the action menu, ChoamExchangeInput.vue)
    compact: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    LEVELS(): typeof LEVELS {
      return LEVELS;
    },
    LEVEL_NAMES(): typeof LEVEL_NAMES {
      return LEVEL_NAMES;
    },
    INFLUENCE_ICON(): string {
      return INFLUENCE_ICON;
    },
  },
  methods: {
    penalty(level: number): number {
      return suspicionPenalty(level);
    },
    at(level: number) {
      return this.smuggling.suspicion.filter((entry) => entry.level === level);
    },
    name(color: Color): string {
      return this.players.find((player) => player.color === color)?.name ?? color;
    },
  },
});
</script>
