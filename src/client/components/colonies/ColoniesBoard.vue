<template>
  <div class="colonies-board">
    <!-- Colonies board tab: each tile close to the board game – the whole planet on the left, the trade track as an orbit
         of steps with the marker, the colony slots on the first three steps, trade fleets as shuttles.
         Below the hangar with all fleets and the trade fee. -->
    <div v-for="colony in views" :key="colony.model.name" :class="tileClasses(colony)"
      :style="{'--planet-tone': colony.tone}" :data-test="'colony-tile-' + colony.model.name">
      <span v-if="isPicked(colony)" class="colonies-board__flag">✓</span>
      <span class="colonies-board__art"><ColonyPlanet :name="colony.model.name"/></span>
      <div class="colonies-board__body">
        <div class="colonies-board__head">
          <b class="colonies-board__name">{{ $t(colony.model.name) }}</b>
          <span class="colonies-board__meta">
            <span>{{ $t('Build:') }} <b>{{ $t(colony.metadata.build.description) }}</b><template v-if="colony.full"> · {{ $t('full') }}</template></span>
            <span>{{ $t('Colony bonus:') }} <b>{{ $t(colony.metadata.colony.description) }}</b></span>
          </span>
        </div>
        <div class="colonies-board__track">
          <span v-for="(value, index) in colony.track" :key="index" class="colonies-board__cell">
            <span :class="stepClasses(colony, index)">
              <PlayerCube v-if="slotOwner(colony, index) !== undefined" :color="slotOwner(colony, index)!" view="slight" :size="13"/>
              <template v-else>
                <b>{{ value }}</b>
                <img v-if="index === colony.model.trackPosition" class="colonies-board__step-icon" :src="'assets/' + colony.tradeIcon.src" alt="">
              </template>
            </span>
          </span>
        </div>
      </div>
      <div class="colonies-board__value">
        <span v-if="colony.model.visitor !== undefined" class="colonies-board__docked" :style="{'--player': playerColor(colony.model.visitor)}">
          <TradeShip :color="colony.model.visitor" :size="30"/>{{ playerName(colony.model.visitor) }}
        </span>
        <span class="colonies-board__big">{{ colony.tradeValue }}<span :class="{'colonies-board__production': colony.tradeIcon.production}"><img :src="'assets/' + colony.tradeIcon.src" alt=""></span></span>
        <small v-if="colony.model.isActive">{{ $t(statusText(colony)) }}</small>
        <small v-else class="colonies-board__unlock" :title="$t('Becomes active once a card is played that collects these resources')">{{ $t('inactive') }}</small>
      </div>
    </div>
    <div class="colonies-board__hangar">
      <span class="colonies-board__hangar-label">
        <b>{{ $t('Fleets') }}</b>
        <span class="colonies-board__fee">9<img src="assets/resources/megacredit.png" alt=""><i>·</i>3<img src="assets/resources/power.png" alt=""><i>·</i>3<img src="assets/resources/titanium.png" alt=""></span>
      </span>
      <span class="colonies-board__berths">
        <span v-for="berth in berths" :key="berth.key" :class="['colonies-board__berth', {'colonies-board__berth--away': berth.away, 'colonies-board__berth--me': berth.color === viewerColor}]">
          <TradeShip :color="berth.color" :size="28"/>{{ berth.name }}<small v-if="berth.away">→ {{ $t(berth.away) }}</small>
        </span>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ColonyModel} from '@/common/models/ColonyModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {ColonyName} from '@/common/colonies/ColonyName';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import ColonyPlanet from './ColonyPlanet.vue';
import TradeShip from './TradeShip.vue';
import {ColonyView, bestTrade, colonyView} from './colonyView';
import {colonyTradeState} from './colonyTradeState';

type Berth = {key: string, color: Color, name: string, away: ColonyName | undefined};

