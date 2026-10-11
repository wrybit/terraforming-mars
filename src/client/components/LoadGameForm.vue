<template>
  <div id="load-game" class="games-overview-container admin-home">
      <AdminNav active="load"/>

      <!-- Same card and fields as the other admin pages (admin_settings.less) -->
      <form class="games-overview-card load-game-card" @submit.prevent="loadGame">
          <label class="server-settings-label" for="gameId" v-i18n>Game, player, or spectator ID to reload:</label>
          <div class="server-settings-input">
              <input id="gameId" :placeholder="$t('Game Id')" v-model="gameId">
          </div>
          <label class="server-settings-label" for="rollbackCount" v-i18n>Number of saves to delete before loading:</label>
          <div class="server-settings-input">
              <input id="rollbackCount" type="number" min="0" v-model="rollbackCount">
          </div>
          <div><button type="submit" class="btn btn-primary" v-i18n>Load Game</button></div>
      </form>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import * as constants from '@/common/constants';
import AdminNav from '@/client/components/admin/AdminNav.vue';
import {LoadGameFormModel} from '@/common/models/LoadGameFormModel';
import {SimpleGameModel} from '@/common/models/SimpleGameModel';
import {vueRoot} from '@/client/components/vueRoot';
import {GameId} from '@/common/Types';
import {paths} from '@/common/app/paths';
import {translateText} from '@/client/directives/i18n';

type LoadGameFormDataModel = {
  gameId: GameId | undefined;
  rollbackCount: number;
};

export default defineComponent({
  name: 'LoadGameForm',
  components: {
    AdminNav,
  },
  data(): LoadGameFormDataModel {
    return {
      gameId: undefined,
      rollbackCount: 0,
    };
  },
  methods: {
    loadGame() {
      const gameId = this.gameId;
      const rollbackCount = this.rollbackCount;
      if (gameId === undefined) {
        alert(translateText('Specify a game id'));
        return;
      }
      const loadGameForm: LoadGameFormModel = {
        gameId,
        rollbackCount,
      };

      fetch(paths.LOAD_GAME, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(loadGameForm),
      })
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`Error getting game data: ${resp.statusText}`);
          }
          return resp.json();
        })
        .then((response: SimpleGameModel) => {
          if (response.players.length === 1) {
            window.location.href = 'player?id=' + response.players[0].id;
            return;
          } else {
            window.history.replaceState(response, `${constants.APP_NAME} - Game`, 'game?id=' + response.id);
            vueRoot(this).game = response;
            vueRoot(this).screen = 'game-home';
          }
        })
        .catch((err) => {
          alert(translateText('Error loading game'));
          console.error(err);
        });
    },
  },
  computed: {
    APP_NAME(): string {
      return constants.APP_NAME;
    },
  },
});
</script>
