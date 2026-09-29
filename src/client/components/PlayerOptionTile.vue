<template>
  <!-- Ein Spieler als Kachel in seiner Farbe; die gewählte pulsiert wie Karten (player_options.less).
       Geht es um eine Ressource, zeigt die Kachel deren Bestand und Produktion.
       Gemeinsam genutzt von SelectPlayer.vue und der Kachel-Entscheidung in OrOptions.vue. -->
  <label :class="['player-option', 'player_translucent_bg_color_' + color, {'player-option--selected': selected}]">
    <!-- Radio für Tastatur und Screenreader, sichtbar ist die Kachel -->
    <input type="radio" :name="groupName" :value="color" :checked="selected" class="player-option-input" @change="$emit('select', color)">
    <SelectPlayerRow class="player-option-name" :player="player"/>
    <div v-if="snapshot !== undefined" class="player-option-resource">
      <i :class="'resource_icon player-option-icon resource_icon--' + resource"></i>
      <div class="player-option-values">
        <div class="player-option-value"><div class="player-option-label" v-i18n>Stock</div>{{ snapshot.stock }}</div>
        <div class="player-option-value"><div class="player-option-label" v-i18n>Production</div>{{ signed(snapshot.production) }}</div>
      </div>
    </div>
  </label>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ColorWithNeutral} from '@/common/Color';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Resource} from '@/common/Resource';
import SelectPlayerRow from '@/client/components/SelectPlayerRow.vue';
import {ResourceSnapshot, resourceSnapshot} from '@/client/components/selectPlayerResource';

export default defineComponent({
  name: 'PlayerOptionTile',
  components: {
    SelectPlayerRow,
  },
  props: {
    color: {
      type: String as () => ColorWithNeutral,
      required: true,
    },
    player: {
      type: Object as () => PublicPlayerModel | undefined,
      required: false,
      default: undefined,
    },
    resource: {
      type: String as () => Resource | undefined,
      required: false,
      default: undefined,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      required: true,
    },
  },
  emits: ['select'],
  computed: {
    // Bestand und Produktion der betroffenen Ressource; undefined, wenn es um keine Ressource geht
    snapshot(): ResourceSnapshot | undefined {
      if (this.resource === undefined || this.player === undefined) {
        return undefined;
      }
      return resourceSnapshot(this.player, this.resource);
    },
  },
  methods: {
    // Produktion mit Vorzeichen wie in den Spielerleisten (+2, 0, -1)
    signed(value: number): string {
      return value > 0 ? '+' + value : String(value);
    },
  },
});
</script>
