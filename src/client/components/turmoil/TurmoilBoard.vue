<template>
  <div class="turmoil-board-tab">
    <!-- Turmoil board tab: ruling policy on top, the committee as a hemicycle (parties, seats, leaders, chair, dominance),
         lobby and reserve in the free corners, the neutral delegates explained, the global events in time order -->
    <div v-if="turmoil.ruling !== undefined" class="turmoil-board-tab__policy">
      <span class="turmoil-board-tab__ruling-party">
        <img :src="partyImage(turmoil.ruling)" alt="">
        <span><small>{{ $t('Ruling') }}</small><b>{{ $t(turmoil.ruling) }}</b></span>
      </span>
      <span class="turmoil-board-tab__policy-text">{{ $t(agendaText(agenda(turmoil.ruling).policy)) }}</span>
      <span v-if="viewer !== undefined" class="turmoil-board-tab__influence">{{ $t('Influence') }} <b>{{ viewer.influence }}</b></span>
    </div>

    <div class="turmoil-board-tab__hemicycle">
      <svg :viewBox="'0 0 ' + HEMICYCLE_WIDTH + ' ' + HEMICYCLE_HEIGHT" class="turmoil-board-tab__svg" role="group">
        <defs>
          <radialGradient v-for="party in turmoil.parties" :key="party.name" :id="gradientId(party.name)"
            :cx="CHAIR_CENTER.x" :cy="CHAIR_CENTER.y" :r="GRADIENT_RADIUS" gradientUnits="userSpaceOnUse">
            <stop offset="0.25" :stop-color="PARTY_COLOR[party.name]" stop-opacity=".5"/>
            <stop offset="1" :stop-color="PARTY_COLOR[party.name]" stop-opacity=".95"/>
          </radialGradient>
        </defs>
        <g v-for="(party, index) in turmoil.parties" :key="party.name" class="turmoil-board-tab__party" v-flash="flashKeys.turmoilParty(party.name)">
          <title>{{ $t(party.name) }}</title>
          <path :d="wedges[index].path" :fill="'url(#' + gradientId(party.name) + ')'" class="turmoil-board-tab__wedge"/>
          <template v-for="(seat, seatIndex) in wedges[index].seats" :key="seatIndex">
            <image v-if="seated(party)[seatIndex] !== undefined" :href="figureImage(seated(party)[seatIndex])"
              :x="seat.x - 20" :y="seat.y - 26" width="40" :height="40 * FIGURE_RATIO"/>
            <image v-else :href="figureImage(undefined)" :x="seat.x - 17" :y="seat.y - 22" width="34" :height="34 * FIGURE_RATIO" class="turmoil-board-tab__seat-empty"/>
          </template>
          <g :transform="'translate(' + wedges[index].leader.x + ' ' + wedges[index].leader.y + ') rotate(' + (wedges[index].middle - 90) + ')'">
            <rect x="-30" y="-25" width="60" height="50" rx="8" class="turmoil-board-tab__leader-seat"/>
          </g>
          <image v-if="party.partyLeader !== undefined" :href="figureImage(party.partyLeader)"
            :x="wedges[index].leader.x - 23" :y="wedges[index].leader.y - 27" width="46" :height="46 * FIGURE_RATIO"/>
          <image :href="partyImage(party.name)" :x="wedges[index].icon.x - 44" :y="wedges[index].icon.y - 32" width="88" height="64" class="turmoil-board-tab__party-icon"/>
          <g v-if="party.name === turmoil.ruling" class="turmoil-board-tab__ruling-badge">
            <rect :x="wedges[index].icon.x - 48" :y="wedges[index].icon.y + 30" width="96" height="22" rx="5"/>
            <text :x="wedges[index].icon.x" :y="wedges[index].icon.y + 46">{{ $t('Ruling') }}</text>
          </g>
          <rect v-if="party.name === turmoil.dominant" :x="wedges[index].dominance.x - 15" :y="wedges[index].dominance.y - 15" width="30" height="30" rx="6" class="turmoil-board-tab__dominance"/>
        </g>
        <path :d="chairPath" class="turmoil-board-tab__chair"/>
        <image v-if="turmoil.chairman !== undefined" :href="figureImage(turmoil.chairman)" :x="CHAIR_CENTER.x - 27" :y="CHAIR_CENTER.y + 8" width="54" :height="54 * FIGURE_RATIO"/>
        <text :x="CHAIR_CENTER.x" :y="CHAIR_CENTER.y + 98" class="turmoil-board-tab__chair-label">{{ $t('Chairman') }}</text>
        <path v-if="pickWedge !== undefined" :d="pickWedge" class="turmoil-board-tab__pick"/>
      </svg>
      <div class="turmoil-board-tab__corner turmoil-board-tab__corner--left" v-flash="flashKeys.turmoil('lobby')">
        <b>{{ $t('Lobby') }}</b>
        <span class="turmoil-board-tab__figures">
          <img v-for="(color, index) in turmoil.lobby" :key="index" :src="figureImage(color)" width="22" :height="22 * FIGURE_RATIO" alt="">
        </span>
        <small>{{ $t('free · 1×/gen.') }}</small>
      </div>
      <div class="turmoil-board-tab__corner turmoil-board-tab__corner--right">
        <b>{{ $t('Reserve') }}</b>
        <span class="turmoil-board-tab__figures">
          <span class="turmoil-board-tab__cost">5</span>
          <img v-for="index in Math.min(reserveOwn, 4)" :key="index" :src="figureImage(viewerColor)" width="18" :height="18 * FIGURE_RATIO" alt="">
          <b v-if="reserveOwn > 4" class="turmoil-board-tab__more">+{{ reserveOwn - 4 }}</b>
        </span>
        <small>{{ $t('5 M€ per delegate') }}</small>
      </div>
    </div>

    <div class="turmoil-board-tab__neutral">
      <img :src="figureImage('neutral')" alt="">
      <p><b>{{ $t('Neutral delegates') }}</b> {{ $t('belong to no player. The game places them itself – two per generation: one when a new event is revealed and one when an event starts. The event card shows which party.') }}</p>
      <small>{{ $t('${0} left in supply', [String(neutralLeft)]) }}</small>
    </div>

    <!-- Events in time order: a row below in a tall box, a column on the right in a wide one (container query) -->
    <div class="turmoil-board-tab__events">
      <template v-for="(slot, index) in eventSlots" :key="slot.type">
        <span v-if="index > 0" class="turmoil-board-tab__event-arrow" aria-hidden="true">›</span>
        <TurmoilEventCard :name="slot.name" :type="slot.type" :generation="generation + slot.offset" :label="slot.label"/>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {TurmoilModel, PartyModel} from '@/common/models/TurmoilModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {PartyName} from '@/common/turmoil/PartyName';
