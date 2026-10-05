<template>
  <!-- Menu button (game_menu.less) at the top left of every page: language, help and settings everywhere;
       in the game (context from PlayerHome) also the own player, piles, game info and colonies. -->
  <span ref="root" :class="['game-menu', {'game-menu--large': large}]">
    <button type="button" :class="['game-menu-button', {'game-menu-button--open': menuOpen}]"
      :aria-expanded="menuOpen ? 'true' : 'false'" aria-haspopup="menu" :aria-label="buttonLabel" data-test="game-menu-button"
      @click.stop="toggleMenu">
      <span class="game-menu-burger" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="game-menu-button-label">{{ buttonLabel }}</span>
    </button>

    <Teleport to="body">
      <Transition name="game-menu-dropdown">
        <div v-if="menuOpen" ref="dropdown" class="game-menu-dropdown" role="menu" :style="dropdownPosition" @click.stop>
          <template v-if="context">
          <!-- Own player: neutral dark box, the colour comes from the cube alone -->
          <div class="game-menu-player">
            <PlayerCube :color="context.playerColor" view="iso" :size="34"/>
            <span class="game-menu-player-name">{{ context.playerName }}</span>
          </div>

          <!-- Display only: pile sizes with card icons (filled = draw pile, outline = discard pile) -->
          <dl class="game-menu-piles">
            <div class="game-menu-pile">
              <dt>
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor"/></svg>
                <span v-i18n>Draw pile</span>
              </dt>
              <dd>{{ context.deckSize }}</dd>
            </div>
            <div class="game-menu-pile">
              <dt>
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                <span v-i18n>Discard pile</span>
              </dt>
              <dd>{{ context.discardPileSize }}</dd>
            </div>
          </dl>
          </template>

          <div class="game-menu-items">
            <button type="button" role="menuitem" class="game-menu-item" @click="openDialog('language')">
              <span class="game-menu-item-icon"><LanguageFlag :lang="lang"/></span>
              <span v-i18n>Language</span>
            </button>
            <button v-if="context" type="button" role="menuitem" class="game-menu-item" @click="openDialog('info')">
              <span class="game-menu-item-icon"><i class="sidebar_icon sidebar_icon--info"></i></span>
              <span v-i18n>Game settings</span>
            </button>
            <button type="button" role="menuitem" class="game-menu-item" @click="openDialog('help')">
              <span class="game-menu-item-icon"><i class="sidebar_icon sidebar_icon--help"></i></span>
              <span v-i18n>Player help</span>
            </button>
            <button type="button" role="menuitem" class="game-menu-item" @click="openDialog('settings')">
              <span class="game-menu-item-icon"><i class="sidebar_icon sidebar_icon--settings"></i></span>
              <span v-i18n>Player Settings</span>
            </button>
            <a v-if="context && context.coloniesCount > 0" href="#colonies" role="menuitem" class="game-menu-item" @click="closeMenu">
              <span class="game-menu-item-icon"><i class="sidebar_icon sidebar_icon--colonies"></i></span>
              <span v-i18n>Jump to colonies</span>
            </a>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Dialogs grow out of the menu button (SidebarModal anchors at its parent element, this span) -->
    <SidebarModal :open="dialog === 'language'" :framed="true" @close="closeDialog">
      <LanguageSelectionDialog :preferencesManager="PreferencesManager.INSTANCE" @close="closeDialog"/>
    </SidebarModal>
    <SidebarModal v-if="context" :open="dialog === 'info'" :framed="true" @close="closeDialog">
      <InfoPanel :gameOptions="context.gameOptions" :playerNumber="context.playerNumber" :lastSoloGeneration="context.lastSoloGeneration"
        :deckSize="context.deckSize" :discardPileSize="context.discardPileSize" :otherDeckSizes="context.otherDeckSizes"
        :spectatorId="context.spectatorId" :expectedPurgeTimeMs="context.expectedPurgeTimeMs" @close="closeDialog"/>
    </SidebarModal>
    <SidebarModal :open="dialog === 'help'" :wide="true" :bare="true" @close="closeDialog">
      <HelpOverlay :closable="true" @close="closeDialog"/>
    </SidebarModal>
    <SidebarModal :open="dialog === 'settings'" :framed="true" @close="closeDialog">
      <PreferencesDialog :preferencesManager="PreferencesManager.INSTANCE" @okButtonClicked="closeDialog"/>
    </SidebarModal>
  </span>
