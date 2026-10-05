<template>
  <div :class="'topmost-'+screen">
    <RotateHint/>
    <section>
      <dialog id="alert-dialog" class="alert-dialog">
        <form method="dialog">
          <p id="alert-dialog-title" class="title" v-i18n>Error with input</p>
          <p id="alert-dialog-message"></p>
          <menu class="dialog-menu centered-content">
            <button id="alert-dialog-button" class="btn btn-lg btn-primary">OK</button>
          </menu>
        </form>
      </dialog>
    </section>
    <div class="main-container">
      <StartScreen v-if="screen === 'start-screen'"/>
      <CreateGameForm
        v-else-if="screen === 'create-game-form'"
      />
      <LoadGameForm v-else-if="screen === 'load'"/>
      <GameHome
        v-else-if="screen === 'game-home' && game !== undefined"
        :game="game"
      />
      <!-- Touch devices (phone, tablet) get the mobile view, see mobileLayout.ts -->
      <MobilePlayerHome
        v-else-if="screen === 'player-home' && playerView !== undefined && isMobileLayout"
        :player-view="playerView"
        :key="'mobile-' + playerkey"
      />
      <PlayerHome
        v-else-if="screen === 'player-home' && playerView !== undefined"
        :player-view="playerView"
        :key="playerkey"
      />
      <MobileSpectatorHome
        v-else-if="screen === 'spectator-home' && spectator !== undefined && isMobileLayout"
        :spectator="spectator"
        :key="'mobile-spectator-' + playerkey"
      />
      <SpectatorHome
        v-else-if="screen === 'spectator-home' && spectator !== undefined"
        :spectator="spectator"
        :key="'spectator-' + playerkey"
      />
      <GameEnd
        v-else-if="screen === 'the-end' && participant !== undefined"
        :participant="participant"
      />
      <GamesOverview
        v-else-if="screen === 'games-overview'"
      />
      <CardList v-else-if="screen === 'cards'"/>
      <StatsPage v-else-if="screen === 'stats'"/>
      <AdminHome v-else-if="screen === 'admin'"/>
      <LoginHome v-else-if="screen === 'login-home'"/>
      <HelpOverlay v-else-if="screen === 'help'"/>
    </div>
    <!-- In game views the notice sits in the sidebar's info window; on the results page it is dropped (Jens' request) -->
    <footer v-if="screen !== 'player-home' && screen !== 'spectator-home' && screen !== 'the-end'" class="notice" :class="{'notice--split': screen === 'start-screen'}">
      <!-- On "Create game", changelog and Discord belong in the footer too (the start page has its own buttons for them) -->
      <template v-if="screen === 'create-game-form'">
        <a :href="changelogUrl" target="_blank" v-i18n>Read our changelog to get the latest updates.</a>
        <span>(<span v-i18n>Looking for people to play with</span>? <a :href="discordInvite" target="_blank" v-i18n>Join us on Discord</a>.)</span>
      </template>
      <StartScreenFooter v-if="screen === 'start-screen'"/>
      <span v-i18n>Not affiliated with FryxGames, Asmodee Digital or Steam in any way.</span>
    </footer>
  </div>
</template>

<script lang="ts">
import {defineAsyncComponent, defineComponent} from 'vue';
import * as constants from '@/common/constants';
import {WIKI_URLS} from '@/client/utils/WikiLinks';

const AdminHome = defineAsyncComponent(() => import(/* webpackChunkName: "admin" */ '@/client/components/admin/AdminHome.vue'));
const CardList = defineAsyncComponent(() => import(/* webpackChunkName: "card-list" */ '@/client/components/cardlist/CardList.vue'));
const CreateGameForm = defineAsyncComponent(() => import(/* webpackChunkName: "create-game" */ '@/client/components/create/CreateGameForm.vue'));
const GameEnd = defineAsyncComponent(() => import(/* webpackChunkName: "game-end" */ '@/client/components/GameEnd.vue'));
const GameHome = defineAsyncComponent(() => import(/* webpackChunkName: "game-home" */ '@/client/components/GameHome.vue'));
const GamesOverview = defineAsyncComponent(() => import(/* webpackChunkName: "games-overview" */ '@/client/components/GamesOverview.vue'));
// Fork: new help with page tree and search; the upstream content lives inside it
const HelpOverlay = defineAsyncComponent(() => import(/* webpackChunkName: "help" */ '@/client/components/helpOverlay/HelpOverlay.vue'));
const LoginHome = defineAsyncComponent(() => import(/* webpackChunkName: "login" */ '@/client/components/auth/LoginHome.vue'));
const LoadGameForm = defineAsyncComponent(() => import(/* webpackChunkName: "load-game" */ '@/client/components/LoadGameForm.vue'));
const PlayerHome = defineAsyncComponent(() => import(/* webpackChunkName: "player-home" */ '@/client/components/PlayerHome.vue'));
const MobilePlayerHome = defineAsyncComponent(() => import(/* webpackChunkName: "mobile-player-home" */ '@/client/components/mobile/MobilePlayerHome.vue'));
const MobileSpectatorHome = defineAsyncComponent(() => import(/* webpackChunkName: "mobile-spectator-home" */ '@/client/components/mobile/MobileSpectatorHome.vue'));
const SpectatorHome = defineAsyncComponent(() => import(/* webpackChunkName: "spectator-home" */ '@/client/components/SpectatorHome.vue'));
const StatsPage = defineAsyncComponent(() => import(/* webpackChunkName: "stats" */ '@/client/components/stats/StatsPage.vue'));
const StartScreenFooter = defineAsyncComponent(() => import(/* webpackChunkName: "start-screen" */ '@/client/components/StartScreenFooter.vue'));
const StartScreen = defineAsyncComponent(() => import(/* webpackChunkName: "start-screen" */ '@/client/components/StartScreen.vue'));
import {$t, setTranslationContext} from '@/client/directives/i18n';
import {paths} from '@/common/app/paths';
import {PlayerViewModel, ViewModel} from '@/common/models/PlayerModel';
import {SimpleGameModel} from '@/common/models/SimpleGameModel';
import {SpectatorModel} from '@/common/models/SpectatorModel';
import {isPlayerId, isSpectatorId} from '@/common/Types';
import {hasShowModal, showModal, windowHasHTMLDialogElement} from './HTMLDialogElementCompatibility';

