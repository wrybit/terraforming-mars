<template>
  <div :class="'topmost-'+screen">
    <RotateHint/>
    <AppBackground v-if="hasBackground" :always="screen === 'start-screen'" :show-credit="hasBackgroundCredit"/>
    <ServerUpdateOverlay/>
    <RenderErrorBanner/>
    <!-- Rating of AI decisions (analysis games): outside the game view, so updates never close it -->
    <AiDecisionDialog/>
    <!-- Analysis game: introduction to rating, once per browser at the end of the first generation -->
    <AiAnalysisWelcome v-if="screen === 'player-home'" :player-view="playerView"/>
    <!-- Optional extensions (src/extensions/): each may bring one root component -->
    <component :is="extension.component" v-for="extension in componentExtensions" :key="extension.name" :view="participant"/>
    <section>
      <dialog id="alert-dialog" class="alert-dialog">
        <form method="dialog">
          <p id="alert-dialog-title" class="title" v-i18n>Error with input</p>
          <p id="alert-dialog-message" class="alert-dialog-message"></p>
          <menu class="dialog-menu centered-content">
            <button id="alert-dialog-button" class="btn btn-lg btn-primary" v-i18n>OK</button>
          </menu>
        </form>
      </dialog>
    </section>
    <div class="main-container">
      <StartScreen v-if="screen === 'start-screen'"/>
      <CreateGameForm
        v-else-if="screen === 'create-game-form'"
      />
      <GameHome
        v-else-if="screen === 'game-home' && game !== undefined"
        :game="game"
      />
      <!-- Touch devices (phone, tablet) get the mobile view, see mobileLayout.ts -->
      <MobilePlayerHome
        v-else-if="screen === 'player-home' && playerView !== undefined && isMobileLayout"
        :player-view="playerView"
      />
      <PlayerHome
        v-else-if="screen === 'player-home' && playerView !== undefined"
        :player-view="playerView"
      />
      <MobileSpectatorHome
        v-else-if="screen === 'spectator-home' && spectator !== undefined && isMobileLayout"
        :spectator="spectator"
      />
      <SpectatorHome
        v-else-if="screen === 'spectator-home' && spectator !== undefined"
        :spectator="spectator"
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
      <AdminHome v-else-if="screen === 'admin-settings'"/>
      <AdminRaw v-else-if="screen === 'admin-raw'"/>
      <AdminDashboard v-else-if="screen === 'admin-dashboard'"/>
      <LoginHome v-else-if="screen === 'login-home'"/>
      <HelpOverlay v-else-if="screen === 'help'"/>
    </div>
    <!-- In game views the notice sits in the sidebar's info window; on the results page it is dropped (Jens' request) -->
    <!-- Start page and "Create game" share the same footer (Jens' request): build facts left, notice right -->
    <footer v-if="screen !== 'player-home' && screen !== 'spectator-home' && screen !== 'the-end'" class="notice" :class="{'notice--split': hasStartScreenFooter, 'notice--online': screen === 'start-screen'}">
      <StartScreenFooter v-if="hasStartScreenFooter"/>
      <!-- Start page: how many are playing right now, in the middle of the footer -->
      <OnlinePlayers v-if="screen === 'start-screen'"/>
      <FanProjectNotice/>
    </footer>
  </div>
</template>

<script lang="ts">
import {defineAsyncComponent, defineComponent} from 'vue';
import * as constants from '@/common/constants';

const AdminHome = defineAsyncComponent(() => import(/* webpackChunkName: "admin" */ '@/client/components/admin/AdminHome.vue'));
const AdminRaw = defineAsyncComponent(() => import(/* webpackChunkName: "admin" */ '@/client/components/admin/AdminRaw.vue'));
const AdminDashboard = defineAsyncComponent(() => import(/* webpackChunkName: "admin" */ '@/client/components/admin/AdminDashboard.vue'));
const CardList = defineAsyncComponent(() => import(/* webpackChunkName: "card-list" */ '@/client/components/cardlist/CardList.vue'));
const CreateGameForm = defineAsyncComponent(() => import(/* webpackChunkName: "create-game" */ '@/client/components/create/CreateGameForm.vue'));
const GameEnd = defineAsyncComponent(() => import(/* webpackChunkName: "game-end" */ '@/client/components/GameEnd.vue'));
const GameHome = defineAsyncComponent(() => import(/* webpackChunkName: "game-home" */ '@/client/components/GameHome.vue'));
const GamesOverview = defineAsyncComponent(() => import(/* webpackChunkName: "games-overview" */ '@/client/components/GamesOverview.vue'));
// Fork: new help with page tree and search; the upstream content lives inside it
const HelpOverlay = defineAsyncComponent(() => import(/* webpackChunkName: "help" */ '@/client/components/helpOverlay/HelpOverlay.vue'));
const LoginHome = defineAsyncComponent(() => import(/* webpackChunkName: "login" */ '@/client/components/auth/LoginHome.vue'));
const PlayerHome = defineAsyncComponent(() => import(/* webpackChunkName: "player-home" */ '@/client/components/PlayerHome.vue'));
const MobilePlayerHome = defineAsyncComponent(() => import(/* webpackChunkName: "mobile-player-home" */ '@/client/components/mobile/MobilePlayerHome.vue'));
const MobileSpectatorHome = defineAsyncComponent(() => import(/* webpackChunkName: "mobile-spectator-home" */ '@/client/components/mobile/MobileSpectatorHome.vue'));
const SpectatorHome = defineAsyncComponent(() => import(/* webpackChunkName: "spectator-home" */ '@/client/components/SpectatorHome.vue'));
const StatsPage = defineAsyncComponent(() => import(/* webpackChunkName: "stats" */ '@/client/components/stats/StatsPage.vue'));
const StartScreenFooter = defineAsyncComponent(() => import(/* webpackChunkName: "start-screen" */ '@/client/components/StartScreenFooter.vue'));
const OnlinePlayers = defineAsyncComponent(() => import(/* webpackChunkName: "start-screen" */ '@/client/components/OnlinePlayers.vue'));
const StartScreen = defineAsyncComponent(() => import(/* webpackChunkName: "start-screen" */ '@/client/components/StartScreen.vue'));
import {$t, setTranslationContext, translateTextWithParams} from '@/client/directives/i18n';
import {paths} from '@/common/app/paths';
import {PlayerViewModel, ViewModel} from '@/common/models/PlayerModel';
import {SimpleGameModel} from '@/common/models/SimpleGameModel';
import {SpectatorModel} from '@/common/models/SpectatorModel';
import {isPlayerId, isSpectatorId} from '@/common/Types';
import {hasShowModal, showModal, windowHasHTMLDialogElement} from './HTMLDialogElementCompatibility';

import dialogPolyfill from 'dialog-polyfill';
import {initMobileLayout, mobileLayout} from '@/client/utils/mobileLayout';
import RotateHint from '@/client/components/RotateHint.vue';
import AppBackground from '@/client/components/AppBackground.vue';
import ServerUpdateOverlay from '@/client/components/common/ServerUpdateOverlay.vue';
import RenderErrorBanner from '@/client/components/common/RenderErrorBanner.vue';
import AiDecisionDialog from '@/client/components/logpanel/aiAnalysis/AiDecisionDialog.vue';
import AiAnalysisWelcome from '@/client/components/logpanel/aiAnalysis/AiAnalysisWelcome.vue';
import {CLIENT_EXTENSIONS} from '@/genfiles/extensionsClient';
import {ClientExtension} from '@/client/extensions/ClientExtension';
import {serverUpdatePhase, startServerStatusPolling} from '@/client/utils/serverStatus';
import FanProjectNotice from '@/client/components/common/FanProjectNotice.vue';
import {setDocumentTitle} from '../utils/documentTitle';
import {ingestView} from '@/client/utils/changeTracker';
import {fetchOrFail} from '@/client/utils/requestFailure';
import {describeGameLoadFailure} from '@/client/utils/gameLoadFailure';


type Screen = 'admin-settings' |
            'admin-raw' |
            'admin-dashboard' |
            'create-game-form' |
            'cards' |
            'empty' |
            'game-home' |
            'games-overview' |
            'help' |
            'login-home' |
            'player-home' |
            'spectator-home' |
            'start-screen' |
            'stats' |
            'the-end';
// Screens shown on the Milky Way background (AppBackground.vue); the rest keeps the plain page color
const SCREENS_WITH_BACKGROUND: ReadonlyArray<Screen> = [
  'start-screen', 'create-game-form', 'game-home', 'player-home', 'spectator-home', 'the-end', 'games-overview', 'cards', 'stats',
];
// Image credit only where the top right corner is free; all other views have their own page header there
const SCREENS_WITH_BACKGROUND_CREDIT: ReadonlyArray<Screen> = [
  'start-screen',
];

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
    FanProjectNotice,
    RotateHint,
    AppBackground,
    ServerUpdateOverlay,
    RenderErrorBanner,
    AiDecisionDialog,
    AiAnalysisWelcome,
    StartScreen,
    StartScreenFooter,
    OnlinePlayers,
    CreateGameForm,
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
    AdminRaw,
    AdminDashboard,
    LoginHome,
  },
  computed: {
    hasBackground(): boolean {
      return SCREENS_WITH_BACKGROUND.includes(this.screen);
    },
    hasBackgroundCredit(): boolean {
      return SCREENS_WITH_BACKGROUND_CREDIT.includes(this.screen);
    },
    hasStartScreenFooter(): boolean {
      return this.screen === 'start-screen' || this.screen === 'create-game-form';
    },
    isMobileLayout(): boolean {
      return mobileLayout.value;
    },
    participant(): ViewModel | undefined {
      return this.playerView ?? this.spectator;
    },
    componentExtensions(): ReadonlyArray<ClientExtension> {
      return CLIENT_EXTENSIONS.filter((extension) => extension.component !== undefined);
    },
  },
  methods: {
    async showGameLoadError(err: unknown): Promise<void> {
      console.error(err);
      const id = new URLSearchParams(window.location.search).get('id') ?? '';
      const report = await describeGameLoadFailure(id, err);
      this.showAlert(report.title, {text: report.text}, report.leadsToStartPage ? () => window.location.assign('./') : undefined);
    },
    /** message: englischer Schluessel (wird uebersetzt) oder {text}: fertig uebersetzter Text mit Details */
    showAlert(title: string, message: string | {text: string}, cb: () => void = () => {}): void {
      const messageText = typeof message === 'string' ? $t(message) : message.text;
      // During a server update the overlay explains the situation; connection errors are expected then
      if (serverUpdatePhase.value !== 'none') {
        return;
      }
      const dialogElement: HTMLElement | null = document.getElementById('alert-dialog');
      const buttonElement: HTMLElement | null = document.getElementById('alert-dialog-button');
      const messageElement: HTMLElement | null = document.getElementById('alert-dialog-message');
      const titleElement: HTMLElement | null = document.getElementById('alert-dialog-title');
      if (buttonElement !== null && titleElement !== null && messageElement !== null && dialogElement !== null && hasShowModal(dialogElement)) {
        // textContent: Meldungen enthalten IDs aus der Adresse und Server-Texte – nie als HTML auswerten
        messageElement.textContent = messageText;
        titleElement.textContent = $t(title);
        const handler = () => {
          buttonElement.removeEventListener('click', handler);
          cb();
        };
        buttonElement.addEventListener('click', handler);
        showModal(dialogElement);
      } else {
        alert(messageText);
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

      fetchOrFail(url)
        .then((resp) => resp.json())
        .then((model: ViewModel) => {
          // Polled updates come from other players' moves (own moves arrive via WaitingFor.updatePlayerView)
          ingestView(model, 'remote');
          if (path === paths.PLAYER) {
            app.playerView = model as PlayerViewModel;
            setTranslationContext(app.playerView);
          } else if (path === paths.SPECTATOR) {
            app.spectator = model as SpectatorModel;
          }
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
          this.showGameLoadError(err);
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
    // Game pages send their id, so the server knows somebody is playing (no automatic update then)
    const pageId = new URLSearchParams(window.location.search).get('id') ?? '';
    startServerStatusPolling(isPlayerId(pageId) || isSpectatorId(pageId) ? pageId : undefined);
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
        this.showAlert('Invalid link', {text: translateTextWithParams('The address contains no valid player or spectator ID ("${0}"). These IDs start with p (player) or s (spectator). Check whether the link was copied completely.', [id])});
      }
    } else if (currentPathname === paths.GAME) {
      const url = paths.API_GAME + window.location.search;
      fetchOrFail(url)
        .then((resp) => resp.json())
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
          this.showGameLoadError(err);
        });
    } else if (currentPathname === paths.GAMES_OVERVIEW || currentPathname === paths.LOAD) {
      // Loading a game lives in the games overview now; the old address still leads there
      app.screen = 'games-overview';
    } else if (currentPathname === paths.NEW_GAME) {
      app.screen = 'create-game-form';
    } else if (currentPathname === paths.CARDS) {
      app.screen = 'cards';
    } else if (currentPathname === paths.STATS) {
      app.screen = 'stats';
    } else if (currentPathname === paths.HELP) {
      app.screen = 'help';
    } else if (currentPathname === paths.SPECTATOR) {
      app.updateSpectator();
    } else if (currentPathname === paths.ADMIN_SETTINGS) {
      app.screen = 'admin-settings';
    } else if (currentPathname === paths.ADMIN_RAW) {
      app.screen = 'admin-raw';
    } else if (currentPathname === paths.ADMIN || currentPathname === paths.ADMIN_DASHBOARD) {
      // The admin always opens on the dashboard (/admin and the menu entry)
      app.screen = 'admin-dashboard';
    } else if (currentPathname === paths.LOGIN) {
      app.screen = 'login-home';
    } else {
      app.screen = 'start-screen';
    }
  },
});
</script>
