<template>
  <SidebarModal :open="open" :framed="true" :origin="origin" morph @close="emit('minimize')">
    <DialogFrame v-if="room !== undefined" :title="room.title" :width="720" class="lobby-room-dialog" @close="emit('minimize')">
      <GameSetupChips :chips="chips" writtenOut />
      <div class="lobby-room-group">
        <div class="create-game-subhead">{{ $t('Seats') }} {{ filled }}/{{ room.seats.length }}</div>
        <div class="lobby-seats">
          <div v-for="(seat, index) in room.seats" :key="index" class="lobby-seat" :class="'lobby-seat--' + seat.kind">
            <template v-if="seat.kind === 'human'">
              <LobbyAvatar kind="human" :color="seat.color" :emoji="seat.emoji" :image="seat.image" size="large" />
              <span class="lobby-seat-name">{{ seat.name }}<template v-if="seat.you"> ({{ $t('you') }})</template></span>
              <span v-if="seat.host" class="lobby-seat-host" v-i18n>Host</span>
              <!-- "ready" only matters while waiting -->
              <span v-if="!started" class="lobby-seat-state" :class="{'lobby-seat-state--ready': seat.ready}">{{ $t(seat.ready ? 'ready' : 'not ready yet') }}</span>
            </template>
            <template v-else-if="seat.kind === 'guest'">
              <LobbyAvatar kind="guest" :color="seat.color" :title="seat.name" size="large" />
              <span class="lobby-seat-name">{{ seat.name }}</span>
              <span class="lobby-seat-state" v-i18n>entered by the host</span>
              <!-- Host: this player's own link to pass on (waiting: takes this seat in the lobby; running: the player page) -->
              <button v-if="guestLink(seat) !== undefined" type="button" class="create-game-small-button lobby-seat-link" @click="copyGuestLink(index, seat)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                <span>{{ $t(copiedSeat === index ? 'Link copied' : 'Copy link') }}</span>
              </button>
            </template>
            <template v-else-if="seat.kind === 'ai'">
              <LobbyAvatar kind="ai" size="large" />
              <span class="lobby-seat-name">AI</span>
              <!-- Host, while waiting: strength to choose (a compact list: three segments do not fit a seat card on phones
                   or in longer languages); everybody else sees it as text -->
              <select v-if="isHost && !started" class="create-game-small-button lobby-seat-level" :value="seat.aiLevel" :aria-label="$t('Strength')"
                @change="emit('ai-level', index, ($event.target as HTMLSelectElement).value as AiLevel)">
                <option v-for="option in AI_LEVEL_OPTIONS" :key="option.value" :value="option.value">{{ $t(option.label) }}</option>
              </select>
              <span v-else class="lobby-seat-state lobby-seat-state--ready">{{ $t(aiLevelLabel(seat.aiLevel)) }}</span>
            </template>
            <template v-else>
              <LobbyAvatar kind="free" size="large" />
              <span class="lobby-seat-name" v-i18n>Free seat</span>
              <!-- Settings the AI cannot handle: disabled, the tooltip names them (on the wrapper: disabled buttons get no mouse events) -->
              <span v-if="isHost" v-glass-tooltip="aiBlockedText">
                <button type="button" class="create-game-small-button" :disabled="aiBlockedText !== ''" @click="emit('seat-ai', index)" v-i18n>Seat an AI</button>
              </span>
              <span v-else class="lobby-seat-state" v-i18n>waiting for a player</span>
            </template>
          </div>
        </div>
        <p class="lobby-dialog-note">{{ statusText }}</p>
      </div>
      <div v-if="freeSeats > 0 && !started" class="lobby-room-group">
        <div class="create-game-subhead" v-i18n>Invite friends</div>
        <div class="lobby-invite">
          <input class="create-game-text-input" :value="inviteLink" readonly @focus="($event.target as HTMLInputElement).select()">
          <button type="button" class="create-game-icon-button" @click="copyInvite">{{ $t(copied ? 'Link copied' : 'Copy link') }}</button>
        </div>
      </div>
      <template #footer>
        <!-- The game already runs (e.g. started while the dialog was open): only the way into it -->
        <div v-if="started" class="lobby-room-foot">
          <span class="lobby-room-foot-gap"></span>
          <a v-if="playerLinks !== undefined" class="btn btn-rounded btn-tone-quiet" :href="playerLinks" v-i18n>Player links</a>
          <a v-if="continueLink !== undefined" class="btn btn-rounded btn-primary" :href="continueLink" v-i18n>Continue</a>
        </div>
        <div v-else class="lobby-room-foot">
          <AppButton class="btn-tone-danger" :title="isHost ? 'Close game' : 'Leave'" @click="emit('leave')" />
          <span class="lobby-room-foot-gap"></span>
          <!-- Host: change settings, name or seats of the waiting game in the create form -->
          <AppButton v-if="isHost" class="btn-tone-quiet" title="Edit game" @click="emit('edit')" />
          <!-- The host can always start: free seats are left out, alone it is a solo game -->
          <AppButton v-if="isHost" title="Start now" @click="emit('start')" />
          <AppButton v-else :class="you?.ready ? 'btn-tone-quiet' : 'btn-tone-success'" :title="you?.ready ? 'Not ready' : 'Ready'" @click="emit('ready', !you?.ready)" />
        </div>
      </template>
    </DialogFrame>
  </SidebarModal>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {AiLevel} from '@/common/ai/AiLevel';
