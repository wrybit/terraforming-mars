<template>
  <!-- Ein Spieler als Kachel in seiner Farbe; die gewählte pulsiert wie Karten (player_options.less).
       Geht es um eine Ressource, zeigt die Kachel deren Bestand und Produktion, beim betroffenen Wert
       auch den Stand danach (selectPlayerResource.ts). Gemeinsam genutzt von SelectPlayer.vue und der
       Kachel-Entscheidung in OrOptions.vue (dort auch für Optionen wie "Entferne 4 Stahl von …"). -->
  <label :class="['player-option', 'player_translucent_bg_color_' + color, {'player-option--selected': selected}]"
    :title="caption === undefined ? undefined : $t(caption)">
    <!-- Radio für Tastatur und Screenreader, sichtbar ist die Kachel -->
    <input type="radio" :name="groupName" :value="color" :checked="selected" class="player-option-input" @change="$emit('select', color)">
    <SelectPlayerRow class="player-option-name" :player="player"/>
    <div v-if="snapshot !== undefined && after !== undefined" class="player-option-resource">
      <i :class="'resource_icon player-option-icon resource_icon--' + effect?.resource"></i>
      <div class="player-option-values">
        <div class="player-option-value">
          <div class="player-option-label" v-i18n>Stock</div>
          {{ snapshot.stock }}<span v-if="after.stock !== snapshot.stock" class="player-option-after">→{{ after.stock }}</span>
        </div>
        <div class="player-option-value">
          <div class="player-option-label" v-i18n>Production</div>
          {{ signed(snapshot.production) }}<span v-if="after.production !== snapshot.production" class="player-option-after">→{{ signed(after.production) }}</span>
        </div>
      </div>
    </div>
  </label>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ColorWithNeutral} from '@/common/Color';
import {Message} from '@/common/logs/Message';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import SelectPlayerRow from '@/client/components/SelectPlayerRow.vue';
import {PlayerEffect, ResourceSnapshot, resourceAfter, resourceSnapshot} from '@/client/components/selectPlayerResource';

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
    // Was die Wahl beim Spieler verändert; ohne Ressource bleibt die Kachel beim Namen
    effect: {
      type: Object as () => PlayerEffect | undefined,
      required: false,
      default: undefined,
    },
    // Voller Text der Option (z. B. "Entferne 4 Stahl von …") als Tooltip; sichtbar sind Name, Symbol und vorher → nachher,
    // damit der Name nicht doppelt steht
    caption: {
      type: [String, Object] as unknown as () => string | Message | undefined,
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
      if (this.effect === undefined || this.player === undefined) {
        return undefined;
      }
      return resourceSnapshot(this.player, this.effect.resource);
    },
    after(): ResourceSnapshot | undefined {
      if (this.snapshot === undefined || this.effect === undefined) {
        return undefined;
      }
      return resourceAfter(this.snapshot, this.effect);
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
