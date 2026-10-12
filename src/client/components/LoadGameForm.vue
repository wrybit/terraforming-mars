<template>
  <!-- Load a game again (admin, top of the games overview): same input row as the import next to it -->
  <form class="load-game-form" @submit.prevent="loadGame">
    <div class="games-overview-import">
      <input id="gameId" v-model="gameId" type="text" class="games-overview-import-input" :aria-label="$t('Game, player, or spectator ID to reload:')" :placeholder="$t('Game Id')">
      <button type="submit" class="btn btn-primary" :disabled="(gameId ?? '').trim() === ''" v-i18n>Load Game</button>
    </div>
    <label class="load-game-rollback" for="rollbackCount">
      <span v-i18n>Number of saves to delete before loading:</span>
      <input id="rollbackCount" v-model="rollbackCount" type="number" min="0">
    </label>
  </form>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import * as constants from '@/common/constants';
import {LoadGameFormModel} from '@/common/models/LoadGameFormModel';
import {SimpleGameModel} from '@/common/models/SimpleGameModel';
import {vueRoot} from '@/client/components/vueRoot';
import {showAlert} from '@/client/components/showAlert';
import {GameId} from '@/common/Types';
import {paths} from '@/common/app/paths';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

type LoadGameFormDataModel = {
  gameId: GameId | undefined;
  rollbackCount: number;
};

export default defineComponent({
  name: 'LoadGameForm',
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

      fetchOrFail(paths.LOAD_GAME, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(loadGameForm),
      })
        .then((resp) => resp.json())
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
          console.error(err);
          showAlert(this, 'Game could not be loaded', {text: translateTextWithParams('Game ${0} could not be loaded (saves to delete first: ${1}).', [gameId, String(rollbackCount)]) + '\n' + describeFailure(failureOf(err))});
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