import {LobbyRoomModel, LobbySeatModel} from '@/common/lobby/LobbyModel';
import SidebarModal from '@/client/components/SidebarModal.vue';
import DialogFrame from '@/client/components/DialogFrame.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import GameSetupChips from '@/client/components/common/GameSetupChips.vue';
import LobbyAvatar from './LobbyAvatar.vue';
import {lobbySetupChips} from './lobbySetupChips';
import {lobbyRoomPath, lobbySeatInvitePath} from '@/common/lobby/lobbyUrl';
import {continueHref, playerLinksHref} from './lobbyLinks';
import {aiUnsupportedReasons} from '@/common/ai/aiSupport';
import {glassTooltip as vGlassTooltip} from '@/client/directives/GlassTooltip';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {AI_LEVEL_OPTIONS} from '@/client/components/create/createGameChoices';

const props = defineProps<{
  open: boolean;
  room: LobbyRoomModel | undefined;
  /** Where the dialog comes from and goes to: the room's entry in the list or the minimized bar (LobbyPage.vue) */
  origin?: () => HTMLElement | undefined;
}>();

const emit = defineEmits<{
  (event: 'minimize'): void;
  (event: 'leave'): void;
  (event: 'ready', ready: boolean): void;
  (event: 'seat-ai', seat: number): void;
  (event: 'ai-level', seat: number, aiLevel: AiLevel): void;
  (event: 'start'): void;
  (event: 'edit'): void;
}>();

const copied = ref(false);
const chips = computed(() => props.room === undefined ? [] : lobbySetupChips(props.room));
const you = computed(() => {
  const seat = props.room?.seats.find((s) => s.kind === 'human' && s.you);
  return seat?.kind === 'human' ? seat : undefined;
});
const isHost = computed(() => you.value?.host === true);
const filled = computed(() => props.room?.seats.filter((seat) => seat.kind !== 'free').length ?? 0);
const freeSeats = computed(() => (props.room?.seats.length ?? 0) - filled.value);
// "Start now" once every seat is taken; otherwise the button says with how many the game starts
const inviteLink = computed(() => props.room === undefined ? '' : new URL(lobbyRoomPath(props.room.id, props.room.title), document.baseURI).href);
// Same check as the create form and the server (aiSupport.ts); empty = AI players possible
const aiBlockedText = computed(() => {
  const setup = props.room?.setup;
  const reasons = setup === undefined ? [] : aiUnsupportedReasons({expansions: setup.expansions, twoCorpsVariant: setup.options.twoCorpsVariant});
  return reasons.length === 0 ? '' : translateText('AI not yet compatible with:') + ' ' + reasons.map((reason) => translateText(reason)).join(', ');
});
const started = computed(() => props.room?.state === 'started');
const continueLink = computed(() => props.room === undefined ? undefined : continueHref(props.room));
const playerLinks = computed(() => props.room === undefined ? undefined : playerLinksHref(props.room));
const statusText = computed(() => {
  if (started.value) {
    return translateText('The game is running.');
  }
  if (freeSeats.value === 1) {
    return translateText('1 seat is free. The game starts as soon as all seats are taken and everybody is ready.');
  }
  if (freeSeats.value > 1) {
    return translateTextWithParams('${0} seats are free. The game starts as soon as all seats are taken and everybody is ready.', [String(freeSeats.value)]);
  }
  return translateText('All seats are taken. The game starts as soon as everybody is ready.');
});

function aiLevelLabel(level: AiLevel): string {
  return AI_LEVEL_OPTIONS.find((option) => option.value === level)?.label ?? level;
}

const copiedSeat = ref<number | undefined>();

function guestLink(seat: LobbySeatModel): string | undefined {
  if (seat.kind !== 'guest' || props.room === undefined) {
    return undefined;
  }
  if (seat.inviteToken !== undefined) {
    return new URL(lobbySeatInvitePath(props.room.id, props.room.title, seat.inviteToken), document.baseURI).href;
  }
  return seat.playerId === undefined ? undefined : new URL('player?id=' + seat.playerId, document.baseURI).href;
}

async function copyGuestLink(index: number, seat: LobbySeatModel): Promise<void> {
  const link = guestLink(seat);
  if (link === undefined) {
    return;
  }
  try {
    await navigator.clipboard.writeText(link);
    copiedSeat.value = index;
    setTimeout(() => copiedSeat.value = undefined, 2000);
  } catch {
    // Clipboard blocked: nothing else to do here
  }
}

async function copyInvite(): Promise<void> {
  try {
    await navigator.clipboard.writeText(inviteLink.value);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  } catch {
    // Clipboard blocked: the field stays selectable
  }
}
</script>
