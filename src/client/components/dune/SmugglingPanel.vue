<template>
  <!-- Envy of the great houses (CHOAM, formerly suspicion): the track 0–4 with every player's marker -->
  <div class="dune-smuggling" data-test="dune-smuggling">
    <ol class="dune-smuggling__track" :style="{'--dune-track-steps': LEVELS.length}">
      <li v-for="level in LEVELS" :key="level" :class="['dune-smuggling__step', 'dune-smuggling__step--' + level]">
        <span class="dune-smuggling__level">{{ level }}</span>
        <!-- What the step costs at the end of the generation: the influence icon next to the loss (Jens, 19 Oct 2026) -->
        <span v-if="penalty(level) > 0" class="dune-smuggling__penalty">−{{ penalty(level) }}<img class="dune-smuggling__penalty-icon" :src="INFLUENCE_ICON" alt=""></span>
        <span v-else class="dune-smuggling__penalty dune-smuggling__penalty--free">{{ $t('Free') }}</span>
        <span class="dune-smuggling__markers">
          <!-- Each player's marker as the acrylic cube of their colour, as everywhere on the board -->
          <BoardCube v-for="entry in at(level)" :key="entry.color" class="dune-smuggling__marker" :color="entry.color"
            view="slight" :size="16" :spinSeed="'suspicion-' + entry.color" :title="name(entry.color)"/>
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
