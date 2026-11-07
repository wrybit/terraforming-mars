<template>
  <div id="lobby" class="lobby" :class="{'lobby--waiting': myRoom !== undefined && myRoom.state === 'open' && !roomOpen}">
    <!-- Header like "Create game": menu, title, then the own profile and the one way to open a game -->
    <header class="card-list-header card-list-header--plain lobby-head">
      <PageToolbar />
      <PageTitle title="Game lobby" />
      <div class="create-game-head-actions">
        <button type="button" class="create-game-icon-button lobby-profile-button" :title="$t('Your profile')" @click="profileOpen = true">
          <LobbyAvatar kind="human" :color="profile.color" :emoji="profile.emoji" :image="profile.image" size="small" />
          <span class="create-game-head-label">{{ profile.name }}</span>
          <!-- The arrow says: this opens something (the profile) -->
          <svg class="lobby-profile-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          <!-- Phone: pencil on the profile picture instead of name and arrow -->
          <span class="lobby-profile-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20l4-1 10-10-3-3L5 16z" /></svg></span>
        </button>
        <!-- The only way to open a game; on phones only the plus remains -->
        <!-- Same shortcut as the create button in the form (Mod + Enter): once to open it, once more to create.
             While the form is open only its button carries the shortcut (the dispatcher takes the first one it finds) -->
        <button type="button" class="btn btn-rounded lobby-open-button" :data-hotkey="createOpen ? undefined : 'create-game'" :title="$t('Create game')" @click="openCreate()">
          <!-- A board hex with a plus: a new game -->
          <svg class="lobby-open-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" /><path d="M12 9v6M9 12h6" /></svg>
          <span class="lobby-open-label" v-i18n>Create game</span>
          <HotkeyKeys action="create-game" class="lobby-open-keys" />
        </button>
      </div>
    </header>

    <main class="lobby-layout">
      <div class="lobby-main">
        <section class="create-game-card lobby-list-card">
          <div class="lobby-tools">
            <label class="card-list-search lobby-search">
              <span class="card-list-search-icon" aria-hidden="true"></span>
              <input class="card-list-search-input" type="search" v-model="search" :placeholder="$t('Search game or player')">
            </label>
            <button type="button" class="create-game-icon-button lobby-filter-toggle" :class="{'lobby-filter-toggle--open': filtersOpen}"
              :aria-expanded="filtersOpen" @click="filtersOpen = !filtersOpen">
              <span class="card-list-filter-toggle-icon" aria-hidden="true"></span>
              <span v-i18n>Filters</span>
              <span v-if="filterCount > 0" class="lobby-badge">{{ filterCount }}</span>
              <span class="lobby-chevron" aria-hidden="true"></span>
            </button>
            <button type="button" class="create-game-icon-button" :disabled="quickMatch === undefined"
              :title="quickMatch === undefined ? $t('No open game fits right now') : quickMatch.title" @click="quickStart()">
              <span aria-hidden="true">⚡</span><span v-i18n>Quick start</span>
            </button>
          </div>

          <div v-if="filtersOpen" class="lobby-filter-panel">
            <LobbyFilterPanel v-model="filters" :rooms="rooms" />
          </div>

          <div v-if="queueing" class="lobby-queue">
            <span class="lobby-queue-pulse" aria-hidden="true"></span>
            <span class="lobby-queue-text">
              <b>{{ $t('Waiting for players') }} {{ queueTime }}</b>
              <span v-i18n>As soon as a fitting game is opened, you will be asked to join.</span>
            </span>
            <AppButton class="btn-tone-danger" title="Cancel" @click="queueing = false" />
          </div>

          <p v-if="loadError" class="lobby-error">{{ loadError }}</p>
        </section>

        <!-- Two cards side by side: left the running games to watch or continue, right the new ones you can take part in -->
        <div class="lobby-columns">
          <section class="create-game-card lobby-list-card lobby-list">
            <div class="lobby-section-title"><span v-i18n>Running games</span><span class="lobby-section-count">{{ runningRooms.length }}</span></div>
            <div class="lobby-list-rows">
              <LobbyGameRow v-for="(room, index) in runningRooms" :key="room.id" :room="room" :position="index" />
              <div v-if="runningRooms.length === 0 && loaded" class="lobby-empty">
                <span v-i18n>No game is running right now.</span>
              </div>
            </div>
          </section>
          <section class="create-game-card lobby-list-card lobby-list">
            <div class="lobby-section-title"><span v-i18n>Open games</span><span class="lobby-section-count">{{ openRooms.length }}</span></div>
            <div class="lobby-list-rows">
              <LobbyGameRow v-for="(room, index) in openRooms" :key="room.id" :room="room" :position="runningRooms.length + index" @join="join(room)" @open-room="roomOpen = true" />
              <div v-if="openRooms.length === 0 && loaded" class="lobby-empty">
                <template v-if="filterCount > 0 && !queueing">
                  <span v-i18n>No open game fits your filters.</span>
                  <div class="lobby-empty-actions">
                    <AppButton class="btn-tone-quiet" title="Reset filters" @click="filters = defaultLobbyFilters()" />
                    <AppButton title="Wait until one fits" @click="startQueue()" />
                  </div>
                </template>
                <span v-else v-i18n>No game is open right now.</span>
              </div>
            </div>
          </section>
        </div>
      </div>
      <!-- Wide screens: drag handle between games and chat (double click: default width) -->
      <ColumnResizeHandle class="lobby-chat-resizer" :split="LOBBY_CHAT_SPLIT" />
      <!-- Chat with everybody in the lobby: on wide screens a sidebar on the right, otherwise below the games -->
      <aside class="lobby-chat-aside">
        <LobbyChat :profile="profile" :withProfile="withProfile" />
      </aside>
    </main>

    <!-- Minimized waiting room. Stays in the page (hidden) while the dialog is open: the dialog grows out of it and shrinks back into it -->
    <button v-if="myRoom !== undefined && myRoom.state === 'open'" type="button" class="lobby-wait-bar" :class="{'lobby-wait-bar--hidden': roomOpen}" :aria-hidden="roomOpen" @click="roomOpen = true">
      <span class="lobby-queue-pulse" aria-hidden="true"></span>
      <span>{{ $t('Waiting room') }}: <b>{{ myRoom.title }}</b> · {{ seatCount(myRoom) }}</span>
    </button>

    <LobbyProfileDialog :open="profileOpen" :origin="profileDialogOrigin" :profile="profile" :firstVisit="firstVisit" @close="profileOpen = false" @save="saveProfile" />
    <LobbyRoomDialog :open="roomOpen && myRoom !== undefined" :room="myRoom" :origin="roomDialogOrigin" @minimize="roomOpen = false" @leave="leave()"
      @ready="act({action: 'ready', roomId: myRoom!.id, ready: $event})" @seat-ai="act({action: 'seat-ai', roomId: myRoom!.id, seat: $event})"
      @fill-ai="act({action: 'fill-ai', roomId: myRoom!.id})" @start="act({action: 'start', roomId: myRoom!.id})" />
    <LobbyMatchDialog :room="offeredRoom" :invitation="offerIsInvitation" @accept="acceptOffer()" @decline="declineOffer()" />

    <!-- "Create game" as a modal: the same form, with seats offered in the lobby -->
    <Teleport to="body">
      <div v-if="createOpen" class="lobby-create-overlay" @keydown.esc="createOpen = false">
        <CreateGameForm lobbyMode :lobbyProfile="profile.name.trim() === '' ? undefined : profile" @close="createOpen = false" @open-in-lobby="openInLobby" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {askLobbyPushPermission, subscribeLobbyPush} from './lobbyPush';