import dialogPolyfill from 'dialog-polyfill';
import {initMobileLayout, mobileLayout} from '@/client/utils/mobileLayout';
import RotateHint from '@/client/components/RotateHint.vue';
import {setDocumentTitle} from '../utils/documentTitle';
import {ingestView} from '@/client/utils/changeTracker';

type Screen = 'admin' |
            'create-game-form' |
            'cards' |
            'empty' |
            'game-home' |
            'games-overview' |
            'help' |
            'load' |
            'login-home' |
            'player-home' |
            'spectator-home' |
            'start-screen' |
            'stats' |
            'the-end';
export type MainAppData = {
    screen: Screen;
    /**
     * player or spectator are set once the app component has loaded.
     * Vue only watches properties that exist initially. When we
     * use this property we can't trigger vue state without
     * a refactor.
     */
    spectator?: SpectatorModel;
    playerView?: PlayerViewModel;
    // playerKey might seem to serve no function, but it's basically an arbitrary value used
    // to force a rerender / refresh.
    // See https://michaelnthiessen.com/force-re-render/
    playerkey: number;
    isServerSideRequestInProgress: boolean;
    componentsVisibility: {[x: string]: boolean};
    game: SimpleGameModel | undefined;
    login: string | undefined;
}

// NOTE: this simplistic truncation to the last segment might cause issues if
// this page starts supporting paths more than one level deep.
function getLastPathSegment() {
  // Leave only the last part of /path
  return window.location.pathname.replace(/.*\//g, '');
}

export default defineComponent({
  name: 'App',
  data(): MainAppData {
    return {
      screen: 'empty',
      playerkey: 0,
      isServerSideRequestInProgress: false,
      componentsVisibility: {
        'milestones': true,
        'awards_list': true,
        'pinned_player_0': false,
        'pinned_player_1': false,
        'pinned_player_2': false,
        'pinned_player_3': false,
        'pinned_player_4': false,
        'turmoil_parties': false,
      } as {[x: string]: boolean},
      game: undefined as SimpleGameModel | undefined,
      playerView: undefined,
      spectator: undefined,
      login: undefined,
    };
  },
  components: {
    RotateHint,
    StartScreen,
    StartScreenFooter,
    CreateGameForm,
    LoadGameForm,
    GameHome,
    PlayerHome,
    MobilePlayerHome,
    MobileSpectatorHome,
    SpectatorHome,
    GameEnd,
    GamesOverview,
    CardList,
    StatsPage,
    HelpOverlay,
    AdminHome,
    LoginHome,
  },
  computed: {
    changelogUrl(): string {
      return WIKI_URLS.changelog;
    },
    discordInvite(): string {
      return constants.DISCORD_INVITE;
    },
    isMobileLayout(): boolean {
      return mobileLayout.value;
    },
    participant(): ViewModel | undefined {
      return this.playerView ?? this.spectator;
    },
  },
  methods: {
    showAlert(title: string, message: string, cb: () => void = () => {}): void {
      const dialogElement: HTMLElement | null = document.getElementById('alert-dialog');
      const buttonElement: HTMLElement | null = document.getElementById('alert-dialog-button');
      const messageElement: HTMLElement | null = document.getElementById('alert-dialog-message');
      const titleElement: HTMLElement | null = document.getElementById('alert-dialog-title');
      if (buttonElement !== null && titleElement !== null && messageElement !== null && dialogElement !== null && hasShowModal(dialogElement)) {
        messageElement.innerHTML = $t(message);
        titleElement.textContent = $t(title);
        const handler = () => {
          buttonElement.removeEventListener('click', handler);
          cb();
        };
        buttonElement.addEventListener('click', handler);
        showModal(dialogElement);
      } else {
        alert(message);
        cb();
      }
    },
    setVisibilityState(targetVar: string, isVisible: boolean) {
      if (isVisible === this.getVisibilityState(targetVar)) {
        return;
      }
      (this as unknown as MainAppData).componentsVisibility[targetVar] = isVisible;
    },
    getVisibilityState(targetVar: string): boolean {
      return (this as unknown as MainAppData).componentsVisibility[targetVar] ? true : false;
    },
    update(path: typeof paths.PLAYER | typeof paths.SPECTATOR): void {
      const currentPathname = getLastPathSegment();
      const app = this as unknown as MainAppData;
      // If the game ends while the view is open, it stays: the floating notice (GameOverNotice)
      // redirects to the results page itself. Only when opening a finished game do we go there directly.
      const alreadyShowingGame = app.screen === 'player-home' || app.screen === 'spectator-home';

      const url = 'api/' + path + window.location.search.replace('&noredirect', '');

      fetch(url)
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`Error getting game data: ${resp.statusText}`);
          }
          return resp.json();
        })
        .then((model: ViewModel) => {
          // Polled updates come from other players' moves (own moves arrive via WaitingFor.updatePlayerView)
          ingestView(model, 'remote');
          if (path === paths.PLAYER) {
            app.playerView = model as PlayerViewModel;
            setTranslationContext(app.playerView);
          } else if (path === paths.SPECTATOR) {
            app.spectator = model as SpectatorModel;
          }
          app.playerkey++;
          if (
            model.game.phase === 'end' &&
              !alreadyShowingGame &&
              window.location.search.includes('&noredirect') === false
          ) {
            app.screen = 'the-end';
            if (currentPathname !== paths.THE_END) {
              window.history.replaceState(
                model,
                `${constants.APP_NAME} - Player`,
                `${paths.THE_END}?id=${model.id}`,
              );
            }
          } else {
            if (path === paths.PLAYER) {
              app.screen = 'player-home';
            } else if (path === paths.SPECTATOR) {
              app.screen = 'spectator-home';
            }
            if (currentPathname !== path) {
              window.history.replaceState(
                model,
                `${constants.APP_NAME} - Game`,
                `${path}?id=${model.id}`,
              );
            }
          }
        })
        .catch((err) => {
          this.showAlert('Error', 'Error getting game data');
          console.error(err);
        });
    },
    updatePlayer() {
      this.update(paths.PLAYER);
    },
    updateSpectator() {
      this.update(paths.SPECTATOR);
    },
  },
  created() {
    initMobileLayout();
  },
  mounted() {
    setDocumentTitle();
    if (!windowHasHTMLDialogElement()) {
      dialogPolyfill.registerDialog(document.getElementById('alert-dialog') as HTMLDialogElement);
    }
    const currentPathname = getLastPathSegment();
    const app = this as unknown as MainAppData & {updatePlayer(): void; updateSpectator(): void};
    if (currentPathname === paths.PLAYER) {
      app.updatePlayer();
    } else if (currentPathname === paths.THE_END) {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id') || '';
      if (isPlayerId(id)) {
        app.updatePlayer();
      } else if (isSpectatorId(id)) {
        app.updateSpectator();
      } else {
        this.showAlert('Error', 'Bad id URL parameter.');
      }
    } else if (currentPathname === paths.GAME) {
      const url = paths.API_GAME + window.location.search;
      fetch(url)
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`Error getting game data: ${resp.statusText}`);
          }
          return resp.json();
        })
        .then((appGame: SimpleGameModel) => {
          app.screen = 'game-home';
          app.game = appGame;
          window.history.replaceState(
            appGame,
            `${constants.APP_NAME} - Game`,
            `${paths.GAME}?id=${appGame.id}`,
          );
        })
        .catch((err) => {
          this.showAlert('Error', 'Error getting game data');
          console.error(err);
        });
    } else if (currentPathname === paths.GAMES_OVERVIEW) {
      app.screen = 'games-overview';
    } else if (currentPathname === paths.NEW_GAME) {
      app.screen = 'create-game-form';
    } else if (currentPathname === paths.LOAD) {
      app.screen = 'load';
    } else if (currentPathname === paths.CARDS) {
      app.screen = 'cards';
    } else if (currentPathname === paths.STATS) {
      app.screen = 'stats';
    } else if (currentPathname === paths.HELP) {
      app.screen = 'help';
    } else if (currentPathname === paths.SPECTATOR) {
      app.updateSpectator();
    } else if (currentPathname === paths.ADMIN) {
      app.screen = 'admin';
    } else if (currentPathname === paths.LOGIN) {
      app.screen = 'login-home';
    } else {
      app.screen = 'start-screen';
    }
  },
});
</script>
