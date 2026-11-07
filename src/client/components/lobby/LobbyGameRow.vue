<template>
  <!-- One open (or running) game of the lobby. Top: title with the facts (generation, players, AI, time), the seats
       (one circle each, free ones dashed, the host outlined) and the action; below over the full width the progress
       of a running game (LobbyGameTimeline.vue) and the settings. A CTA only where you take part, otherwise a quiet button -->
  <!-- Games you opened yourself are set off by a background, the others stay neutral.
       The own waiting room opens its dialog on a click anywhere on the entry, not only on the button -->
  <!-- AI training games of this server (aiTraining): running ones are only information (no button, no hotkey),
       finished ones can be watched like any other game -->
  <div class="lobby-game" :data-room-id="room.id"
    :class="{'lobby-game--running': room.state === 'started', 'lobby-game--hosted': isHost, 'lobby-game--clickable': isMine,
             'lobby-game--training': room.aiTraining !== undefined, 'lobby-game--info': isLiveTraining}"
    @click="isMine && emit('open-room')">
    <div class="lobby-game-info">
      <div class="lobby-game-title">{{ room.title }}</div>
      <div class="lobby-game-facts">
        <span v-if="room.progress !== undefined" :title="$t('Generation')"><LobbyFactIcon kind="generation" />{{ $t('Gen') }} {{ room.progress.generation }}</span>
        <span :title="$t('Players')"><LobbyFactIcon kind="players" />{{ humans }}</span>
        <span v-if="aiPlayers > 0" title="AI"><LobbyFactIcon kind="ai" />{{ aiPlayers }}</span>
        <span v-if="room.progress !== undefined" :title="$t('Time played')"><LobbyFactIcon kind="time" />{{ playedText }}</span>
        <span v-else class="lobby-game-waiting"><LobbyFactIcon kind="time" />{{ waitingText }}</span>
        <span v-if="room.aiTraining?.finished" v-i18n>Finished</span>
      </div>
    </div>
    <div class="lobby-game-seats">
      <LobbyAvatar v-for="(seat, index) in room.seats" :key="index" :kind="seat.kind" size="medium"
        :class="{'lobby-avatar--host': seat.kind === 'human' && seat.host}" :style="{zIndex: room.seats.length - index}"
        :color="seat.kind === 'human' || seat.kind === 'guest' ? seat.color : undefined" :emoji="seat.kind === 'human' ? seat.emoji : undefined"
        :image="seat.kind === 'human' ? seat.image : undefined" :title="seatTitle(seat)" />
    </div>
    <LobbyGameTimeline v-if="room.progress !== undefined" :progress="room.progress" />
    <GameSetupChips class="lobby-game-chips" :chips="chips" compact writtenOut />
    <div class="lobby-game-action">
      <!-- The click reaches the entry anyway (opens the dialog there), so the button needs no handler of its own -->
      <AppButton v-if="isMine" title="Waiting room" :fixedHotkey="keys" />
      <!-- Own running game: back into it instead of watching -->
      <a v-else-if="continueLink !== undefined" class="btn btn-rounded btn-primary lobby-game-watch" :href="continueLink"><span v-i18n>Continue</span><HotkeyKeys :fixed="keys" /></a>
      <a v-else-if="room.state === 'started' && room.spectatorId" class="btn btn-rounded btn-tone-quiet lobby-game-watch" :href="'spectator?id=' + room.spectatorId"><span v-i18n>Watch</span><HotkeyKeys :fixed="keys" /></a>
      <!-- Declined by the host: no way in, said as plain information instead of a button that does nothing -->
      <span v-else-if="room.state === 'open' && room.yourAccess === 'declined'" class="lobby-game-declined" v-i18n>Declined by the host</span>
      <!-- Removed twice before: joining asks the host first -->
      <AppButton v-else-if="room.state === 'open'" class="btn-tone-quiet" :title="room.yourAccess === 'request' ? 'Ask to join' : 'Join'" :fixedHotkey="keys" @click="emit('join')" />
      <!-- Running AI training game: where "Watch" will be, a disabled button with a spinner says it is still being played
           (on the wrapper the tooltip also works for the disabled button) -->
      <span v-else-if="isLiveTraining" v-glass-tooltip="$t('The AI is playing this game right now. It can be watched as soon as it is finished.')">
        <button type="button" class="btn btn-rounded btn-tone-quiet lobby-game-watch lobby-game-training" disabled>
          <span class="lobby-game-spinner" aria-hidden="true"></span><span v-i18n>Training</span>
        </button>
      </span>
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
import LobbyGameTimeline from './LobbyGameTimeline.vue';
import {lobbyDuration} from './lobbyDuration';
import {lobbySetupChips} from './lobbySetupChips';
import {continueHref} from './lobbyLinks';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {glassTooltip as vGlassTooltip} from '@/client/directives/GlassTooltip';

const props = defineProps<{
  room: LobbyRoomModel;
  // Position in the list: the first ten rows get Alt + 1 … 9, 0, handled by LobbyPage.vue
  position?: number;
}>();

const keys = computed<HotkeyKeyList>(() => props.position !== undefined && props.position < PICK_DIGITS.length ? ['Alt', PICK_DIGITS[props.position]] : []);

const emit = defineEmits<{
  (event: 'join'): void;
  (event: 'open-room'): void;
}>();

const isLiveTraining = computed(() => props.room.aiTraining !== undefined && !props.room.aiTraining.finished);
const isMine = computed(() => props.room.state === 'open' && props.room.seats.some((seat) => seat.kind === 'human' && seat.you));
// Opened by you (host), open or already running
const isHost = computed(() => props.room.seats.some((seat) => seat.kind === 'human' && seat.you && seat.host));
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
  const milliseconds = props.room.progress?.playedMs ?? 0;
  // AI training games take seconds to minutes: below a minute the seconds tell more than "0 min"
  if (props.room.aiTraining !== undefined && milliseconds < 60_000) {
    return `${Math.floor(milliseconds / 1000)} s`;
  }
  return lobbyDuration(milliseconds);
});

function seatTitle(seat: LobbySeatModel): string {
  if (seat.kind === 'human' || seat.kind === 'guest') {
    return seat.name;
  }
  return seat.kind === 'ai' ? 'AI' : translateText('Free seat');
}
</script>
