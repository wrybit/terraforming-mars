<template>
  <div>
    <div v-if="showtitle === true">{{ $t(playerinput.title) }}</div>
    <!-- Spieler als Kacheln in ihrer Farbe; die gewählte pulsiert wie Karten (player_options.less).
         Geht es um eine Ressource, zeigt jede Kachel deren Bestand und Produktion. -->
    <div class="player-options" role="radiogroup">
      <label v-for="player in (playerinput.players || [])" :key="player"
        :class="['player-option', 'player_translucent_bg_color_' + player, {'player-option--selected': selectedPlayer === player}]">
        <!-- Radio für Tastatur und Screenreader, sichtbar ist die Kachel -->
        <input type="radio" v-model="selectedPlayer" :value="player" class="player-option-input">
        <SelectPlayerRow class="player-option-name" :player="findPlayer(player)"/>
        <div v-if="snapshots[player] !== undefined" class="player-option-resource">
          <i :class="'resource_icon player-option-icon resource_icon--' + resource"></i>
          <div class="player-option-values">
            <div class="player-option-value"><div class="player-option-label" v-i18n>Stock</div>{{ snapshots[player]?.stock }}</div>
            <div class="player-option-value"><div class="player-option-label" v-i18n>Production</div>{{ signed(snapshots[player]?.production ?? 0) }}</div>
          </div>
        </div>
      </label>
    </div>
    <TabPanelFooterSlot>
    <AppButton v-if="showsave === true" size="big" @click="saveData" :title="$t(playerinput.buttonLabel)" />
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">

import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {SelectPlayerModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import SelectPlayerRow from '@/client/components/SelectPlayerRow.vue';
import {SelectPlayerResponse} from '@/common/inputs/InputResponse';
import {ColorWithNeutral} from '@/common/Color';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Resource} from '@/common/Resource';
import {ResourceSnapshot, resourceSnapshot, selectPlayerResource} from '@/client/components/selectPlayerResource';

type DataModel = {
  selectedPlayer: ColorWithNeutral | undefined;
}

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
    };
  },
  components: {
    TabPanelFooterSlot,
    SelectPlayerRow,
    AppButton,
  },
  computed: {
    resource(): Resource | undefined {
      return selectPlayerResource(this.playerinput.title);
    },
    // Bestand und Produktion je wählbarem Spieler; leer, wenn es um keine Ressource geht
    snapshots(): Partial<Record<ColorWithNeutral, ResourceSnapshot>> {
      const resource = this.resource;
      const snapshots: Partial<Record<ColorWithNeutral, ResourceSnapshot>> = {};
      if (resource === undefined) {
        return snapshots;
      }
      for (const color of this.playerinput.players ?? []) {
        const player = this.findPlayer(color);
        if (player !== undefined) {
          snapshots[color] = resourceSnapshot(player, resource);
        }
      }
      return snapshots;
    },
  },
  methods: {
    findPlayer(color: ColorWithNeutral): PublicPlayerModel | undefined {
      return this.playerView.players.find((otherPlayer) => otherPlayer.color === color);
    },
    // Produktion mit Vorzeichen wie in den Spielerleisten (+2, 0, -1)
    signed(value: number): string {
      return value > 0 ? '+' + value : String(value);
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
