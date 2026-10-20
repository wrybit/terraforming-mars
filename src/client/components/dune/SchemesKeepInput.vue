<template>
  <!-- House schemes, end of generation (SCHEMES_TITLE, server/dune/Schemes.ts keepInput): a House reached 35 on the
       Landsraad track, so every player with two agendas keeps one. Says who reached it, shows both agendas as the cards
       of the schemes tab; a click (or the number key) picks one, the button keeps it (Jens, 20 Oct 2026). -->
  <div class="schemes-keep" data-test="schemes-keep">
    <p class="schemes-keep__reason">
      <PlayerChip v-for="player in reachedBy" :key="player.color" :color="player.color" :players="playerView.players"/>
      <span>{{ $t(reachedBy.length > 1 ? 'have reached 35 or more on the Landsraad track.' : 'has reached 35 or more on the Landsraad track.') }}</span>
    </p>
    <p class="schemes-keep__hint">{{ $t('Every House with two agendas now keeps only one, the other is discarded. Choose the agenda you keep.') }}</p>
    <div class="dune-schemes__cards schemes-keep__cards">
      <label v-for="(agenda, index) in agendas" :key="agenda.name"
        :class="['schemes-keep__choice', {'schemes-keep__choice--chosen': chosen === index}]" :data-test="'schemes-keep-' + index">
        <input type="radio" class="choice-option-input" name="schemes-keep" :checked="chosen === index" @change="chosen = index">
        <SchemeAgendaCard :agenda="agenda"/>
        <span class="schemes-keep__key">{{ index + 1 }}</span>
      </label>
    </div>
    <TabPanelFooterSlot>
      <div v-if="showsave" class="schemes-keep__actions">
        <AppButton hotkey="proceed" size="big" :disabled="chosen === undefined" :title="$t('Keep')" @click="save"/>
      </div>
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {OrOptionsModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import {SCHEME_REDUCTION_TR} from '@/common/dune/schemeAgendas';
import PlayerChip from './PlayerChip.vue';
import SchemeAgendaCard, {AgendaProgress} from './SchemeAgendaCard.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';

export default defineComponent({
  name: 'SchemesKeepInput',
  components: {PlayerChip, SchemeAgendaCard, AppButton, TabPanelFooterSlot},
  props: {
    playerView: {
      type: Object as PropType<PlayerViewModel>,
      required: true,
    },
    playerinput: {
      type: Object as PropType<OrOptionsModel>,
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
  data() {
    return {
      chosen: undefined as number | undefined,
    };
  },
  computed: {
    // Every House at 35 TR or more (the Landsraad track of the Dune theme): one of them started the choice
    reachedBy(): ReadonlyArray<PublicPlayerModel> {
      return this.playerView.players.filter((player) => player.terraformRating >= SCHEME_REDUCTION_TR);
    },
    // One card per option, in the order of the options; the option names the agenda ('Keep ${0}')
    agendas(): ReadonlyArray<AgendaProgress> {
      const own = this.playerView.game.dune?.schemes?.players.find((entry) => entry.color === this.playerView.thisPlayer.color)?.agendas ?? [];
      return this.playerinput.options.map((option) => {
        const title = option.title;
        const name = typeof title === 'string' ? title : String(title.data[0]?.value ?? '');
        return own.find((agenda) => agenda.name === name) ?? {name, value: 0, level: 0};
      });
    },
  },
  methods: {
    save(): void {
      if (this.chosen !== undefined) {
        this.onsave({type: 'or', index: this.chosen, response: {type: 'option'}});
      }
    },
  },
});
</script>
