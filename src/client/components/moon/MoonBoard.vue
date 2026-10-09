<template>
  <!-- Is board-cont necessary? -->
  <div :class="['board-cont', 'moon-board', {'moon-board--ring': ring}]" id="moon_board">
    <!-- Ring layout (board tab): the three rates as curved tracks around the Moon (moonRing.ts), bonuses as chips outside -->
    <template v-if="ring">
      <svg class="moon-ring__svg" :viewBox="'0 0 ' + RING_BOARD_SIZE + ' ' + RING_BOARD_SIZE" aria-hidden="true">
        <g v-for="band in ringBands" :key="band.rate" class="moon-ring__band">
          <path :d="band.slot.path" :fill="band.slot.fill"/>
          <image :href="band.icon.href" :x="band.icon.x" :y="band.icon.y" width="26" height="26"/>
          <path v-for="(cell, index) in band.cells" :key="'c' + index" :d="cell.path" :fill="cell.fill"/>
          <line v-for="(line, index) in band.lines" :key="'l' + index" v-bind="line" stroke="rgba(255,255,255,.45)" stroke-width="1"/>
          <path :d="band.outline" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1"/>
        </g>
      </svg>
      <div class="moon-ring__numbers">
        <template v-for="rate in MOON_RATES" :key="rate">
          <div v-for="lvl in getValuesForParameter(rate)" :key="lvl.value"
            :class="['moon-ring__value', {'moon-ring__value--active': lvl.isActive}]"
            :style="ringCellStyle(rate, lvl.value)"
            v-flash="lvl.isActive ? flashKeys.moonRate(rate) : undefined">{{ lvl.strValue }}</div>
        </template>
      </div>
      <div v-for="pin in ringBonusPins" :key="pin.key" class="moon-ring__bonus" :style="pin.style">
        <span :class="['track-bonus-pin', {'track-bonus-pin--done': pin.done}]">
          <span class="track-bonus-pin__chips" :style="pin.chipStyle"><TrackBonusChip :bonus="pin.bonus" :kind="pin.done ? 'done' : 'own'"/></span>
          <span class="track-bonus-link"></span>
        </span>
      </div>
    </template>
    <svg v-else id="moon_board_legend" height="550" width="630" class="board-legend">
      <g id="mare_imbrium" transform="translate(250, 40)">
        <text class="board-caption">
          <tspan dy="15">Mare</tspan>
          <tspan x="12" dy="12">Imbrium</tspan>
        </text>
        <line x1="24" y1="34" x2="33" y2="105" class="board-line"/>
        <text x="30" y="107" class="board-caption board_caption--black">●</text>
      </g>

      <g id="mare_sereitatis" transform="translate(485, 140)">
        <text class="board-caption">
            <tspan dy="15">Mare</tspan>
            <tspan x="4" dy="12">Serenitatis</tspan>
        </text>
        <line x1="0" y1="25" x2="-120" y2="50" class="board-line"/>
        <text x="-122" y="53" class="board-caption board_caption--black">●</text>
      </g>


      <g id="mare_nubium" transform="translate(195, 350)">
        <text class="board-caption">
          <tspan dy="15">Mare</tspan>
          <tspan x="-2" dy="12">Nubium</tspan>
        </text>
        <line x1="29" y1="14" x2="115" y2="-64" class="board-line"/>
        <text x="113" y="-62" class="board-caption board_caption--black">●</text>
      </g>

      <g id="mare_nectaris" transform="translate(450, 300)">
        <text class="board-caption" dx="47">
          <tspan dy="15">Mare</tspan>
          <tspan dy="12" x="48">Nectaris</tspan>
        </text>
        <line x1="-39" y1="-12" x2="45" y2="15" class="board-line"/>
        <text x="-39" y="-9" class="board-caption board_caption--black">&#x25cf;</text>
      </g>
    </svg>

    <div id="moon_board_outer_spaces" class="board-outer-spaces">
      <MoonSpace :space="getSpaceById('m01')" text="Luna Trade Station"/>
      <MoonSpace :space="getSpaceById('m37')" text="Momentum Virium Habitat"/>
    </div>

    <div v-if="!ring" class="global-numbers">
      <div class="global-numbers-habitat">
        <div :class="getScaleCSS(lvl)" v-for="(lvl, i) in getValuesForParameter('habitat')" :key="i" v-flash="lvl.isActive ? flashKeys.moonRate('habitat') : undefined">{{ lvl.strValue }}</div>
      </div>

      <div class="global-numbers-logistic">
        <div :class="getScaleCSS(lvl)" v-for="(lvl, i) in getValuesForParameter('logistic')" :key="i" v-flash="lvl.isActive ? flashKeys.moonRate('logistic') : undefined">{{ lvl.strValue }}</div>
      </div>

      <div class="global-numbers-mining">
        <div :class="getScaleCSS(lvl)" v-for="(lvl, i) in getValuesForParameter('mining')" :key="i" v-flash="lvl.isActive ? flashKeys.moonRate('mining') : undefined">{{ lvl.strValue }}</div>
      </div>

    </div>

    <div class="board" id="moon_board">
      <MoonSpace
        v-for="space in allNonColonySpaces"
        :key="space.id"
        :space="space"
        :tileView="tileView"
        data-test="moon-board-space"
      />
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {MoonModel} from '@/common/models/MoonModel';
import {SpaceModel} from '@/common/models/SpaceModel';
import {SpaceType} from '@/common/boards/SpaceType';
import MoonSpace from '@/client/components/moon/MoonSpace.vue';
import TrackBonusChip from '@/client/components/trackBonus/TrackBonusChip.vue';
import {TrackBonus} from '@/client/components/trackBonus/trackBonus';
import {MOON_RATES, MoonRate, RING_BOARD_SIZE, RingBand, moonRateBonuses, ringBand, ringBonusAnchor, ringCell} from '@/client/components/moon/moonRing';
import {TileView} from '../board/TileView';
import {SpaceId} from '@/common/Types';
import {comparing} from '@/common/utils/Ordering';
import {vFlash} from '@/client/directives/ChangeFlash';
import {flashKeys} from '@/client/utils/changeFlashKeys';

