<template>
  <div id="spectator-home" :class="['mb-home', 'mb-home--spectator', 'mb-home--' + screen]">
    <!-- Mobile view for spectators: the same building blocks as MobilePlayerHome, without hand, turn and own money -->
    <MobileHeader :game="game" @click="go('players')" :aria-label="$t('Players')"/>

    <main class="mb-main">
      <MobileMarsScreen v-show="screen === 'mars'" ref="gameBoardView"
        :game="game" :players="spectator.players" :participantId="spectator.id" :tileView="tileView"
        :acting="false" :bannerTitle="bannerTitle"
        @toggleTileView="cycleTileView()" @showMilestones="showMilestones"/>

      <!-- From three players on, the tables scroll horizontally beneath fixed icon columns (mobile.less) -->
      <section v-show="screen === 'players'" :class="['mb-screen', 'mb-screen--players', {'mb-screen--players-scroll': spectator.players.length > 2}]"
        @scroll.capture="markHorizontalScroll">
        <MobilePlayersPanel :viewModel="spectator" v-model:segment="playersSegment"/>
      </section>

      <section v-show="screen === 'log'" class="mb-screen mb-screen--log">
        <LogPanel :viewModel="spectator" zoomCarousel @spaceClicked="showSpace"/>
      </section>
    </main>

    <MobileNav :items="navItems" :active="screen" @navigate="go"/>
    <!-- Polls the server regularly for updates (like the desktop spectator view) -->
    <WaitingFor v-show="false" v-if="game.phase !== 'end'" :playerView="spectator" :waitingfor="undefined"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {SpectatorModel} from '@/common/models/SpectatorModel';
import {Phase} from '@/common/Phase';
import {SpaceId} from '@/common/Types';
import {HomeMixin} from '@/client/mixins/HomeMixin';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import MobileHeader from '@/client/components/mobile/MobileHeader.vue';
import MobileMarsScreen from '@/client/components/mobile/MobileMarsScreen.vue';
import MobileNav from '@/client/components/mobile/MobileNav.vue';
import MobilePlayersPanel from '@/client/components/mobile/MobilePlayersPanel.vue';
import {MobileNavItem, MobileScreen, PlayersSegment, SPECTATOR_NAV} from '@/client/components/mobile/mobileScreens';
import {markHorizontalScroll} from '@/client/components/mobile/horizontalScroll';
import {playersToWaitFor} from '@/client/utils/playersToWaitFor';

// Selected screen; App.vue rebuilds the view on every server update (key), and it should survive that
let rememberedScreen: MobileScreen = 'mars';

export default defineComponent({
  name: 'MobileSpectatorHome',
  mixins: [HomeMixin],
  props: {
    spectator: {
      type: Object as () => SpectatorModel,
      required: true,
    },
  },
  data(): {screen: MobileScreen, playersSegment: PlayersSegment} {
    return {
      screen: rememberedScreen,
      playersSegment: 'players',
    };
  },
  components: {
    LogPanel,
    WaitingFor,
    MobileHeader,
    MobileMarsScreen,
    MobileNav,
    MobilePlayersPanel,
  },
  computed: {
    game(): GameModel {
      return this.spectator.game;
    },
    navItems(): ReadonlyArray<MobileNavItem> {
      return SPECTATOR_NAV;
    },
    // Only existing translations: whose turn it is, or game end
    bannerTitle(): string {
      if (this.game.phase === Phase.END) {
        return this.$t('This game is over!');
      }
      const names = playersToWaitFor(this.spectator).map((player) => player.name);
      return names.length === 0 ? this.$t('Waiting for other players') : names.join(', ') + ' ' + this.$t('is taking their turn');
    },
  },
  methods: {
    markHorizontalScroll,
    go(screen: MobileScreen) {
      this.screen = screen;
      rememberedScreen = screen;
      window.scrollTo({top: 0});
    },
    showMilestones() {
      this.playersSegment = 'ma';
      this.go('players');
    },
    showSpace(spaceId: SpaceId) {
      this.go('mars');
      this.onSpaceClicked(spaceId);
    },
  },
});
</script>
