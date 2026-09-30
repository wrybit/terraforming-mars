<template>
  <div :class="rowClasses" @click="toggleCards">
    <!-- Ganze Zeile ist klickbar und öffnet die gespielten Karten (wie die klassische Spielerleiste) -->
    <!-- Startspieler als "1" im Farbbalken, damit die Namenszeile Platz für Name und Status hat -->
    <span v-if="firstForGen && playerView.players.length > 1" class="players-table-first-player" :title="$t('First player')" data-test="first-player">1</span>
    <div class="players-table-identity">
      <div class="players-table-identity-line">
        <span class="players-table-name">{{ symbol + player.name }}</span>
        <PlayerStatus :timer="player.timer" :showTimer="playerView.game.gameOptions.showTimers" :liveTimer="playerView.game.phase !== Phase.END" :actionLabel="actionLabel" v-trim-whitespace/>
      </div>
      <div class="players-table-corporation" :title="corporations">{{ corporations }}</div>
    </div>

    <!-- Reihenfolge der Abschnitte aus PlayersTable (Desktop: Waren, Tags, Wertung; mobil: Waren, Wertung, Tags) -->
    <template v-for="section in sectionOrder" :key="section">
      <template v-if="section === 'goods' && visibility.goods">
        <div class="players-table-divider"></div>
        <PlayersTableGoods v-for="good in goods" :key="good.type" :good="good" :isProductionLeader="productionLeaders.includes(good.type)"/>
      </template>

      <template v-if="section === 'tags' && visibility.tags">
        <div class="players-table-divider"></div>
        <template v-for="(group, groupIndex) in tagColumns" :key="groupIndex">
          <div v-if="groupIndex > 0"></div>
          <div class="players-table-cell" v-for="tag in group" :key="tag" :data-test="'tag-' + tag">
            <span :class="['players-table-counter', {'players-table-counter--zero': tagDetail(tag).count === 0}]">{{ tagDetail(tag).count || '·' }}</span>
            <span v-if="tagDetail(tag).discount > 0" class="players-table-discount" :data-test="'discount-' + tag" :title="$t('Discount')">{{ tagDetail(tag).discount }}</span>
            <PointsPerTag :points="tagDetail(tag)"/>
          </div>
        </template>
      </template>

      <template v-if="section === 'score' && visibility.score">
        <div class="players-table-divider"></div>
        <div class="players-table-cell"><span class="players-table-counter" data-test="vp">{{ victoryPoints }}</span></div>
        <div class="players-table-cell"><span class="players-table-counter" data-test="tr">{{ player.terraformRating }}</span></div>
        <div class="players-table-cell">
          <span class="players-table-counter" data-test="hand">{{ player.cardsInHandNbr ?? 0 }}</span>
          <span v-if="tagDetails.all.discount > 0" class="players-table-discount" data-test="discount-all" :title="$t('Discount')">{{ tagDetails.all.discount }}</span>
        </div>
        <div class="players-table-cell">
          <span :class="['players-table-counter', {'players-table-counter--zero': player.availableBlueCardActionCount === 0}]" data-test="actions">{{ player.availableBlueCardActionCount }}</span>
        </div>
      </template>
    </template>

    <div class="players-table-divider"></div>
    <div class="players-table-cell">
      <!-- Kein eigener Klick-Handler: der Klick läuft zur Zeile hoch; Button bleibt für Tastaturbedienung -->
      <button type="button" class="players-table-played" :aria-label="$t('Played cards')" data-test="played-cards">{{ player.tableau.length }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {Resource} from '@/common/Resource';
import {Phase} from '@/common/Phase';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import PlayerStatus from '@/client/components/overview/PlayerStatus.vue';
import PlayersTableGoods from '@/client/components/overview/PlayersTableGoods.vue';
import PointsPerTag from '@/client/components/overview/PointsPerTag.vue';
import {PlayerGood, playerGoods} from '@/client/components/overview/playerGoods';
import {InterfaceTagsType, TagDetail, TagDetails, isVictoryPointCountHidden} from '@/client/components/overview/playerTagDetails';
import {DESKTOP_SECTION_ORDER, SectionVisibility, TableSection, TagColumnGroups} from '@/client/components/overview/playersTableLayout';
import {corporationNames} from '@/client/components/overview/playerCorporations';
import {togglePlayerCards} from '@/client/components/overview/playerCardsToggle';
import {playerSymbol} from '@/client/utils/playerSymbol';
import {vueRoot} from '@/client/components/vueRoot';

export default defineComponent({
  name: 'PlayersTableRow',
  components: {
    PlayerStatus,
    PlayersTableGoods,
    PointsPerTag,
  },
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
    firstForGen: {
      type: Boolean,
      default: false,
    },
    actionLabel: {
      type: String as () => ActionLabel,
      required: true,
    },
    playerIndex: {
      type: Number,
      required: true,
    },
    visibility: {
      type: Object as () => SectionVisibility,
      required: true,
    },
    // Reihenfolge der Abschnitte (playersTableLayout.ts: sectionOrder)
    sectionOrder: {
      type: Array as () => ReadonlyArray<TableSection>,
      default: () => DESKTOP_SECTION_ORDER,
    },
    tagColumns: {
      type: Array as () => TagColumnGroups,
      required: true,
    },
    tagDetails: {
      type: Object as () => TagDetails,
      required: true,
    },
    // Waren, bei denen dieser Spieler allein die höchste Produktion hat
    productionLeaders: {
      type: Array as () => Array<Resource>,
      default: () => [],
    },
  },
  computed: {
    Phase(): typeof Phase {
      return Phase;
    },
    isThisPlayer(): boolean {
      return this.player.color === this.playerView.thisPlayer?.color;
    },
    rowClasses(): Array<string> {
      const classes = ['players-table-row', 'players-table-row--player', 'players-table-row--' + this.player.color];
      if (this.isThisPlayer) {
        classes.push('players-table-row--me');
      }
      // Am Zug: der blinkende rote Punkt zeigt das, das Wort "aktiv" entfällt
      if (this.actionLabel === 'active') {
        classes.push('players-table-row--acting');
      }
      return classes;
    },
    symbol(): string {
      return playerSymbol(this.player.color, ' ');
    },
    corporations(): string {
      return corporationNames(this.player).map((name) => this.$t(name)).join(' · ');
    },
    goods(): Array<PlayerGood> {
      return playerGoods(this.player);
    },
    victoryPoints(): number | string {
      return isVictoryPointCountHidden(this.player, this.playerView) ? '?' : this.player.victoryPointsBreakdown.total;
    },
  },
  methods: {
    tagDetail(tag: InterfaceTagsType): TagDetail {
      // Zu jeder sichtbaren Spalte gibt es einen Eintrag – die Spalten stammen aus derselben Reihenfolge
      return this.tagDetails.tagsInOrder.find((detail) => detail.name === tag) as TagDetail;
    },
    toggleCards() {
      togglePlayerCards(vueRoot(this), this.playerIndex, this.playerView.players.length);
    },
  },
});
</script>
