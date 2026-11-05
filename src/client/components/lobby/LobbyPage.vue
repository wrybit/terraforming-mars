<template>
  <div id="lobby" class="lobby" :class="{'lobby--waiting': myRoom !== undefined && myRoom.state === 'open' && !roomOpen}">
    <!-- Header like "Create game": menu, title, then the own profile and the one way to open a game -->
    <header class="card-list-header card-list-header--plain lobby-head">
      <PageToolbar />
      <PageTitle title="Lobby" />
      <div class="create-game-head-actions">
        <button type="button" class="create-game-icon-button lobby-profile-button" :title="$t('Your profile')" @click="profileOpen = true">
          <LobbyAvatar kind="human" :color="profile.color" :emoji="profile.emoji" :image="profile.image" size="small" />
          <span class="create-game-head-label">{{ profile.name }}</span>
        </button>
        <!-- The only way to open a game; on phones only the plus remains -->
        <button type="button" class="btn btn-rounded lobby-open-button" :title="$t('Open game')" @click="openCreate()">
          <svg class="lobby-open-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          <span class="lobby-open-label" v-i18n>Open game</span>
        </button>
      </div>
    </header>

    <main class="lobby-layout">
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
          <LobbyFilterPanel v-model="filters" />
          <div class="lobby-filter-foot">
            <span v-if="filterCount === 0" class="lobby-dialog-note" v-i18n>Nothing selected means: all games.</span>
            <button v-else type="button" class="create-game-small-button" @click="filters = defaultLobbyFilters()" v-i18n>Reset all filters</button>
          </div>
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

        <div class="lobby-list">
          <LobbyGameRow v-for="room in openRooms" :key="room.id" :room="room" @join="join(room)" @open-room="roomOpen = true" />
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
          <template v-if="runningRooms.length > 0">
            <div class="lobby-section-title" v-i18n>Running</div>
            <LobbyGameRow v-for="room in runningRooms" :key="room.id" :room="room" />
          </template>
        </div>
      </section>
    </main>

    <!-- Minimized waiting room -->
    <button v-if="myRoom !== undefined && myRoom.state === 'open' && !roomOpen" type="button" class="lobby-wait-bar" @click="roomOpen = true">
      <span class="lobby-queue-pulse" aria-hidden="true"></span>
      <span>{{ $t('Waiting room') }}: <b>{{ myRoom.title }}</b> · {{ seatCount(myRoom) }}</span>
    </button>

    <LobbyProfileDialog :open="profileOpen" :profile="profile" :firstVisit="firstVisit" @close="profileOpen = false" @save="saveProfile" />
    <LobbyRoomDialog :open="roomOpen && myRoom !== undefined" :room="myRoom" @minimize="roomOpen = false" @leave="leave()"
      @ready="act({action: 'ready', roomId: myRoom!.id, ready: $event})" @seat-ai="act({action: 'seat-ai', roomId: myRoom!.id, seat: $event})"
      @fill-ai="act({action: 'fill-ai', roomId: myRoom!.id})" @start="act({action: 'start', roomId: myRoom!.id})" />
    <LobbyMatchDialog :room="offeredRoom" :invitation="offerIsInvitation" @accept="acceptOffer()" @decline="declineOffer()" />

    <!-- "Create game" as a modal: the same form, with seats offered in the lobby -->
    <Teleport to="body">
      <div v-if="createOpen" class="lobby-create-overlay" @keydown.esc="createOpen = false">
        <CreateGameForm lobbyMode :lobbyProfile="profile" @close="createOpen = false" @open-in-lobby="openInLobby" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {ComponentPublicInstance, computed, defineAsyncComponent, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {LobbyProfile, LobbyRoomModel} from '@/common/lobby/LobbyModel';
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
import {fetchLobby, lobbyAction, LobbyRequest} from './lobbyApi';
import {activeFilterCount, bestMatch, defaultLobbyFilters, hasFreeSeat, LobbyFilters, matchesFilters} from './lobbyFilters';
import {loadLobbyProfile, saveLobbyProfile} from './lobbyProfile';
import {lobbyRoomIdFromPath} from '@/common/lobby/lobbyUrl';
import {setDocumentTitle} from '@/client/utils/documentTitle';
import {describeFailure, failureOf} from '@/client/utils/requestFailure';
import {showAlert} from '@/client/components/showAlert';
import {translateText} from '@/client/directives/i18n';

const CreateGameForm = defineAsyncComponent(() => import(/* webpackChunkName: "create-game" */ '@/client/components/create/CreateGameForm.vue'));

// Polling: the list doubles as heartbeat of the own seat (server drops seats after 45 s without it)
const POLL_MS = 2500;

const instance = getCurrentInstance();
const storedProfile = loadLobbyProfile();
const firstVisit = ref(storedProfile === undefined);
const profile = ref<LobbyProfile>(storedProfile ?? {name: '', color: 'red', emoji: '🚀'});
const profileOpen = ref(firstVisit.value);
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
  // The game started: everybody goes to their own player page; a host with players entered by hand first
  // gets the page with every player's link, to send them theirs
  if (mine?.state === 'started' && mine.hostNeedsLinks && mine.gameId !== undefined) {
    window.location.href = 'game?id=' + mine.gameId;
    return;
  }
  if (mine?.state === 'started' && mine.yourPlayerId !== undefined) {
    window.location.href = 'player?id=' + mine.yourPlayerId;
    return;
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
    // The lobby's own refusals (full, closed, already started) come as short texts that have translations
    const failure = failureOf(error);
    const text = failure.kind === 'http' && failure.status === 400 ? translateText(failure.serverText) : describeFailure(failure);
    if (instance !== null) {
      showAlert(instance.proxy as ComponentPublicInstance, 'Lobby', {text});
    }
    await refresh();
    return undefined;
  }
}

function join(room: LobbyRoomModel): void {
  withProfile(async () => {
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

function openCreate(): void {
  withProfile(() => createOpen.value = true);
}

async function openInLobby(request: {config: NewGameConfig, title: string, listed: boolean, freeSeats: Array<number>}): Promise<void> {
  const room = await act({action: 'open', profile: profile.value, ...request});
  if (room !== undefined) {
    createOpen.value = false;
    queueing.value = false;
    roomOpen.value = true;
  }
}

// The dialog of the own room opens by itself when somebody else's action put us there (e.g. after reload)
watch(yourRoomId, (id, before) => {
  if (id !== undefined && before === undefined && loaded.value) {
    roomOpen.value = true;
  }
});

onMounted(() => {
  setDocumentTitle('Lobby');
  refresh();
  pollTimer = setInterval(refresh, POLL_MS);
  clockTimer = setInterval(() => now.value = Date.now(), 1000);
});

onBeforeUnmount(() => {
  clearInterval(pollTimer);
  clearInterval(clockTimer);
});
</script>