// Player colours for the docked fleet's outline (same as the colour cubes)
const PLAYER_TONE: Record<string, string> = {
  red: '#e2463e', green: '#3fb34a', blue: '#3b84f0', yellow: '#e8c21f', purple: '#a356d6', orange: '#f08a2e', black: '#9aa0aa', pink: '#ec7cb9', neutral: '#ccc',
};

export default defineComponent({
  name: 'ColoniesBoard',
  components: {PlayerCube, ColonyPlanet, TradeShip},
  props: {
    colonies: {
      type: Array as PropType<ReadonlyArray<ColonyModel>>,
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
  },
  computed: {
    views(): Array<ColonyView> {
      return this.colonies.map(colonyView);
    },
    best(): ColonyView | undefined {
      return bestTrade(this.views);
    },
    // One shuttle per fleet: in the hangar, or away at the colony it trades with this generation
    berths(): Array<Berth> {
      return this.players.flatMap((player) => {
        const away = this.colonies.filter((colony) => colony.visitor === player.color).map((colony) => colony.name);
        return Array.from({length: Math.max(player.fleetSize, away.length)}, (_, index) => ({
          key: player.color + index,
          color: player.color,
          name: player.name,
          away: away[index],
        }));
      });
    },
  },
  methods: {
    isPicked(colony: ColonyView): boolean {
      return colonyTradeState.mode !== undefined && colonyTradeState.pick === colony.model.name;
    },
    tileClasses(colony: ColonyView): Array<string> {
      const classes = ['colonies-board__tile'];
      if (!colony.model.isActive) {
        classes.push('colonies-board__tile--off');
      } else if (this.isPicked(colony)) {
        classes.push('colonies-board__tile--pick');
      } else if (colony === this.best && colonyTradeState.pick === undefined) {
        classes.push('colonies-board__tile--best');
      }
      if (colony.model.visitor !== undefined) {
        classes.push('colonies-board__tile--docked');
      }
      return classes;
    },
    // Colony cube on one of the first three steps; while building, the own cube waits on the next free slot
    slotOwner(colony: ColonyView, index: number): Color | undefined {
      if (index >= 3) {
        return undefined;
      }
      const owner = colony.model.colonies[index];
      if (owner !== undefined) {
        return owner;
      }
      const building = this.isPicked(colony) && colonyTradeState.mode === 'build';
      if (building && index === colony.model.colonies.length && this.viewerColor !== undefined && !colony.model.colonies.includes(this.viewerColor)) {
        return this.viewerColor;
      }
      return undefined;
    },
    stepClasses(colony: ColonyView, index: number): Array<string> {
      const position = colony.model.trackPosition;
      const owner = this.slotOwner(colony, index);
      const ghost = owner !== undefined && colony.model.colonies[index] === undefined;
      const trading = this.isPicked(colony) && colonyTradeState.mode === 'trade';
      const classes = ['colonies-board__step'];
      if (index === position && owner === undefined) {
        classes.push('colonies-board__step--at');
      }
      if (index < position && owner === undefined) {
        classes.push('colonies-board__step--past');
      }
      if (index < 3) {
        classes.push('colonies-board__step--slot');
      }
      if (owner !== undefined) {
        classes.push('colonies-board__step--colony');
      }
      if (ghost) {
        classes.push('colonies-board__step--ghost');
      }
      if (trading && owner !== undefined && !ghost) {
        classes.push('colonies-board__step--gets');
      }
      if (trading && index === colony.resetPosition && index !== position) {
        classes.push('colonies-board__step--reset');
      }
      return classes;
    },
    statusText(colony: ColonyView): string {
      if (colony.model.visitor !== undefined) {
        return 'taken';
      }
      return colony === this.best ? 'best trade' : 'tradeable';
    },
    playerName(color: Color): string {
      return this.players.find((player) => player.color === color)?.name ?? color;
    },
    playerColor(color: Color): string {
      return PLAYER_TONE[color] ?? '#ccc';
    },
  },
});
</script>
