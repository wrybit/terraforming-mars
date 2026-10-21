<template>
  <!-- Tleilaxu Spy (SPY_VIEW_TITLE, server/dune/Schemes.ts spyInput): after choosing the player, a tab with that player's
       agendas as real agenda cards with their progress, closed by the button (Jens, 21 Oct 2026) -->
  <div class="schemes-keep" data-test="spy-agendas">
    <p v-if="target !== undefined" class="schemes-keep__reason">
      <PlayerChip :color="target" :players="playerView.players"/>
      <span>{{ $t('holds these agendas:') }}</span>
    </p>
    <div class="dune-schemes__cards schemes-keep__cards">
      <SchemeAgendaCard v-for="agenda in agendas" :key="agenda.name" :agenda="agenda"/>
    </div>
    <TabPanelFooterSlot>
      <div v-if="showsave" class="schemes-keep__actions">
        <AppButton hotkey="proceed" size="big" :title="$t('Done')" data-test="spy-done" @click="done"/>
      </div>
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {SelectOptionModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import {Color} from '@/common/Color';
import PlayerChip from './PlayerChip.vue';
import SchemeAgendaCard, {AgendaProgress} from './SchemeAgendaCard.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';

export default defineComponent({
  name: 'SpyAgendasInput',
  components: {PlayerChip, SchemeAgendaCard, AppButton, TabPanelFooterSlot},
  props: {
    playerView: {
      type: Object as PropType<PlayerViewModel>,
      required: true,
    },
    playerinput: {
      type: Object as PropType<SelectOptionModel>,
      required: true,
    },
    onsave: {
      type: Function as PropType<(out: InputResponse) => void>,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  computed: {
    // What the spy looks at (SchemeModel.look, only in the spy's model)
    target(): Color | undefined {
      const look = this.playerView.game.dune?.schemes?.look;
      return look?.kind === 'spy' ? look.target : undefined;
    },
    agendas(): ReadonlyArray<AgendaProgress> {
      const look = this.playerView.game.dune?.schemes?.look;
      return look?.kind === 'spy' ? look.agendas : [];
    },
  },
  methods: {
    done(): void {
      this.onsave({type: 'option'});
    },
  },
});
</script>
