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
  <!-- Display only, below the buttons and visibly not a button: own player cube and pile sizes.
       Spectators (neutral colour) have no own cube. -->
  <div class="sidebar-status" :title="$t('Draw pile') + ' / ' + $t('Discard pile')">
    <span v-if="playerColor !== 'neutral'" class="sidebar-status-cube" :title="$t('Player Color Cube')">
      <PlayerCube :color="playerColor" view="iso" :size="20"/>
    </span>
    <span class="sidebar-status-piles">
      <span class="sidebar-status-pile">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor"/></svg>{{ deckSize }}
      </span>
      <span class="sidebar-status-pile">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>{{ discardPileSize }}
      </span>
    </span>
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
import PlayerCube from '@/client/components/common/PlayerCube.vue';
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
    PlayerCube,
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