type RingBonusPin = {
  key: string,
  bonus: TrackBonus,
  done: boolean,
  style: Record<string, string>,
  chipStyle: Record<string, string>,
};

type MoonParamLevel = {
  value: number,
  isActive: boolean,
  strValue: string,
};

export default defineComponent({
  name: 'MoonBoard',
  props: {
    model: {
      type: Object as () => MoonModel,
      required: true,
    },
    tileView: {
      type: String as () => TileView,
      default: 'show',
    },
    // Rates as curved tracks around the Moon (board tab in the right column)
    ring: {
      type: Boolean,
      default: false,
    },
  },
  directives: {
    flash: vFlash,
  },
  components: {
    MoonSpace,
    TrackBonusChip,
  },
  computed: {
    RING_BOARD_SIZE(): number {
      return RING_BOARD_SIZE;
    },
    MOON_RATES(): ReadonlyArray<MoonRate> {
      return MOON_RATES;
    },
    ringBands(): Array<RingBand> {
      return MOON_RATES.map(ringBand);
    },
    // Chips outside the band; reached ones are handed out (grey)
    ringBonusPins(): Array<RingBonusPin> {
      return MOON_RATES.flatMap((rate) => Object.entries(moonRateBonuses(rate)).map(([value, bonus]) => {
        const anchor = ringBonusAnchor(rate, Number(value));
        // Pin points with its connector to the centre; the chip turns back so it stays upright
        const inward = anchor.angle + 180;
        return {
          key: rate + value,
          bonus,
          done: this.rateValue(rate) >= Number(value),
          style: {left: anchor.left + 'px', top: anchor.top + 'px', transform: `translate(-100%, -50%) rotate(${inward}deg)`},
          chipStyle: {transform: `rotate(${-inward}deg)`},
        };
      }));
    },
    flashKeys(): typeof flashKeys {
      return flashKeys;
    },
    allNonColonySpaces(): Array<SpaceModel> {
      return this.model.spaces
        .filter((space) => space.spaceType !== SpaceType.COLONY)
        .toSorted(comparing((space) => parseInt(space.id)));
    },
  },
  methods: {
    getSpaceById(spaceId: SpaceId) {
      for (const space of this.model.spaces) {
        if (space.id === spaceId) {
          return space;
        }
      }
      throw new Error('Board space not found by id \'' + spaceId + '\'');
    },
    rateValue(rate: MoonRate): number {
      switch (rate) {
      case 'logistic':
        return this.model.logisticRate;
      case 'mining':
        return this.model.miningRate;
      case 'habitat':
        return this.model.habitatRate;
      }
    },
    ringCellStyle(rate: MoonRate, value: number): Record<string, string> {
      const cell = ringCell(rate, value);
      return {'left': cell.left + 'px', 'top': cell.top + 'px', '--turn': cell.turn + 'deg'};
    },
    getValuesForParameter(targetParameter: 'logistic' | 'mining' | 'habitat'): Array<MoonParamLevel> {
      let curValue: number;

      switch (targetParameter) {
      case 'logistic':
        curValue = this.model.logisticRate;
        break;
      case 'mining':
        curValue = this.model.miningRate;
        break;
      case 'habitat':
        curValue = this.model.habitatRate;
        break;
      default:
        throw new Error('Wrong parameter to get values from: ' + targetParameter);
      }

      const values = [];
      for (let value = 8; value >= 0; value -= 1) {
        values.push({
          value: value,
          isActive: value === curValue,
          strValue: value.toString(),
        });
      }
      return values;
    },
    getScaleCSS(paramLevel: MoonParamLevel): string {
      let css = 'global-numbers-value val-' + paramLevel.value + ' ';
      if (paramLevel.value === 0) {
        css += 'zero-gap ';
      }
      if (paramLevel.isActive) {
        css += 'val-is-active';
      }
      return css;
    },
  },
});
</script>
