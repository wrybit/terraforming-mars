<template>
  <!-- While waiting for a fitting game: one turned up. Accept within the countdown, otherwise the search goes on.
       Also asks before joining through an invitation link (then without countdown). -->
  <SidebarModal :open="room !== undefined" :framed="true" @close="emit('decline')">
    <DialogFrame v-if="room !== undefined" :title="$t(invitation ? 'Join this game?' : 'Game found')" :width="460" class="lobby-match-dialog" @close="emit('decline')">
      <div class="lobby-match">
        <div class="lobby-match-title">{{ room.title }}</div>
        <div class="lobby-match-seats">
          <LobbyAvatar v-for="(seat, index) in room.seats" :key="index" :kind="seat.kind" size="large"
            :color="seat.kind === 'human' ? seat.color : undefined" :emoji="seat.kind === 'human' ? seat.emoji : undefined"
            :image="seat.kind === 'human' ? seat.image : undefined" />
        </div>
        <GameSetupChips :chips="chips" />
        <div v-if="!invitation" class="lobby-match-countdown" :style="{'--progress': secondsLeft / ACCEPT_SECONDS}">{{ secondsLeft }}</div>
      </div>
      <template #footer>
        <div class="lobby-room-foot">
          <AppButton class="btn-tone-danger" :title="invitation ? 'Cancel' : 'Decline'" @click="emit('decline')" />
          <span class="lobby-room-foot-gap"></span>
          <AppButton class="btn-tone-success" :title="invitation ? 'Join' : 'Accept'" @click="emit('accept')" />
        </div>
      </template>
    </DialogFrame>
  </SidebarModal>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, ref, watch} from 'vue';
import {LobbyRoomModel} from '@/common/lobby/LobbyModel';
import SidebarModal from '@/client/components/SidebarModal.vue';
import DialogFrame from '@/client/components/DialogFrame.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import GameSetupChips from '@/client/components/common/GameSetupChips.vue';
import LobbyAvatar from './LobbyAvatar.vue';
import {lobbySetupChips} from './lobbySetupChips';

const ACCEPT_SECONDS = 15;

const props = defineProps<{
  room: LobbyRoomModel | undefined;
  // Opened through an invitation link: no countdown
  invitation?: boolean;
}>();

const emit = defineEmits<{
  (event: 'accept'): void;
  (event: 'decline'): void;
}>();

const secondsLeft = ref(ACCEPT_SECONDS);
const chips = computed(() => props.room === undefined ? [] : lobbySetupChips(props.room));
let timer: ReturnType<typeof setInterval> | undefined;

watch(() => props.room?.id, (id) => {
  clearInterval(timer);
  if (id === undefined || props.invitation) {
    return;
  }
  secondsLeft.value = ACCEPT_SECONDS;
  timer = setInterval(() => {
    secondsLeft.value--;
    if (secondsLeft.value <= 0) {
      clearInterval(timer);
      emit('decline');
    }
  }, 1000);
});

onBeforeUnmount(() => clearInterval(timer));
</script>
