<template>
  <!-- One open (or running) game of the lobby: title, host, seats, settings, action on the right.
       Like "Game created": a CTA only where you take part (waiting room, continue), otherwise a quiet button -->
  <div class="lobby-game" :class="{'lobby-game--running': room.state === 'started', 'lobby-game--mine': isMine}">
    <div class="lobby-game-info">
      <div class="lobby-game-title">{{ room.title }}</div>
      <div class="lobby-game-meta">
        <template v-if="host !== undefined">
          <LobbyAvatar kind="human" :color="host.color" :emoji="host.emoji" :image="host.image" size="small" />
          <span>{{ host.name }}</span>
          <span aria-hidden="true">·</span>
        </template>
        <span class="lobby-game-state" :class="{'lobby-game-state--running': room.state === 'started'}">{{ stateText }}</span>
      </div>
    </div>
    <div class="lobby-game-seats">
      <LobbyAvatar v-for="(seat, index) in room.seats" :key="index" :kind="seat.kind" size="small"
        :color="seat.kind === 'human' || seat.kind === 'guest' ? seat.color : undefined" :emoji="seat.kind === 'human' ? seat.emoji : undefined"
        :image="seat.kind === 'human' ? seat.image : undefined" :title="seatTitle(seat)" />
      <span class="lobby-game-count">{{ filled }}/{{ room.seats.length }}</span>
    </div>
    <GameSetupChips class="lobby-game-chips" :chips="chips" compact />
    <div class="lobby-game-action">
      <AppButton v-if="isMine" title="Waiting room" :fixedHotkey="keys" @click="emit('open-room')" />
      <!-- Own running game: back into it instead of watching -->
      <a v-else-if="room.state === 'started' && room.yourPlayerId" class="btn btn-rounded btn-primary lobby-game-watch" :href="'player?id=' + room.yourPlayerId"><span v-i18n>Continue</span><HotkeyKeys :fixed="keys" /></a>
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
import {lobbySetupChips} from './lobbySetupChips';
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

const host = computed(() => {
  const seat = props.room.seats.find((s) => s.kind === 'human' && s.host);
  return seat?.kind === 'human' ? seat : undefined;
});
const isMine = computed(() => props.room.state === 'open' && props.room.seats.some((seat) => seat.kind === 'human' && seat.you));
const filled = computed(() => props.room.seats.filter((seat) => seat.kind !== 'free').length);
const chips = computed(() => lobbySetupChips(props.room));
const stateText = computed(() => {
  if (props.room.state === 'started') {
    return translateText('running');
  }
  const minutes = Math.floor(props.room.ageMs / 60_000);
  return minutes < 1 ? translateText('just opened') : translateTextWithParams('waiting for ${0} min', [String(minutes)]);
});

function seatTitle(seat: LobbySeatModel): string {
  if (seat.kind === 'human' || seat.kind === 'guest') {
    return seat.name;
  }
  return seat.kind === 'ai' ? 'AI' : translateText('Free seat');
}
</script>
