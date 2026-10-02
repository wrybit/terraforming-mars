<template>
  <!-- Attach the modal to body: in the log (own stacking context) it would otherwise lie below the icons at top right -->
  <Teleport to="body" :disabled="!modal">
  <!-- The root is the Teleport, so attributes (e.g. the hover preview's position as style) don't land here on their own -->
  <div :class="['card-panel', {'card-panel--floating': floating, 'card-panel--modal': modal}]" v-bind="$attrs" v-if="message !== undefined && show">
    <!-- Hover preview closes itself when leaving the row, needs no button -->
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
  // The template passes attributes on to the panel itself (Teleport as root)
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
    // As a floating hover preview next to the log instead of a block below it
    floating: {
      type: Boolean,
      default: false,
    },
    // As a scrollable modal over the right column (rows with many cards, needsModalPreview)
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
  // Escape closes the modal
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