</template>

<script setup lang="ts">
import {computed, defineAsyncComponent, inject, onBeforeUnmount, ref} from 'vue';
import SidebarModal from '@/client/components/SidebarModal.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import LanguageFlag from '@/client/components/LanguageFlag.vue';
import LanguageSelectionDialog from '@/client/components/LanguageSelectionDialog.vue';
import InfoPanel from '@/client/components/InfoPanel.vue';
import PreferencesDialog from '@/client/components/PreferencesDialog.vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {LANGUAGE} from '@/common/constants';
import {translateText} from '@/client/directives/i18n';
import {GAME_MENU_CONTEXT} from '@/client/components/gameMenu/gameMenuContext';

withDefaults(defineProps<{
  // Frosted-glass size of the page headers (40px) instead of the small table button
  large?: boolean;
}>(), {
  large: false,
});

// Help only on demand (own chunk, like in the sidebar)
const HelpOverlay = defineAsyncComponent(() => import(/* webpackChunkName: "help" */ '@/client/components/helpOverlay/HelpOverlay.vue'));

type MenuDialog = 'language' | 'info' | 'help' | 'settings';

// One short word per language (locales/*/game_info.json). Own key "Setup menu", because "Setup" is already
// translated as the start of the game; English and languages without a translation show "Setup".
const SETUP_MENU_KEY = 'Setup menu';
const buttonLabel = computed(() => {
  const translated = translateText(SETUP_MENU_KEY);
  return translated === SETUP_MENU_KEY ? 'Setup' : translated;
});

const injected = inject(GAME_MENU_CONTEXT, undefined);
const context = computed(() => injected?.value);
const lang = computed(() => PreferencesManager.INSTANCE.values().lang as LANGUAGE);

const root = ref<HTMLElement>();
const dropdown = ref<HTMLElement>();
const menuOpen = ref(false);
const dialog = ref<MenuDialog | undefined>(undefined);
const dropdownPosition = ref<Record<string, string>>({});

// Distance between button and dropdown
const DROPDOWN_OFFSET = 6;

function placeDropdown() {
  const button = root.value?.querySelector('.game-menu-button');
  if (!(button instanceof HTMLElement)) {
    return;
  }
  // Fixed below the button, left edges aligned (button sits at the top left of its card)
  const box = button.getBoundingClientRect();
  dropdownPosition.value = {left: `${box.left}px`, top: `${box.bottom + DROPDOWN_OFFSET}px`};
}

function onDocumentPointer(event: Event) {
  const target = event.target;
  if (target instanceof Node && (dropdown.value?.contains(target) || root.value?.contains(target))) {
    return;
  }
  closeMenu();
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMenu();
  }
}

// The button moves with scrolling and resizing; closing is simpler than following it
function listen(active: boolean) {
  if (active) {
    document.addEventListener('pointerdown', onDocumentPointer, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
  } else {
    document.removeEventListener('pointerdown', onDocumentPointer, true);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', closeMenu);
    window.removeEventListener('scroll', closeMenu, true);
  }
}

function openMenu() {
  placeDropdown();
  menuOpen.value = true;
  listen(true);
}

function closeMenu() {
  if (!menuOpen.value) {
    return;
  }
  menuOpen.value = false;
  listen(false);
}

function toggleMenu() {
  if (menuOpen.value) {
    closeMenu();
  } else {
    openMenu();
  }
}

function openDialog(which: MenuDialog) {
  closeMenu();
  dialog.value = which;
}

function closeDialog() {
  dialog.value = undefined;
}

onBeforeUnmount(() => listen(false));
</script>