import ColumnResizeHandle from '@/client/components/ColumnResizeHandle.vue';
import {LOBBY_CHAT_SPLIT} from '@/client/utils/columnResize';
import {ComponentPublicInstance, computed, defineAsyncComponent, getCurrentInstance, onBeforeUnmount, onMounted, nextTick, ref, watch} from 'vue';
import {LOBBY_NAME_MAX_LENGTH, LobbyProfile, LobbyRoomModel} from '@/common/lobby/LobbyModel';
import {NewGameConfig} from '@/common/game/NewGameConfig';
import PageToolbar from '@/client/components/PageToolbar.vue';
import PageTitle from '@/client/components/common/PageTitle.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import LobbyAvatar from './LobbyAvatar.vue';
import LobbyFilterPanel from './LobbyFilterPanel.vue';
import LobbyGameRow from './LobbyGameRow.vue';
import LobbyProfileDialog from './LobbyProfileDialog.vue';
import LobbyRoomDialog from './LobbyRoomDialog.vue';
import LobbyMatchDialog from './LobbyMatchDialog.vue';
import LobbyChat from './LobbyChat.vue';
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';
import {fetchLobby, lobbyAction, lobbyFailureText, LobbyRequest} from './lobbyApi';
import {activeFilterCount, bestMatch, defaultLobbyFilters, hasFreeSeat, LobbyFilters, matchesFilters} from './lobbyFilters';
import {loadLobbyProfile, saveLobbyProfile} from './lobbyProfile';
import {isLobbyCreatePath, LOBBY_CREATE_PATH, lobbyRoomIdFromPath} from '@/common/lobby/lobbyUrl';
import {paths} from '@/common/app/paths';
import {PICK_CODES} from '@/client/hotkeys/hotkeyActions';
import {codeOfEvent} from '@/client/hotkeys/hotkeyEvents';
import {hotkeysAvailable} from '@/client/hotkeys/hotkeyAvailability';
import {isTypingTarget} from '@/client/utils/typingTarget';
import {setDocumentTitle} from '@/client/utils/documentTitle';
import {describeFailure, failureOf} from '@/client/utils/requestFailure';
import {showAlert} from '@/client/components/showAlert';

