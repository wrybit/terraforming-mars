<template>
  <!-- Modal an body hängen: im Log (eigener Stacking-Context) läge es sonst unter den Icons oben rechts -->
  <Teleport to="body" :disabled="!modal">
  <!-- Wurzel ist das Teleport, deshalb landen Attribute (z. B. die Position der Hover-Vorschau als style) nicht von selbst hier -->
  <div :class="['card-panel', {'card-panel--floating': floating, 'card-panel--modal': modal}]" v-bind="$attrs" v-if="message !== undefined && show">
    <!-- Hover-Vorschau schließt sich beim Verlassen der Zeile selbst, braucht keinen Button -->
    <AppButton v-if="!floating" size="big" type="close" :disableOnServerBusy="false" @click="hideMe" align="right"/>
    <div id="log_panel_card" class="cardbox" v-for="name in cards" :key="name">
      <Card :card="cardModel(name)"/>
    </div>
    <div id="log_panel_card" class="cardbox" v-for="name in globalEvents" :key="name">
      <GlobalEvent :globalEventName="name" type="prior" :showIcons="false"/>
    </div>
    <div id="log_panel_card" class="cardbox" v-for="name in colonies" :key="name">
      <Colony :colony="getColony(name)"/>
    </div>
  </div>
  </Teleport>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {LogMessage} from '@/common/logs/LogMessage';
import {CardName} from '@/common/cards/CardName';
import {ColonyName} from '@/common/colonies/ColonyName';
import {ColonyModel, simpleColonyModel} from '@/common/models/ColonyModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import Card from '@/client/components/card/Card.vue';
import GlobalEvent from '@/client/components/turmoil/GlobalEvent.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import Colony from '@/client/components/colonies/Colony.vue';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';
import {CardModel} from '@/common/models/CardModel';
import {logCardModel} from '@/client/components/logpanel/logCardModel';
import {logMessageCards, logMessageColonies, logMessageGlobalEvents} from '@/client/components/logpanel/logMessageContent';

export default defineComponent({
  name: 'LogPanel',
  // Attribute gibt das Template selbst an das Panel weiter (Teleport als Wurzel)
  inheritAttrs: false,
  props: {
    message: {
      type: Object as () => LogMessage,
      required: true,
    },
    players: {
      type: Array as () => Array<PublicPlayerModel>,
      required: true,
    },
    // Als schwebende Hover-Vorschau neben dem Log statt als Block darunter
    floating: {
      type: Boolean,
      default: false,
    },
    // Als scrollbares Modal über der rechten Spalte (Zeilen mit vielen Karten, needsModalPreview)
    modal: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    AppButton,
    Card,
    Colony,
    GlobalEvent,
  },
  computed: {
    show(): boolean {
      return this.cards.length + this.globalEvents.length + this.colonies.length > 0;
    },
    cards(): ReadonlyArray<CardName> {
      return logMessageCards(this.message);
    },
    globalEvents(): Array<GlobalEventName> {
      return logMessageGlobalEvents(this.message);
    },
    colonies(): Array<ColonyName> {
      return logMessageColonies(this.message);
    },
  },
  // Escape schließt das Modal
  mounted() {
    window.addEventListener('keydown', this.closeOnEscape);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.closeOnEscape);
  },
  methods: {
    closeOnEscape(event: KeyboardEvent) {
      if (this.modal && event.key === 'Escape') {
        this.hideMe();
      }
    },
    hideMe() {
      this.$emit('hide');
    },
    getColony(name: ColonyName): ColonyModel {
      return simpleColonyModel(name);
    },
    cardModel(name: CardName): CardModel {
      return logCardModel(name, this.players);
    },
  },
});

</script>
