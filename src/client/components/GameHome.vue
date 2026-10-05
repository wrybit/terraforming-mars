<template>
  <div id="game-home" class="game-home">
    <!-- Header like card list/statistics: confirmation with game ID, language and settings in a header card -->
    <header class="card-list-header card-list-header--plain game-home-head">
      <!-- Menu at the top left, as in the game -->
      <PageToolbar/>
      <!-- Logo inside the title like PageTitle.vue, so the narrow header grid keeps its cells. App name like the other page titles (PageTitle.vue), hidden on narrow screens; check mark right before the status -->
      <h1>
        <MarsHomeLink/>
        <span class="page-title-app">Terraforming Mars –</span>
        <span class="game-home-check">✓</span>
        <span v-i18n>Game created</span>
        <span class="game-home-meta"><span class="game-home-name">{{ game.name }}</span><span class="game-home-id">{{ getGameId() }}</span></span>
      </h1>
    </header>

    <div class="game-home-columns">
      <section class="game-home-card">
        <h2 v-i18n>Player links</h2>
        <p class="game-home-hint" v-i18n>Send every player their own link, then open yours.</p>
        <div class="game-home-links">
          <div v-for="(player, index) in game.players" :key="player.color"
            :class="'game-home-link ' + getPlayerRowColorClass(player.color)">
            <span class="game-home-order" v-i18n>{{ getTurnOrder(index) }}</span>
            <div class="game-home-who">
              <strong>{{ player.name }}</strong>
              <code>{{ getUrl(player.id) }}</code>
            </div>
            <AppButton class="btn-tone-quiet" :title="isPlayerUrlCopied(player.id) ? 'Copied!' : 'Copy'" @click="copyUrl(player.id)"/>
            <a class="btn btn-primary" :href="getHref(player.id)" v-i18n>Play</a>
          </div>
          <div class="game-home-link game-home-link--spectator">
            <span class="game-home-order"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></span>
            <div class="game-home-who">
              <strong v-i18n>Spectator</strong>
              <code>{{ getUrl(game.spectatorId) }}</code>
            </div>
            <AppButton class="btn-tone-quiet" :title="isPlayerUrlCopied(game.spectatorId) ? 'Copied!' : 'Copy'" @click="copyUrl(game.spectatorId)"/>
            <a class="btn btn-primary" :href="getHref(game.spectatorId)" v-i18n>Watch</a>
          </div>
        </div>
        <div class="game-home-purge">
          <PurgeWarning :expectedPurgeTimeMs="game.expectedPurgeTimeMs"/>
        </div>
      </section>

      <section class="game-home-card">
        <h2 v-i18n>Game settings</h2>
        <GameSetupDetail :gameOptions="game.gameOptions" :playerNumber="game.players.length" :lastSoloGeneration="game.lastSoloGeneration"/>
      </section>
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {SimpleGameModel} from '@/common/models/SimpleGameModel';
import AppButton from '@/client/components/common/AppButton.vue';
import PageToolbar from '@/client/components/PageToolbar.vue';
import MarsHomeLink from '@/client/components/common/MarsHomeLink.vue';
import PurgeWarning from '@/client/components/common/PurgeWarning.vue';
import {playerColorClass} from '@/common/utils/utils';
import GameSetupDetail from '@/client/components/GameSetupDetail.vue';
import {ParticipantId} from '@/common/Types';
import {Color} from '@/common/Color';
import {shortDocumentTitle} from '../utils/documentTitle';
import {$t} from '../directives/i18n';

// taken from https://stackoverflow.com/a/46215202/83336
// The solution to copying to the clipboard in this case is
// 1. create a dummy input
// 2. add the copied text as a value
// 3. select the input
// 4. execute document.execCommand('copy') which does the clipboard thing
// 5. remove the dummy input
function copyToClipboard(text: string): void {
  const input = document.createElement('input');
  input.setAttribute('value', text);
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}
const DEFAULT_COPIED_PLAYER_ID = '-1';

export default defineComponent({
  name: 'GameHome',
  props: {
    game: {
      type: Object as () => SimpleGameModel,
      required: true,
    },
  },
  components: {
    AppButton,
    PageToolbar,
    MarsHomeLink,
    GameSetupDetail,
    PurgeWarning,
  },

  data() {
    return {
      // Variable to keep the state for the current copied player id. Used to display message of which button and which player playable link is currently in the clipboard
      urlCopiedPlayerId: DEFAULT_COPIED_PLAYER_ID,
      previousViewport: '',
    };
  },
  methods: {
    getGameId(): string {
      return this.game !== undefined ? this.game.id.toString() : 'n/a';
    },
    getTurnOrder(index: number): string {
      if (index === 0) {
        return '1st';
      } else if (index === 1) {
        return '2nd';
      } else if (index === 2) {
        return '3rd';
      } else if (index > 2) {
        return `${index + 1}th`;
      } else {
        return 'n/a';
      }
    },
    setCopiedIdToDefault() {
      this.urlCopiedPlayerId = DEFAULT_COPIED_PLAYER_ID;
    },
    getPlayerRowColorClass(color: Color): string {
      return playerColorClass(color, 'bg_transparent');
    },
    // Full URL of the link, as it is copied
    getUrl(playerId: ParticipantId): string {
      const path = window.location.href.replace(/game\?id=.*/, '');
      return path + this.getHref(playerId);
    },
    getHref(playerId: ParticipantId): string {
      if (playerId === this.game.spectatorId) {
        return `spectator?id=${playerId}`;
      }
      return `player?id=${playerId}`;
    },
    copyUrl(playerId: ParticipantId | undefined): void {
      if (playerId === undefined) {
        return;
      }
      copyToClipboard(this.getUrl(playerId));
      this.urlCopiedPlayerId = playerId;
    },
    isPlayerUrlCopied(playerId: string): boolean {
      return playerId === this.urlCopiedPlayerId;
    },
  },
  mounted() {
    // Reset the copied player id after 3 seconds to hide the "copied" message
    setInterval(this.setCopiedIdToDefault, 3000);
    document.title = shortDocumentTitle([$t('Game created'), this.game.name]);
    // Set the viewport width to width=device-width on the create game form so mobile browsers use their actual CSS viewport width.
    // The current global viewport is width=1260, which prevents the create game form from using the device width on phones.
    // This is a temporary solution in order to make this edit scoped to the create game form.
    // TODO: Once responsiveness covers the whole project, this code should be removed and the tag in index.html should be updated directly.
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport !== null) {
      this.previousViewport = viewport.getAttribute('content') ?? '';
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1, viewport-fit=cover',
      );
    }
  },
  beforeUnmount() {
    document
      .querySelector('meta[name="viewport"]')
      ?.setAttribute('content', this.previousViewport);
  },
});

</script>