const CreateGameForm = defineAsyncComponent(() => import(/* webpackChunkName: "create-game" */ '@/client/components/create/CreateGameForm.vue'));

// Polling: the list doubles as heartbeat of the own seat (server drops seats after 45 s without it)
const POLL_MS = 2500;

const instance = getCurrentInstance();
const storedProfile = loadLobbyProfile();
const firstVisit = ref(storedProfile === undefined);
const profile = ref<LobbyProfile>(storedProfile ?? {name: '', color: 'red', emoji: '🚀'});
// First visit: the welcome asks for the profile, but not when the visitor came to create a game (start page
// "Start", lobby/create): the form's own seat carries name and color, and the profile is taken from it (openInLobby)
const profileOpen = ref(firstVisit.value && !isLobbyCreatePath(window.location.pathname));
// After the first profile: the action that asked for it goes on
let afterProfile: (() => void) | undefined;

const rooms = ref<ReadonlyArray<LobbyRoomModel>>([]);
const yourRoomId = ref<string | undefined>();
const loaded = ref(false);
const loadError = ref('');
const search = ref('');
const filters = ref<LobbyFilters>(defaultLobbyFilters());
const filtersOpen = ref(false);
const roomOpen = ref(false);
const createOpen = ref(false);
const queueing = ref(false);
const queueStartedAt = ref(0);
const now = ref(Date.now());
const offeredRoom = ref<LobbyRoomModel | undefined>();
const offerIsInvitation = ref(false);
// Rooms declined while waiting are not offered again
const declinedRooms = new Set<string>();
// Invitation link: lobby/room/<id>-<name> (lobbyUrl.ts)
const invitedRoomId = lobbyRoomIdFromPath(window.location.pathname);
let invitationHandled = false;
let pollTimer: ReturnType<typeof setInterval> | undefined;
// Rooms we sat in while they were still open on this page: their start leads into the game
const waitedIn = new Set<string>();
// Set by our own open/join click: a game that starts right away (no free seats left) leads into it too
let followNextStart = false;
// Set while our own "Open in lobby" runs: the new room stays in the list, its dialog opens only on a click
let openingOwnRoom = false;
let clockTimer: ReturnType<typeof setInterval> | undefined;

