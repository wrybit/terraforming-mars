<template>
  <!-- Mentat Calculation (MENTAT_TITLE, server/dune/Schemes.ts mentatInput): above the own agendas, below the top 3 of
       the deck, all as real agenda cards. One click above and one below says what is swapped for what; the button
       swaps, or both are kept (Jens, 21 Oct 2026: graphic instead of a list of "A for B" texts). The agenda that goes
       glows red, the one that comes green. -->
  <div class="mentat-swap" data-test="mentat-swap">
    <p class="schemes-keep__hint mentat-swap__hint">{{ $t('Mentat Calculation') }} · {{ $t('Choose one of your agendas and one from the deck.') }}</p>

    <section class="mentat-swap__group">
      <h4 class="mentat-swap__label">{{ $t('Your agendas') }}</h4>
      <div class="dune-schemes__cards mentat-swap__cards" :style="{'--mentat-cards': own.length}">
        <button v-for="agenda in own" :key="agenda.name" type="button"
          :class="['schemes-keep__choice', 'mentat-swap__choice', {'mentat-swap__choice--out': chosenOwn === agenda.name}]"
          :data-test="'mentat-own-' + agenda.name" @click="chosenOwn = agenda.name">
          <SchemeAgendaCard :agenda="agenda"/>
        </button>
      </div>
    </section>

    <!-- Arrows between the rows: the chosen cards change places -->
    <div :class="['mentat-swap__arrows', {'mentat-swap__arrows--ready': canSwap}]" aria-hidden="true">⇅</div>

    <section class="mentat-swap__group">
      <h4 class="mentat-swap__label">{{ $t('Top of the agenda deck') }}</h4>
      <div class="dune-schemes__cards mentat-swap__cards" :style="{'--mentat-cards': deck.length}">
        <button v-for="agenda in deck" :key="agenda.name" type="button"
          :class="['schemes-keep__choice', 'mentat-swap__choice', {'mentat-swap__choice--in': chosenNew === agenda.name}]"
          :data-test="'mentat-new-' + agenda.name" @click="chosenNew = agenda.name">
          <SchemeAgendaCard :agenda="agenda"/>
        </button>
      </div>
    </section>

    <TabPanelFooterSlot>
      <div v-if="showsave" class="mentat-swap__actions">
        <AppButton size="big" :title="$t('Keep my agendas')" data-test="mentat-keep" @click="keep"/>
        <AppButton hotkey="proceed" size="big" :disabled="!canSwap" :title="$t('Swap agendas')" data-test="mentat-swap-button" @click="swap"/>
      </div>
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {OrOptionsModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import {MENTAT_KEEP_TITLE} from '@/common/dune/duneActionTitles';
import SchemeAgendaCard, {AgendaProgress} from './SchemeAgendaCard.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';

type OptionTitle = OrOptionsModel['options'][number]['title'];

// The values of a choice's title ('Swap ${0} for ${1}': own agenda, new agenda)
function titleValues(title: OptionTitle): ReadonlyArray<string> {
  return typeof title === 'string' ? [] : title.data.map((entry) => String(entry.value));
}

function titleText(title: OptionTitle): string {
  return typeof title === 'string' ? title : title.message;
}

export default defineComponent({
  name: 'MentatSwapInput',
  components: {SchemeAgendaCard, AppButton, TabPanelFooterSlot},
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
      chosenOwn: undefined as string | undefined,
      chosenNew: undefined as string | undefined,
    };
  },
  computed: {
    // The own agendas with their progress (schemes tab model); names from the choices, so the order matches
    own(): ReadonlyArray<AgendaProgress> {
      const schemes = this.playerView.game.dune?.schemes;
      const progress = schemes?.players.find((entry) => entry.color === this.playerView.thisPlayer.color)?.agendas ?? [];
      const names = [...new Set(this.playerinput.options.map((option) => titleValues(option.title)[0]).filter((name) => name !== undefined))];
      return names.map((name) => progress.find((agenda) => agenda.name === name) ?? {name, value: 0, level: 0});
    },
    // The top 3 of the deck with the values they would count for the viewer (SchemeModel.look)
    deck(): ReadonlyArray<AgendaProgress> {
      const look = this.playerView.game.dune?.schemes?.look;
      const progress = look?.kind === 'mentat' ? look.agendas : [];
      const names = [...new Set(this.playerinput.options.map((option) => titleValues(option.title)[1]).filter((name) => name !== undefined))];
      return names.map((name) => progress.find((agenda) => agenda.name === name) ?? {name, value: 0, level: 0});
    },
    canSwap(): boolean {
      return this.swapIndex !== undefined;
    },
    swapIndex(): number | undefined {
      const index = this.playerinput.options.findIndex((option) => {
        const [mine, other] = titleValues(option.title);
        return mine === this.chosenOwn && other === this.chosenNew;
      });
      return index < 0 ? undefined : index;
    },
  },
  methods: {
    choose(index: number): void {
      this.onsave({type: 'or', index, response: {type: 'option'}});
    },
    swap(): void {
      if (this.swapIndex !== undefined) {
        this.choose(this.swapIndex);
      }
    },
    keep(): void {
      const index = this.playerinput.options.findIndex((option) => titleText(option.title) === MENTAT_KEEP_TITLE);
      if (index >= 0) {
        this.choose(index);
      }
    },
  },
});
</script>