import {Color} from '@/common/Color';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';
import TurmoilEventCard from './TurmoilEventCard.vue';
import {vFlash} from '@/client/directives/ChangeFlash';
import {flashKeys} from '@/client/utils/changeFlashKeys';
import {PARTY_COLOR, PartyAgenda, agendaText, delegatesOf, figureImage, partyAgenda, partyImage, seatedDelegates, turmoilPickState} from './turmoilView';
import {CHAIR_CENTER, FIGURE_RATIO, GRADIENT_RADIUS, HEMICYCLE_HEIGHT, HEMICYCLE_WIDTH, Wedge, chairPath, wedge} from './turmoilHemicycle';

type EventSlot = {type: 'current' | 'coming' | 'distant', name: GlobalEventName, offset: number, label: string};

// Neutral delegates in the game (board game supply)
const NEUTRAL_DELEGATES = 14;

export default defineComponent({
  name: 'TurmoilBoard',
  components: {TurmoilEventCard},
  directives: {flash: vFlash},
  props: {
    turmoil: {
      type: Object as PropType<TurmoilModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    viewerColor: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
    generation: {
      type: Number,
      required: true,
    },
  },
  computed: {
    flashKeys(): typeof flashKeys {
      return flashKeys;
    },
    PARTY_COLOR(): typeof PARTY_COLOR {
      return PARTY_COLOR;
    },
    HEMICYCLE_WIDTH(): number {
      return HEMICYCLE_WIDTH;
    },
    HEMICYCLE_HEIGHT(): number {
      return HEMICYCLE_HEIGHT;
    },
    CHAIR_CENTER(): typeof CHAIR_CENTER {
      return CHAIR_CENTER;
    },
    GRADIENT_RADIUS(): number {
      return GRADIENT_RADIUS;
    },
    FIGURE_RATIO(): number {
      return FIGURE_RATIO;
    },
    // Neutral delegates still in the supply: all minus those seated (and the chair)
    neutralLeft(): number {
      const seated = this.turmoil.parties.reduce((sum, party) => sum + delegatesOf(party).filter((color) => color === 'neutral').length, 0);
      return Math.max(0, NEUTRAL_DELEGATES - seated - (this.turmoil.chairman === 'neutral' ? 1 : 0));
    },
    chairPath(): string {
      return chairPath();
    },
    wedges(): Array<Wedge> {
      return this.turmoil.parties.map((_, index) => wedge(index, this.turmoil.parties.length));
    },
    // Outline of the party picked in the delegate tab, drawn last so neighbours don't cover it
    pickWedge(): string | undefined {
      const index = this.turmoil.parties.findIndex((party) => party.name === turmoilPickState.pick);
      return index < 0 ? undefined : this.wedges[index].path;
    },
    viewer(): PublicPlayerModel | undefined {
      return this.players.find((player) => player.color === this.viewerColor);
    },
    // Own delegates left in the reserve (the others' reserves don't matter for your decisions)
    reserveOwn(): number {
      return this.turmoil.reserve.find((delegate) => delegate.color === this.viewerColor)?.number ?? 0;
    },
    // Time order: this generation → next → the one after
    eventSlots(): Array<EventSlot> {
      const slots: Array<EventSlot> = [];
      if (this.turmoil.current !== undefined) {
        slots.push({type: 'current', name: this.turmoil.current, offset: 0, label: 'This generation'});
      }
      if (this.turmoil.coming !== undefined) {
        slots.push({type: 'coming', name: this.turmoil.coming, offset: 1, label: 'Next generation'});
      }
      if (this.turmoil.distant !== undefined) {
        slots.push({type: 'distant', name: this.turmoil.distant, offset: 2, label: 'In 2 generations'});
      }
      return slots;
    },
  },
  methods: {
    partyImage,
    figureImage,
    agendaText,
    agenda(party: PartyName): PartyAgenda {
      return partyAgenda(this.turmoil, party);
    },
    seated(party: PartyModel): Array<Color> {
      return seatedDelegates(party);
    },
    gradientId(party: PartyName): string {
      return 'turmoil-gradient-' + party.toLowerCase().replace(/ /g, '-');
    },
  },
});
</script>
