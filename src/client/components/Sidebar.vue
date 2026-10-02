<template>
<div :class="'sidebar_cont sidebar '+getSideBarClass()">
  <div v-if="gameOptions.expansions.turmoil" :title="$t('Ruling Party')">
    <div :class="'party-name party-name-indicator party-name--'+rulingPartyToCss()"> <span v-i18n>{{ getRulingParty() }}</span></div>
  </div>
  <div class="global_params">
    <GlobalParameterValue :param="globalParameter.TEMPERATURE" :value="temperature"/>
    <GlobalParameterValue :param="globalParameter.OXYGEN" :value="oxygen"/>
    <GlobalParameterValue :param="globalParameter.OCEANS" :value="oceans"/>
    <GlobalParameterValue v-if="gameOptions.expansions.venus" :param="globalParameter.VENUS" :value="venus"/>
    <MoonGlobalParameterValue v-if="moonData" :moonData="moonData"/>
  </div>
  <!-- Spectators (neutral colour) have no own cube: an empty black square would only be puzzling -->
  <div v-if="playerColor !== 'neutral'" class="sidebar_item preferences_player" :title="$t('Player Color Cube')">
    <div :class="getPlayerColorCubeClass()+' player_bg_color_' + playerColor"></div>
  </div>

  <!-- Display only: the old jump link pointed to the long page of the original, which the tab layout no longer has -->
  <div class="sidebar_item deck-sizes sidebar_item_shortcut-long" :title="$t('Draw pile') + ' / ' + $t('Discard pile')">
    <i class="sidebar_icon sidebar_icon--cards">
      <div class="deck-size">🂠{{ deckSize }}<br>🗑{{ discardPileSize }}</div>
    </i>
  </div>
  <a v-if="coloniesCount > 0" href="#colonies" :title="$t('Jump to colonies')">
      <div class="sidebar_item sidebar_item_shortcut">
          <i class="sidebar_icon sidebar_icon--colonies"></i>
      </div>
  </a>

  <LanguageIcon/>

  <div class="sidebar_item sidebar_item--info" :title="$t('Information panel')">
    <i class="sidebar_icon sidebar_icon--info"
      :class="{'sidebar_item--is-active': ui.gamesetup_detail_open}"
      @click="ui.gamesetup_detail_open = !ui.gamesetup_detail_open"
      :title="$t('game setup details')"></i>
    <SidebarModal :open="ui.gamesetup_detail_open" :framed="true" @close="ui.gamesetup_detail_open=false">
      <InfoPanel :gameOptions="gameOptions" :playerNumber="playerNumber" :lastSoloGeneration="lastSoloGeneration" :deckSize="deckSize" :discardPileSize="discardPileSize" :otherDeckSizes="otherDeckSizes" :spectatorId="spectatorId" :expectedPurgeTimeMs="expectedPurgeTimeMs" @close="ui.gamesetup_detail_open=false" />
    </SidebarModal>
  </div>

  <!-- Help as a modal instead of in a new window -->
  <!-- Modal inside the tile: it grows out of it (SidebarModal anchor). Clicks inside the modal don't reach the tile: teleported to body -->
  <div class="sidebar_item sidebar_item--help" @click="ui.help_open = true">
    <i class="sidebar_icon sidebar_icon--help" :class="{'sidebar_item--is-active': ui.help_open}" :title="$t('player aid')"></i>
    <SidebarModal :open="ui.help_open" :wide="true" :bare="true" @close="ui.help_open = false">
      <HelpOverlay :closable="true" @close="ui.help_open = false"/>
    </SidebarModal>
  </div>

  <PreferencesIcon/>
</div>
</template>

<script lang="ts">

import {defineAsyncComponent, defineComponent} from 'vue';
import SidebarModal from '@/client/components/SidebarModal.vue';
import {Color} from '@/common/Color';
import {getPreferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import {TurmoilModel} from '@/common/models/TurmoilModel';
import {PartyName} from '@/common/turmoil/PartyName';
import InfoPanel from '@/client/components/InfoPanel.vue';
import {GameOptionsModel} from '@/common/models/GameOptionsModel';
import {OtherDeckSizesModel} from '@/common/models/GameModel';
import GlobalParameterValue from '@/client/components/GlobalParameterValue.vue';
import MoonGlobalParameterValue from '@/client/components/moon/MoonGlobalParameterValue.vue';
import {GlobalParameter} from '@/common/GlobalParameter';
import {MoonModel} from '@/common/models/MoonModel';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import LanguageIcon from '@/client/components/LanguageIcon.vue';

export default defineComponent({
  name: 'Sidebar',
  props: {
    playerNumber: {
      type: Number,
      required: true,
    },
    gameOptions: {
      type: Object as () => GameOptionsModel,
      required: true,
    },
    actingPlayer: {
      type: Boolean,
    },
    playerColor: {
      type: String as () => Color,
      required: true,
    },
    coloniesCount: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    oxygen: {
      type: Number,
      required: true,
    },
    oceans: {
      type: Number,
      required: true,
    },
    venus: {
      type: Number,
      required: true,
    },
    moonData: {
      type: Object as () => MoonModel | undefined,
    },
    turmoil: {
      type: Object as () => TurmoilModel | undefined,
    },
    lastSoloGeneration: {
      type: Number,
      required: true,
    },
    deckSize: {
      type: Number,
      required: true,
    },
    discardPileSize: {
      type: Number,
      required: true,
    },
    // For the info window (spectator link, deletion warning)
    spectatorId: {
      type: String,
      required: false,
    },
    expectedPurgeTimeMs: {
      type: Number,
      required: false,
    },
    otherDeckSizes: {
      type: Object as () => OtherDeckSizesModel,
      required: true,
    },
  },
  components: {
    InfoPanel,
    GlobalParameterValue,
    MoonGlobalParameterValue,
    PreferencesIcon,
    LanguageIcon,
    SidebarModal,
    // Load help only on demand (own chunk like the help page in App.vue)
    HelpOverlay: defineAsyncComponent(() => import(/* webpackChunkName: "help" */ '@/client/components/helpOverlay/HelpOverlay.vue')),
  },
  data() {
    return {
      'ui': {
        'gamesetup_detail_open': false,
        'help_open': false,
      },
      'globalParameter': GlobalParameter,
    };
  },
  methods: {
    getPlayerColorCubeClass(): string {
      return this.actingPlayer && (getPreferences().hide_animated_sidebar === false) ? 'preferences_player_inner active' : 'preferences_player_inner';
    },
    getSideBarClass(): string {
      return this.actingPlayer && (getPreferences().hide_animated_sidebar === false) ? 'preferences_acting_player' : 'preferences_nonacting_player';
    },
    rulingPartyToCss(): string {
      if (this.turmoil?.ruling === undefined) {
        console.warn('no party provided');
        return '';
      }
      return this.turmoil.ruling.toLowerCase().split(' ').join('_');
    },
    getRulingParty(): string {
      const ruling = this.turmoil?.ruling;
      switch (ruling) {
      case PartyName.MARS:
        return 'Mars';
      case PartyName.SCIENTISTS:
        return 'Science';
      case PartyName.KELVINISTS:
        return 'Kelvin';
      case undefined:
        return '???';
      default:
        return ruling;
      }
    },
  },
  computed: {
    preferencesManager(): PreferencesManager {
      return PreferencesManager.INSTANCE;
    },
  },
});

</script>
