<template>
  <SidebarModal :open="open" :framed="true" @close="emit('close')">
    <DialogFrame :title="$t(firstVisit ? 'Welcome to the lobby' : 'Your profile')" :width="520" class="lobby-profile-dialog" @close="emit('close')">
      <p v-if="firstVisit" class="lobby-dialog-intro" v-i18n>This is how other players see you in the lobby and in the game.</p>
      <div class="lobby-profile">
        <LobbyAvatar kind="human" :color="draft.color" :emoji="draft.emoji" :image="draft.image" size="huge" class="lobby-profile-preview" />
        <div class="lobby-profile-fields">
          <label class="lobby-profile-group">
            <span class="create-game-subhead" v-i18n>Name</span>
            <input ref="nameInput" class="create-game-text-input" v-model="draft.name" :maxlength="LOBBY_NAME_MAX_LENGTH" :placeholder="$t('Your player name')" @keydown.enter="save()">
          </label>
          <div class="lobby-profile-group">
            <span class="create-game-subhead" v-i18n>Color</span>
            <!-- Same cubes as the color choice of "Create game" -->
            <div class="create-game-swatches">
              <button v-for="color in PLAYER_COLORS" :key="color" type="button"
                :class="['create-game-swatch', {'create-game-swatch--selected': draft.color === color}]" :title="$t(color)"
                :aria-pressed="draft.color === color" @click="draft.color = color">
                <PlayerCube :color="color" :view="draft.color === color ? 'slight' : 'top'" :size="draft.color === color ? 17 : 16" animated />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="lobby-profile-group">
        <span class="create-game-subhead" v-i18n>Picture</span>
        <div class="lobby-emoji-grid">
          <label class="lobby-emoji lobby-emoji--upload" :class="{'lobby-emoji--selected': draft.image !== undefined}" :title="$t('Upload your own picture')">
            <img v-if="draft.image" :src="draft.image" alt="">
            <span v-else aria-hidden="true">＋</span>
            <input type="file" accept="image/*" hidden @change="upload">
          </label>
          <button v-for="emoji in LOBBY_EMOJIS" :key="emoji" type="button" class="lobby-emoji"
            :class="['lobby-emoji--' + draft.color, {'lobby-emoji--selected': draft.image === undefined && draft.emoji === emoji}]"
            @click="pickEmoji(emoji)">{{ emoji }}</button>
        </div>
      </div>
      <p class="lobby-dialog-note" v-i18n>No account, no login: name and picture are only stored in this browser.</p>
      <template #footer>
        <AppButton :title="firstVisit ? 'Let\'s go' : 'Save'" :disabled="draft.name.trim() === ''" @click="save()" />
      </template>
    </DialogFrame>
  </SidebarModal>
</template>

<script setup lang="ts">
import {nextTick, ref, watch} from 'vue';
import {PLAYER_COLORS} from '@/common/Color';
import {LobbyProfile, LOBBY_EMOJIS, LOBBY_NAME_MAX_LENGTH} from '@/common/lobby/LobbyModel';
import SidebarModal from '@/client/components/SidebarModal.vue';
import DialogFrame from '@/client/components/DialogFrame.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import LobbyAvatar from './LobbyAvatar.vue';
import {readProfileImage} from './lobbyProfile';

const props = defineProps<{
  open: boolean;
  profile: LobbyProfile;
  firstVisit: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'save', profile: LobbyProfile): void;
}>();

const draft = ref<LobbyProfile>({...props.profile});
const nameInput = ref<HTMLInputElement>();

// Every opening starts from the saved profile
watch(() => props.open, (open) => {
  if (open) {
    draft.value = {...props.profile};
    nextTick(() => nameInput.value?.focus());
  }
});

function pickEmoji(emoji: string): void {
  draft.value = {...draft.value, emoji, image: undefined};
}

async function upload(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file !== undefined) {
    try {
      draft.value = {...draft.value, image: await readProfileImage(file)};
    } catch {
      // Not an image: keep the emoji
    }
  }
}

function save(): void {
  const name = draft.value.name.trim();
  if (name !== '') {
    emit('save', {...draft.value, name});
  }
}
</script>
