<template>
  <!-- One board tab per Dune module (boardTabs.ts DUNE_BOARD_TABS): shows the section of the module of this tab -->
  <div class="dune-board" data-test="dune-board">
    <section v-if="tab === 'bazaar' && dune.bazaar" class="dune-board__section">
      <h3 class="dune-board__title"><img class="dune-board__icon" :src="graphic('special-bazaar')" alt="">{{ $t('Bazaar of Arrakeen') }}</h3>
      <BazaarBoard :bazaar="dune.bazaar" :players="players"/>
    </section>
    <section v-if="tab === 'worm' && dune.worm" class="dune-board__section">
      <h3 class="dune-board__title"><img class="dune-board__icon" :src="graphic('special-worm-domain')" alt="">{{ $t('Shai-Hulud') }}</h3>
      <WormPanel :worm="dune.worm"/>
    </section>
    <section v-if="tab === 'kanly' && dune.kanly" class="dune-board__section">
      <h3 class="dune-board__title"><img class="dune-board__icon" :src="graphic('res-sardaukar')" alt="">{{ $t('Kanly') }}</h3>
      <KanlyPanel :kanly="dune.kanly" :players="players" :spaces="spaces"/>
    </section>
    <section v-if="tab === 'schemes' && dune.schemes" class="dune-board__section">
      <h3 class="dune-board__title"><img class="dune-board__icon" :src="graphic('res-advisor')" alt="">{{ $t('House schemes') }}</h3>
      <SchemesPanel :schemes="dune.schemes" :players="players"/>
    </section>
    <!-- The moves of this module are made right here (duneTabActions.ts, duneMoves.ts) -->
    <DuneActionButtons :tab="tab" :actions="tabActions"/>
    <DuneMovePanel :tab="tab"/>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {DuneModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {SpaceModel} from '@/common/models/SpaceModel';
import {DuneBoardTabId} from '@/client/components/boardTabs/boardTabs';
import BazaarBoard from './BazaarBoard.vue';
import WormPanel from './WormPanel.vue';
import KanlyPanel from './KanlyPanel.vue';
import SchemesPanel from './SchemesPanel.vue';
import {duneGraphic} from './duneGraphic';
import DuneActionButtons from './DuneActionButtons.vue';
import DuneMovePanel from './DuneMovePanel.vue';
import {DUNE_TAB_ACTIONS, DuneTabAction} from './duneTabActions';

export default defineComponent({
  name: 'DuneBoard',
  components: {BazaarBoard, WormPanel, KanlyPanel, SchemesPanel, DuneActionButtons, DuneMovePanel},
  props: {
    dune: {
      type: Object as PropType<DuneModel>,
      required: true,
    },
    tab: {
      type: String as PropType<DuneBoardTabId>,
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
    viewerColor: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
  },
  computed: {
    tabActions(): ReadonlyArray<DuneTabAction> {
      return DUNE_TAB_ACTIONS[this.tab];
    },
  },
  methods: {
    graphic: duneGraphic,
  },
});
</script>
