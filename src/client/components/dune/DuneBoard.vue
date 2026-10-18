<template>
  <!-- Board tab "Dune": one section per module of this game (common/dune/DuneModule.ts), in the order of the concept -->
  <div class="dune-board" data-test="dune-board">
    <section v-if="dune.bazaar" class="dune-board__section">
      <h3 class="dune-board__title"><img class="dune-board__icon" :src="graphic('special-bazaar')" alt="">{{ $t('Bazaar of Arrakeen') }}</h3>
      <BazaarBoard :bazaar="dune.bazaar" :players="players"/>
    </section>
    <section v-if="dune.worm" class="dune-board__section">
      <h3 class="dune-board__title"><img class="dune-board__icon" :src="graphic('special-worm-domain')" alt="">{{ $t('Shai-Hulud') }}</h3>
      <WormPanel :worm="dune.worm" :players="players"/>
    </section>
    <section v-if="dune.kanly" class="dune-board__section">
      <h3 class="dune-board__title"><img class="dune-board__icon" :src="graphic('res-sardaukar')" alt="">{{ $t('Kanly') }}</h3>
      <KanlyPanel :kanly="dune.kanly" :players="players"/>
    </section>
    <section v-if="dune.schemes" class="dune-board__section">
      <h3 class="dune-board__title"><img class="dune-board__icon" :src="graphic('res-advisor')" alt="">{{ $t('House schemes') }}</h3>
      <SchemesPanel :schemes="dune.schemes" :players="players"/>
    </section>
    <section v-if="dune.choam" class="dune-board__section">
      <h3 class="dune-board__title"><img class="dune-board__icon" :src="graphic('coin')" alt="">{{ $t('CHOAM contracts') }}</h3>
      <ChoamPanel :choam="dune.choam" :players="players"/>
    </section>
    <section v-if="dune.smuggling" class="dune-board__section">
      <h3 class="dune-board__title"><img class="dune-board__icon" :src="graphic('special-smugglers-market')" alt="">{{ $t('Smuggling & suspicion') }}</h3>
      <SmugglingPanel :smuggling="dune.smuggling" :players="players"/>
    </section>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {DuneModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import BazaarBoard from './BazaarBoard.vue';
import WormPanel from './WormPanel.vue';
import KanlyPanel from './KanlyPanel.vue';
import SchemesPanel from './SchemesPanel.vue';
import ChoamPanel from './ChoamPanel.vue';
import SmugglingPanel from './SmugglingPanel.vue';
import {duneGraphic} from './duneGraphic';

export default defineComponent({
  name: 'DuneBoard',
  components: {BazaarBoard, WormPanel, KanlyPanel, SchemesPanel, ChoamPanel, SmugglingPanel},
  props: {
    dune: {
      type: Object as PropType<DuneModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    viewerColor: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
  },
  methods: {
    graphic: duneGraphic,
  },
});
</script>
