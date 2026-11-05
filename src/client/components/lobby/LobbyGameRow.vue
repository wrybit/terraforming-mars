<template>
  <!-- One open (or running) game of the lobby. Top: title with the facts (generation, players, AI, time), the seats
       (one circle each, free ones dashed, the host outlined) and the action; below over the full width the progress
       of a running game and the settings. Like "Game created": a CTA only where you take part, otherwise a quiet button -->
  <div class="lobby-game" :data-room-id="room.id" :class="{'lobby-game--running': room.state === 'started', 'lobby-game--mine': isMine}">
    <div class="lobby-game-info">
      <div class="lobby-game-title">{{ room.title }}</div>
      <div class="lobby-game-facts">
        <span v-if="room.progress !== undefined" :title="$t('Generation')"><LobbyFactIcon kind="generation" />{{ $t('Gen') }} {{ room.progress.generation }}</span>
        <span :title="$t('Players')"><LobbyFactIcon kind="players" />{{ humans }}</span>
        <span v-if="aiPlayers > 0" title="AI"><LobbyFactIcon kind="ai" />{{ aiPlayers }}</span>
        <span v-if="room.progress !== undefined" :title="$t('Time played')"><LobbyFactIcon kind="time" />{{ playedText }}</span>
        <span v-else class="lobby-game-waiting"><LobbyFactIcon kind="time" />{{ waitingText }}</span>
      </div>
    </div>
    <div class="lobby-game-seats">
      <LobbyAvatar v-for="(seat, index) in room.seats" :key="index" :kind="seat.kind" size="medium"
        :class="{'lobby-avatar--host': seat.kind === 'human' && seat.host}"
        :color="seat.kind === 'human' || seat.kind === 'guest' ? seat.color : undefined" :emoji="seat.kind === 'human' ? seat.emoji : undefined"
        :image="seat.kind === 'human' ? seat.image : undefined" :title="seatTitle(seat)" />
    </div>
    <div v-if="room.progress !== undefined" class="lobby-game-progress" role="progressbar" :aria-label="$t('Terraforming')"
      aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(room.progress.terraforming * 100)">
      <i :style="{width: (room.progress.terraforming * 100) + '%'}"></i>
    </div>
    <GameSetupChips class="lobby-game-chips" :chips="chips" compact writtenOut />
    <div class="lobby-game-action">
      <AppButton v-if="isMine" title="Waiting room" :fixedHotkey="keys" @click="emit('open-room')" />
      <!-- Own running game: back into it instead of watching -->
      <a v-else-if="continueLink !== undefined" class="btn btn-rounded btn-primary lobby-game-watch" :href="continueLink"><span v-i18n>Continue</span><HotkeyKeys :fixed="keys" /></a>
      <a v-else-if="room.state === 'started' && room.spectatorId" class="btn btn-rounded btn-tone-quiet lobby-game-watch" :href="'spectator?id=' + room.spectatorId"><span v-i18n>Watch</span><HotkeyKeys :fixed="keys" /></a>
      <AppButton v-else-if="room.state === 'open'" class="btn-tone-quiet" title="Join" :fixedHotkey="keys" @click="emit('join')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {LobbyRoomModel, LobbySeatModel} from '@/common/lobby/LobbyModel';
import AppButton from '@/client/components/common/AppButton.vue';
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';
import {HotkeyKeys as HotkeyKeyList, PICK_DIGITS} from '@/client/hotkeys/hotkeyActions';
import GameSetupChips from '@/client/components/common/GameSetupChips.vue';
import LobbyAvatar from './LobbyAvatar.vue';
import LobbyFactIcon from './LobbyFactIcon.vue';
import {lobbySetupChips} from './lobbySetupChips';
import {continueHref} from './lobbyLinks';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

const props = defineProps<{
  room: LobbyRoomModel;
  // Position in the list: the first ten rows get Alt + 1 … 9, 0 (as on "Game created"), handled by LobbyPage.vue
  position?: number;
}>();

const keys = computed<HotkeyKeyList>(() => props.position !== undefined && props.position < PICK_DIGITS.length ? ['Alt', PICK_DIGITS[props.position]] : []);

const emit = defineEmits<{
  (event: 'join'): void;
  (event: 'open-room'): void;
}>();

const isMine = computed(() => props.room.state === 'open' && props.room.seats.some((seat) => seat.kind === 'human' && seat.you));
const continueLink = computed(() => continueHref(props.room));
const humans = computed(() => props.room.seats.filter((seat) => seat.kind === 'human' || seat.kind === 'guest').length);
const aiPlayers = computed(() => props.room.seats.filter((seat) => seat.kind === 'ai').length);
const chips = computed(() => lobbySetupChips(props.room));
const waitingText = computed(() => {
  const minutes = Math.floor(props.room.ageMs / 60_000);
  return minutes < 1 ? translateText('just opened') : translateTextWithParams('waiting for ${0} min', [String(minutes)]);
});
// "6 min", "1 h 12 min"
const playedText = computed(() => {
  const minutes = Math.floor((props.room.progress?.playedMs ?? 0) / 60_000);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
});

function seatTitle(seat: LobbySeatModel): string {
  if (seat.kind === 'human' || seat.kind === 'guest') {
    return seat.name;
  }
  return seat.kind === 'ai' ? 'AI' : translateText('Free seat');
}
</script>
