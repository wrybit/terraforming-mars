<template>
  <SidebarModal :open="open" :framed="true" @close="emit('minimize')">
    <DialogFrame v-if="room !== undefined" :title="room.title" :width="720" class="lobby-room-dialog" @close="emit('minimize')">
      <GameSetupChips :chips="chips" />
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
            </template>
            <template v-else-if="seat.kind === 'ai'">
              <LobbyAvatar kind="ai" size="large" />
              <span class="lobby-seat-name">AI</span>
              <span class="lobby-seat-state lobby-seat-state--ready">{{ $t(aiLevelLabel(seat.aiLevel)) }}</span>
            </template>
            <template v-else>
              <LobbyAvatar kind="free" size="large" />
              <span class="lobby-seat-name" v-i18n>Free seat</span>
              <button v-if="isHost" type="button" class="create-game-small-button" @click="emit('seat-ai', index)" v-i18n>Seat an AI</button>
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
          <a v-if="continueLink !== undefined" class="btn btn-rounded btn-primary" :href="continueLink" v-i18n>Continue</a>
        </div>
        <div v-else class="lobby-room-foot">
          <AppButton class="btn-tone-danger" :title="isHost ? 'Close game' : 'Leave'" @click="emit('leave')" />
          <span class="lobby-room-foot-gap"></span>
          <AppButton v-if="isHost && freeSeats > 0" class="btn-tone-quiet" title="Fill with AI and start" @click="emit('fill-ai')" />
          <AppButton v-if="isHost" title="Start now" :disabled="freeSeats > 0" @click="emit('start')" />
          <AppButton v-else :class="you?.ready ? 'btn-tone-quiet' : 'btn-tone-success'" :title="you?.ready ? 'Not ready' : 'Ready'" @click="emit('ready', !you?.ready)" />
        </div>
      </template>
    </DialogFrame>
  </SidebarModal>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {AiLevel} from '@/common/ai/AiLevel';
import {LobbyRoomModel} from '@/common/lobby/LobbyModel';
import SidebarModal from '@/client/components/SidebarModal.vue';
import DialogFrame from '@/client/components/DialogFrame.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import GameSetupChips from '@/client/components/common/GameSetupChips.vue';
import LobbyAvatar from './LobbyAvatar.vue';
import {lobbySetupChips} from './lobbySetupChips';
import {lobbyRoomPath} from '@/common/lobby/lobbyUrl';
import {continueHref} from './lobbyLinks';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {AI_LEVEL_OPTIONS} from '@/client/components/create/createGameChoices';

const props = defineProps<{
  open: boolean;
  room: LobbyRoomModel | undefined;
}>();

const emit = defineEmits<{
  (event: 'minimize'): void;
  (event: 'leave'): void;
  (event: 'ready', ready: boolean): void;
  (event: 'seat-ai', seat: number): void;
  (event: 'fill-ai'): void;
  (event: 'start'): void;
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
const inviteLink = computed(() => props.room === undefined ? '' : new URL(lobbyRoomPath(props.room.id, props.room.title), document.baseURI).href);
const started = computed(() => props.room?.state === 'started');
const continueLink = computed(() => props.room === undefined ? undefined : continueHref(props.room));
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