const filterCount = computed(() => activeFilterCount(filters.value));
const myRoom = computed(() => rooms.value.find((room) => room.id === yourRoomId.value));
const visibleRooms = computed(() => {
  const query = search.value.trim().toLowerCase();
  return rooms.value.filter((room) => matchesFilters(room, filters.value) && (query === '' ||
    room.title.toLowerCase().includes(query) ||
    room.seats.some((seat) => seat.kind === 'human' && seat.name.toLowerCase().includes(query))));
});
// The own room always first, whatever the filters say
const openRooms = computed(() => {
  const open = visibleRooms.value.filter((room) => room.state === 'open' && (hasFreeSeat(room) || room.id === yourRoomId.value));
  const mine = myRoom.value;
  return mine !== undefined && mine.state === 'open' && !open.includes(mine) ? [mine, ...open] : open;
});
const runningRooms = computed(() => visibleRooms.value.filter((room) => room.state === 'started'));
const quickMatch = computed(() => bestMatch(rooms.value, filters.value));
const queueTime = computed(() => {
  const seconds = Math.max(0, Math.floor((now.value - queueStartedAt.value) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
});

function seatCount(room: LobbyRoomModel): string {
  return `${room.seats.filter((seat) => seat.kind !== 'free').length}/${room.seats.length}`;
}

async function refresh(): Promise<void> {
  try {
    const list = await fetchLobby(invitedRoomId);
    rooms.value = list.rooms;
    yourRoomId.value = list.yourRoomId;
    loaded.value = true;
    loadError.value = '';
  } catch (error) {
    loadError.value = describeFailure(failureOf(error));
    return;
  }
  const mine = myRoom.value;
  if (mine?.state === 'open') {
    waitedIn.add(mine.id);
  }
  // The game started while we waited for it (or was started by our own click): everybody goes to their own
  // player page, a host with players entered by hand first to the page with every player's link.
  // An earlier game of ours does not pull a later visit of the lobby away: it is listed with "Continue".
  if (mine?.state === 'started' && (waitedIn.has(mine.id) || followNextStart)) {
    followNextStart = false;
    if (mine.hostNeedsLinks && mine.gameId !== undefined) {
      window.location.href = 'game?id=' + mine.gameId;
      return;
    }
    if (mine.yourPlayerId !== undefined) {
      window.location.href = 'player?id=' + mine.yourPlayerId;
      return;
    }
  }
  offerInvitation();
  offerQueueMatch();
}

function offerInvitation(): void {
  if (invitationHandled || invitedRoomId === undefined || offeredRoom.value !== undefined) {
    return;
  }
  invitationHandled = true;
  const room = rooms.value.find((r) => r.id === invitedRoomId);
  if (room !== undefined && room.id !== yourRoomId.value && hasFreeSeat(room)) {
    offerIsInvitation.value = true;
    offeredRoom.value = room;
  }
}

function offerQueueMatch(): void {
  if (!queueing.value || offeredRoom.value !== undefined || yourRoomId.value !== undefined) {
    return;
  }
  const match = bestMatch(rooms.value.filter((room) => !declinedRooms.has(room.id)), filters.value);
  if (match !== undefined) {
    offerIsInvitation.value = false;
    offeredRoom.value = match;
  }
}

/** Runs the action once a profile exists (first visit: ask for it first) */
function withProfile(action: () => void): void {
  if (profile.value.name.trim() === '') {
    afterProfile = action;
    profileOpen.value = true;
    return;
  }
  action();
}

function saveProfile(next: LobbyProfile): void {
  profile.value = next;
  firstVisit.value = false;
  saveLobbyProfile(next);
  profileOpen.value = false;
  const mine = myRoom.value;
  if (mine !== undefined && mine.state === 'open') {
    act({action: 'profile', roomId: mine.id, profile: next});
  }
  const pending = afterProfile;
  afterProfile = undefined;
  pending?.();
}

async function act(action: LobbyRequest): Promise<LobbyRoomModel | undefined> {
  try {
    const room = await lobbyAction(action);
    await refresh();
    return room;
  } catch (error) {
    const text = lobbyFailureText(error);
    if (instance !== null) {
      showAlert(instance.proxy as ComponentPublicInstance, 'Game lobby', {text});
    }
    await refresh();
    return undefined;
  }
}

function join(room: LobbyRoomModel): void {
  withProfile(async () => {
    followNextStart = true;
    const joined = await act({action: 'join', roomId: room.id, profile: profile.value});
    if (joined !== undefined) {
      queueing.value = false;
      roomOpen.value = joined.state === 'open';
    }
  });
}

function quickStart(): void {
  const match = quickMatch.value;
  if (match !== undefined) {
    join(match);
  }
}

function startQueue(): void {
  withProfile(() => {
    queueing.value = true;
    queueStartedAt.value = Date.now();
    offerQueueMatch();
  });
}

function acceptOffer(): void {
  const room = offeredRoom.value;
  offeredRoom.value = undefined;
  if (room !== undefined) {
    join(room);
  }
}

function declineOffer(): void {
  if (offeredRoom.value !== undefined) {
    declinedRooms.add(offeredRoom.value.id);
  }
  offeredRoom.value = undefined;
}

async function leave(): Promise<void> {
  const mine = myRoom.value;
  roomOpen.value = false;
  if (mine !== undefined) {
    await act({action: 'leave', roomId: mine.id});
  }
}

// No profile needed to fill in the form: whoever creates a game names the own seat there
function openCreate(): void {
  createOpen.value = true;
}

// The open form has its own address lobby/create (start page item "Start" links there): a reload keeps it open,
// closing it returns to the address it was opened from. Relative addresses resolve against the page's base (app root)
let addressBeforeCreate: string | undefined;
watch(createOpen, (open) => {
  if (open) {
    if (!isLobbyCreatePath(window.location.pathname)) {
      addressBeforeCreate = window.location.href;
      window.history.replaceState(window.history.state, '', LOBBY_CREATE_PATH);
    }
  } else if (isLobbyCreatePath(window.location.pathname)) {
    window.history.replaceState(window.history.state, '', addressBeforeCreate ?? paths.LOBBY);
    addressBeforeCreate = undefined;
  }
});

async function openInLobby(request: {config: NewGameConfig, title: string, listed: boolean, freeSeats: Array<number>}): Promise<void> {
  // Without a profile yet the own seat of the form becomes it (name and color as entered there), so creating
  // a game never stops at the profile dialog; the picture can be changed later via the profile button
  if (profile.value.name.trim() === '') {
    const ownSeat = request.config.players[0];
    if (ownSeat === undefined || ownSeat.name.trim() === '') {
      withProfile(() => void openInLobby(request));
      return;
    }
    const fromSeat: LobbyProfile = {...profile.value, name: ownSeat.name.trim().slice(0, LOBBY_NAME_MAX_LENGTH), color: ownSeat.color};
    profile.value = fromSeat;
    firstVisit.value = false;
    saveLobbyProfile(fromSeat);
  }
  followNextStart = true;
  // Still inside the click: browsers ask for the permission only then. With it the host may leave the lobby
  // and still learns by push message when somebody joins
  const permission = askLobbyPushPermission();
  openingOwnRoom = true;
  const room = await act({action: 'open', profile: profile.value, ...request});
  // The watcher of yourRoomId runs before the next tick: only then the flag may go
  await nextTick();
  openingOwnRoom = false;
  if (permission !== undefined) {
    void permission.then(subscribeLobbyPush);
  }
  if (room !== undefined) {
    createOpen.value = false;
    queueing.value = false;
    // Stays on the list: the own entry (or the waiting bar) opens the dialog. Without free seats the game
    // already runs and refresh() leads into it
    roomOpen.value = false;
  }
}

// The dialog of the own room opens by itself when entering the lobby (or when somebody else's action put us
// there; not after our own "Open in lobby"): a waiting room with its controls, an own running game with "Continue" (LobbyRoomDialog.vue)
watch(yourRoomId, (id, before) => {
  if (id !== undefined && before === undefined && loaded.value && !openingOwnRoom) {
    roomOpen.value = true;
  }
});

// The profile dialog morphs out of and back into the profile button in the header
function profileDialogOrigin(): HTMLElement | undefined {
  return document.querySelector<HTMLElement>('#lobby .lobby-profile-button') ?? undefined;
}

// The room dialog morphs out of and back into what stands for the room on the page: the minimized bar while the
// room waits for players, otherwise (running game) its entry in the list
function roomDialogOrigin(): HTMLElement | undefined {
  const bar = document.querySelector<HTMLElement>('.lobby-wait-bar');
  if (bar !== null) {
    return bar;
  }
  const id = myRoom.value?.id;
  return id === undefined ? undefined : document.querySelector<HTMLElement>(`#lobby .lobby-game[data-room-id="${id}"]`) ?? undefined;
}

// Alt + 1 … 9, 0 presses the button of that row (as on "Game created"); by position, since on a Mac Alt + 1 types a character
function onRowKey(event: KeyboardEvent): void {
  if (!hotkeysAvailable.value || event.repeat || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isTypingTarget(event.target)) {
    return;
  }
  if (document.querySelector('.sidebar-modal-backdrop, .lobby-create-overlay') !== null) {
    return;
  }
  const code = codeOfEvent(event);
  const index = code === undefined ? -1 : PICK_CODES.indexOf(code);
  const button = document.querySelectorAll<HTMLElement>('#lobby .lobby-game')[index]?.querySelector<HTMLElement>('.lobby-game-action .btn');
  if (button !== undefined && button !== null) {
    event.preventDefault();
    button.click();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onRowKey);
  setDocumentTitle('Game lobby');
  if (isLobbyCreatePath(window.location.pathname)) {
    openCreate();
  }
  refresh();
  // Renews an existing permission's subscription (language, key of the server)
  void subscribeLobbyPush();
  pollTimer = setInterval(refresh, POLL_MS);
  clockTimer = setInterval(() => now.value = Date.now(), 1000);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onRowKey);
  clearInterval(pollTimer);
  clearInterval(clockTimer);
});
</script>
