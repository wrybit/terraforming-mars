<template>
  <div>
    <div v-if="showtitle === true">{{ $t(playerinput.title) }}</div>
    <!-- Players as tiles (PlayerOptionTile.vue) with stock and production of the affected resource, before and after -->
    <div class="player-options choice-block" :style="choiceBlockStyle((playerinput.players || []).length)" role="radiogroup">
      <PlayerOptionTile v-for="player in (playerinput.players || [])" :key="player"
        :color="player"
        :player="findPlayer(player)"
        :effect="effect"
        :selected="selectedPlayer === player"
        :groupName="groupName"
        @select="selectedPlayer = $event"/>
    </div>
    <TabPanelFooterSlot>
    <AppButton v-if="showsave === true" size="big" @click="saveData" :title="$t(playerinput.buttonLabel)" />
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">

import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import {choiceBlockStyle} from '@/client/components/choiceBlock';
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {SelectPlayerModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import PlayerOptionTile from '@/client/components/PlayerOptionTile.vue';
import {SelectPlayerResponse} from '@/common/inputs/InputResponse';
import {ColorWithNeutral} from '@/common/Color';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {PlayerEffect, playerEffect} from '@/client/components/selectPlayerResource';

type DataModel = {
  selectedPlayer: ColorWithNeutral | undefined;
  groupName: string;
}

let unique = 0;

export default defineComponent({
  name: 'SelectPlayer',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectPlayerModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectPlayerResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  data(): DataModel {
    return {
      selectedPlayer: undefined,
      groupName: 'selectPlayer' + unique++,
    };
  },
  components: {
    TabPanelFooterSlot,
    PlayerOptionTile,
    AppButton,
  },
  computed: {
    effect(): PlayerEffect | undefined {
      return playerEffect(this.playerinput.title);
    },
  },
  methods: {
    choiceBlockStyle,
    findPlayer(color: ColorWithNeutral): PublicPlayerModel | undefined {
      return this.playerView.players.find((otherPlayer) => otherPlayer.color === color);
    },
    saveData() {
      if (this.selectedPlayer === undefined) {
        return;
      }
      this.onsave({type: 'player', player: this.selectedPlayer});
    },
  },
});

</script>
