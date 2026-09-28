<template>
  <div id="game-end" class="game_end_cont">
    <!-- Ab @player-home-columns-min-width zwei Spalten wie in der Spielansicht: links Ergebnis, rechts Brett, Diagramme, Log -->
    <div class="game_end game-end-columns">
      <div class="game-end-columns__main">
        <div class="game-end-box game-end-hero">
          <div v-if="!isSoloGame || game.isSoloModeWin" class="game-end-winer-announcement">
            <span v-for="p in winners" :key="p.color"><span :class="'log-player ' + getEndGamePlayerRowColorClass(p.color)">{{ p.name }}</span></span> <span v-i18n>won!</span>
          </div>
          <!-- Links als Buttons: Navigation bleibt ein echter Link (Mittelklick, neuer Tab) -->
          <div class="game_end_navigation">
            <a href="new-game" class="btn btn-lg btn-tone-success" v-i18n>Create New Game</a>
            <a href="." class="btn btn-lg" v-i18n>Go to main page</a>
          </div>
        </div>

        <div v-if="isSoloGame" class="game-end-box">
          <div v-if="game.isSoloModeWin" class="game_end_success">
            <h2 v-i18n>You win!</h2>
            <div class="game_end_solo_img">
              <img src="assets/solo_win.png" >
            </div>
            <div class="game_end_notice">
              <span v-i18n>But it isn't the reason to stop making Mars better.</span>
            </div>
            <ul class="game_end_list">
              <li v-i18n>Try to win with expansions enabled</li>
              <li v-i18n>Try to win before the last generation</li>
              <li><span v-i18n>Can you get</span> {{ participant.players[0].victoryPointsBreakdown.total + 10 }}<span v-i18n>+ Victory Points?</span></li>
            </ul>
          </div>
          <div v-else class="game_end_fail">
            <h2 v-i18n>Sorry, you lose.</h2>
            <div class="game_end_notice">
              <span v-i18n>Next time you will get more luck!</span><br>
              <span v-i18n>Also, take into account these small hints to win:</span>
            </div>
            <ul class="game_end_list" v-i18n>
              <li>Concentrate more on Global parameters, not on Victory Points</li>
              <li>Don't be greedy with card selection</li>
              <li>Try to increase heat production, not Megacredits</li>
              <li>Try starting with the Beginner corporation</li>
            </ul>
          </div>
        </div>

        <div class="game-end-box game_end_victory_points">
          <h2><span v-i18n>Victory point breakdown after</span> {{game.generation}} <span v-i18n>generations</span></h2>
          <!-- Beiträge zu den globalen Parametern als eigene Spaltengruppe in derselben Tabelle (früher eigene Tabelle) -->
          <table class="table game_end_table">
            <thead>
              <tr class="game-end-table-groups">
                <th :colspan="victoryPointColumnCount"></th>
                <th class="game-end-group-start" :colspan="globalParameterColumnCount" v-i18n>Global Parameter Contributions</th>
                <th class="game-end-group-divider" :colspan="statisticsColumnCount"></th>
              </tr>
              <tr v-i18n>
                <th><div class="card-delegate"></div></th>
                <th><div class="tr"></div></th>
                <th><div class="m-and-a tooltip tooltip-top" :data-tooltip="$t('Milestones points')">M</div></th>
                <th><div class="m-and-a tooltip tooltip-top" :data-tooltip="$t('Awards points')">A</div></th>
                <th><div class="table-forest-tile"></div></th>
                <th><div class="table-city-tile"></div></th>
                <th v-if="game.moon !== undefined"><div class="table-moon-road-tile"></div></th>
                <th v-if="game.moon !== undefined"><div class="table-moon-colony-tile"></div></th>
                <th v-if="game.moon !== undefined"><div class="table-moon-mine-tile"></div></th>
                <th v-if="game.pathfinders !== undefined"><div class="table-planetary-track"></div></th>
                <th><div class="vp">VP</div></th>
                <th v-if="game.gameOptions.escapeVelocity" class="clock-icon tooltip tooltip-top" :data-tooltip="$t('Escape Velocity penalty')">&#x23F3;</th>
                <th class="game-end-total"><div class="game-end-total-column">Total</div></th>
                <th class="game-end-group-start"><div class="tile temperature-tile"></div></th>
                <th><div class="tile oxygen-tile"></div></th>
                <th><div class="tile ocean-tile"></div></th>
                <th v-if="game.gameOptions.expansions.venus"><div class="tile venus-tile"></div></th>
                <th v-if="game.gameOptions.expansions.moon"><div class="table-moon-colony-tile"></div></th>
                <th v-if="game.gameOptions.expansions.moon"><div class="table-moon-road-tile"></div></th>
                <th v-if="game.gameOptions.expansions.moon"><div class="table-moon-mine-tile"></div></th>
                <th>&Sigma;</th>
                <th class="game-end-group-start game-end-group-divider"><div class="mc-icon"></div></th>
                <th v-if="game.gameOptions.showTimers" class="clock-icon">&#x1F551;</th>
                <th><div class="table-red-arrow tooltip tooltip-top" :data-tooltip="$t('Actions taken this game')"></div></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in playersInPlace" :key="p.color" :class="[getEndGamePlayerRowColorClass(p.color), {'game-end-winner-row': isWinner(p)}]">
                <td class="game-end-player-cell">
                  <a :href="'player?id='+p.id+'&noredirect'">{{ p.name }}</a>
                  <div class="column-corporation">
                    <div v-for="(corporationName, index) in getCorporationName(p)" :key="index" v-i18n>{{ corporationName }}</div>
                  </div>
                </td>
                <td>{{ p.victoryPointsBreakdown.terraformRating }}</td>
                <td>{{ p.victoryPointsBreakdown.milestones }}</td>
                <td>{{ p.victoryPointsBreakdown.awards }}</td>
                <td>{{ p.victoryPointsBreakdown.greenery }}</td>
                <td>{{ p.victoryPointsBreakdown.city }}</td>
                <td v-if="game.moon !== undefined">{{ p.victoryPointsBreakdown.moonRoads }}</td>
                <td v-if="game.moon !== undefined">{{ p.victoryPointsBreakdown.moonHabitats }}</td>
                <td v-if="game.moon !== undefined">{{ p.victoryPointsBreakdown.moonMines }}</td>
                <td v-if="game.pathfinders !== undefined"> {{ p.victoryPointsBreakdown.planetaryTracks}}</td>
                <td>{{ p.victoryPointsBreakdown.victoryPoints }}</td>
                <td v-if="game.gameOptions.escapeVelocity">{{ p.victoryPointsBreakdown.escapeVelocity }}</td>
                <td class="game-end-total">{{ p.victoryPointsBreakdown.total }}</td>
                <td class="game-end-group-start game-end-contribution">{{ contributions(p.color).temp }}</td>
                <td class="game-end-contribution">{{ contributions(p.color).oxygen }}</td>
                <td class="game-end-contribution">{{ contributions(p.color).oceans }}</td>
                <td v-if="game.gameOptions.expansions.venus" class="game-end-contribution">{{ contributions(p.color).venus }}</td>
                <td v-if="game.gameOptions.expansions.moon" class="game-end-contribution">{{ contributions(p.color).moonHabitat }}</td>
                <td v-if="game.gameOptions.expansions.moon" class="game-end-contribution">{{ contributions(p.color).moonLogistic }}</td>
                <td v-if="game.gameOptions.expansions.moon" class="game-end-contribution">{{ contributions(p.color).moonMining }}</td>
                <td class="game-end-contribution game-end-contribution-total">{{ contributions(p.color).total }}</td>
                <td class="game-end-group-start game-end-group-divider game-end-mc">
                  <div>{{ p.megacredits }}</div>
                </td>
                <td v-if="game.gameOptions.showTimers"><div class="game-end-timer">{{ getTimer(p) }}</div></td>
                <td><div class="game-end-timer">{{ p.actionsTakenThisGame }}</div></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="game-end-box">
          <h2 v-i18n>Victory points details</h2>
          <div class="game-end-flexrow game-end-details">
            <div v-for="p in playersInPlace" :key="p.color" class="game-end-column">
              <div class="game-end-winer-scorebreak-player-title">
                <div :class="'game-end-player ' + getEndGamePlayerRowColorClass(p.color)"><a :href="'player?id='+p.id+'&noredirect'">{{p.name}}</a></div>
              </div>
              <div v-for="v in p.victoryPointsBreakdown.detailsCards" :key="v.cardName">
                <div :class="detailRowClass(v.victoryPoint)">
                  <div class="game-end-column-vp">{{v.victoryPoint}}</div>
                  <div class="game-end-column-text" v-i18n>{{v.cardName}}</div>
                </div>
              </div>
              <div class="game-end-column-row">
                <div class="game-end-column-vp">&nbsp;</div>
                <div class="game-end-column-text">&nbsp;</div>
              </div>
              <div v-for="v in p.victoryPointsBreakdown.detailsMilestones" :key="v.message">
                <div :class="detailRowClass(v.victoryPoint)">
                  <div class="game-end-column-vp">{{v.victoryPoint}}</div>
                  <div class="game-end-column-text">{{translateMilestoneDetails(v)}}</div>
                </div>
              </div>
              <div v-for="v in p.victoryPointsBreakdown.detailsAwards" :key="v.message">
                <div :class="detailRowClass(v.victoryPoint)">
                  <div class="game-end-column-vp">{{v.victoryPoint}}</div>
                  <div class="game-end-column-text">{{translateAwardDetails(v)}}</div>
                </div>
              </div>
              <div v-for="v in p.victoryPointsBreakdown.detailsPlanetaryTracks" :key="v.tag">
                <div :class="detailRowClass(v.points)">
                  <div class="game-end-column-vp">{{v.points}}</div>
                  <div class="game-end-column-text" v-i18n>Most tags on the {{v.tag}} track</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="game-end-columns__side">
        <div class="game-end-box game_end_block--board">
          <h2 v-i18n>Final situation on the board</h2>
          <Board
              :spaces="game.spaces"
              :expansions="game.gameOptions.expansions"
              :venusScaleLevel="game.venusScaleLevel"
              :altVenusBoard="game.gameOptions.altVenusBoard"
              :boardName ="game.gameOptions.boardName"
              :oceans_count="game.oceans"
              :oxygen_level="game.oxygenLevel"
              :temperature="game.temperature"
              :tileView="tileView"
              @toggleTileView="cycleTileView()"/>
          <MoonBoard v-if="game.moon !== undefined" :model="game.moon" :tileView="tileView"/>
          <div v-if="game.gameOptions.expansions.pathfinders">
            <PlanetaryTracks :tracks="game.pathfinders" :gameOptions="game.gameOptions"/>
          </div>
          <DeltaProjectBoard v-if="game.gameOptions.expansions.deltaProject" :players="participant.players"/>
        </div>

        <GameEndChartTabs
          :victoryPointDatasets="vpDataset"
          :globalParameterDatasets="globalsDataset"
          :generation="game.generation"/>

        <div class="game_end_block--log">
          <LogPanel :viewModel="participant"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {setDocumentTitle} from '@/client/utils/documentTitle';
import {setFaviconStatus} from '@/client/utils/favicon';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel, ViewModel} from '@/common/models/PlayerModel';
import Board from '@/client/components/Board.vue';
import MoonBoard from '@/client/components/moon/MoonBoard.vue';
import {nextTileView, TileView} from '@/client/components/board/TileView';
import PlanetaryTracks from '@/client/components/pathfinders/PlanetaryTracks.vue';
import DeltaProjectBoard from '@/client/components/delta/DeltaProjectBoard.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import {DataSet} from '@/client/components/gameend/VictoryPointChart.vue';
import GameEndChartTabs from '@/client/components/gameend/GameEndChartTabs.vue';
import {PLAYER_CHART_COLORS, GLOBAL_PARAMETER_CHART_STYLES} from '@/client/components/gameend/chartStyles';
import {playerColorClass} from '@/common/utils/utils';
import {Timer} from '@/common/Timer';
import {Color} from '@/common/Color';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {GlobalParameter} from '@/common/GlobalParameter';
import {$t, translateTextWithParams, translateMessage} from '@/client/directives/i18n';
import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {MADetail} from '@/common/game/VictoryPointsBreakdown';
import {AwardName} from '@/common/ma/AwardName';

type PlayerContributions = {player: string, color: Color, temp: number, oxygen: number, oceans: number, venus?: number, moonHabitat?: number, moonMining?: number, moonLogistic?: number, total: number};

// Ab dieser Punktzahl wird eine Zeile der Siegpunkt-Details hervorgehoben: die vielen 1-Punkt-Karten treten zurück
const NOTABLE_DETAIL_POINTS = 2;

export default defineComponent({
  name: 'GameEnd',
  props: {
    participant: {
      type: Object as () => ViewModel,
      required: true,
    },
  },
  computed: {
    game(): GameModel {
      return this.participant.game;
    },
    playersInPlace(): Array<PublicPlayerModel> {
      const sorted = this.participant.players.toSorted(function(a:PublicPlayerModel, b:PublicPlayerModel) {
        if (a.victoryPointsBreakdown.total < b.victoryPointsBreakdown.total) {
          return -1;
        }
        if (a.victoryPointsBreakdown.total > b.victoryPointsBreakdown.total) {
          return 1;
        }
        if (a.megacredits < b.megacredits) {
          return -1;
        }
        if (a.megacredits > b.megacredits) {
          return 1;
        }
        return 0;
      });
      return sorted.reverse();
    },
    winners() {
      const sortedPlayers = this.playersInPlace;
      const firstWinner = sortedPlayers[0];
      const winners: PublicPlayerModel[] = [firstWinner];
      for (let i = 1; i < sortedPlayers.length; i++) {
        if (sortedPlayers[i].victoryPointsBreakdown.total === firstWinner.victoryPointsBreakdown.total &&
                    sortedPlayers[i].megacredits === firstWinner.megacredits) {
          winners.push(sortedPlayers[i]);
        }
      }
      return winners;
    },
    isSoloGame(): boolean {
      return this.participant.players.length === 1;
    },
    vpDataset(): ReadonlyArray<DataSet> {
      return this.participant.players.map((player) => {
        return {
          label: player.name,
          data: player.victoryPointsByGeneration,
          color: PLAYER_CHART_COLORS[player.color],
        };
      });
    },
    globalsDataset(): ReadonlyArray<DataSet> {
      const dataset: Array<DataSet> = [];

      const gpg = this.game.globalsPerGeneration;
      function getValues(param: GlobalParameter, min: number, max: number): ReadonlyArray<number> {
        return gpg.map((entry) => {
          const val = entry[param] ?? min;
          return 100 * (val - min) / (max - min);
        });
      }

      // Farbe und Legenden-Symbol je Parameter aus chartStyles.ts
      const add = (label: string, param: GlobalParameter, min: number, max: number) => {
        const style = GLOBAL_PARAMETER_CHART_STYLES[param];
        dataset.push({label: $t(label), color: style.color, icon: style.icon, data: getValues(param, min, max)});
      };
      add('Temperature', GlobalParameter.TEMPERATURE, -30, 8);
      add('Oxygen', GlobalParameter.OXYGEN, 0, 14);
      add('Oceans', GlobalParameter.OCEANS, 0, 9);
      if (this.game.gameOptions.expansions.venus === true) {
        add('Venus', GlobalParameter.VENUS, 0, 30);
      }
      if (this.game.gameOptions.expansions.moon === true) {
        add('L. Habitat', GlobalParameter.MOON_HABITAT_RATE, 0, 8);
        add('L. Mining', GlobalParameter.MOON_MINING_RATE, 0, 8);
        add('L. Logistic', GlobalParameter.MOON_LOGISTIC_RATE, 0, 8);
      }
      return dataset;
    },
    playerContributionsData(): Array<PlayerContributions> {
      return this.participant.players.map((player) => {
        const steps = player.globalParameterSteps || {};
        const temp = steps[GlobalParameter.TEMPERATURE] || 0;
        const oxygen = steps[GlobalParameter.OXYGEN] || 0;
        const oceans = steps[GlobalParameter.OCEANS] || 0;
        const venus = steps[GlobalParameter.VENUS] || 0;
        const moonHabitat = steps[GlobalParameter.MOON_HABITAT_RATE] || 0;
        const moonMining = steps[GlobalParameter.MOON_MINING_RATE] || 0;
        const moonLogistic = steps[GlobalParameter.MOON_LOGISTIC_RATE] || 0;

        return {
          player: player.name,
          color: player.color,
          temp,
          oxygen,
          oceans,
          venus,
          moonHabitat,
          moonMining,
          moonLogistic: moonLogistic,
          total: temp + oxygen + oceans + venus + moonHabitat + moonMining + moonLogistic,
        };
      });
    },
    // Spalten der Siegpunkt-Gruppe (Spieler bis Gesamt) – für die Gruppen-Kopfzeile der Tabelle
    victoryPointColumnCount(): number {
      const moonColumns = this.game.moon !== undefined ? 3 : 0;
      const pathfindersColumns = this.game.pathfinders !== undefined ? 1 : 0;
      const escapeVelocityColumns = this.game.gameOptions.escapeVelocity ? 1 : 0;
      return 8 + moonColumns + pathfindersColumns + escapeVelocityColumns;
    },
    globalParameterColumnCount(): number {
      const venusColumns = this.game.gameOptions.expansions.venus ? 1 : 0;
      const moonColumns = this.game.gameOptions.expansions.moon ? 3 : 0;
      return 4 + venusColumns + moonColumns;
    },
    statisticsColumnCount(): number {
      return this.game.gameOptions.showTimers ? 3 : 2;
    },
    contributionsByColor(): Map<Color, PlayerContributions> {
      return new Map(this.playerContributionsData.map((data) => [data.color, data]));
    },
  },
  data(): {tileView: TileView} {
    return {
      tileView: 'show',
    };
  },
  components: {
    Board,
    LogPanel,
    MoonBoard,
    PlanetaryTracks,
    DeltaProjectBoard,
    GameEndChartTabs,
  },
  mounted() {
    setDocumentTitle('🏁 | ' + this.game.name);
    if (getPreferences().experimental_ui) {
      setFaviconStatus('ended');
    }
  },
  methods: {
    isWinner(player: PublicPlayerModel): boolean {
      return this.winners.some((winner) => winner.color === player.color);
    },
    contributions(color: Color): PlayerContributions {
      const data = this.contributionsByColor.get(color);
      if (data === undefined) {
        throw new Error('No global parameter contributions for ' + color);
      }
      return data;
    },
    // Viele Punkte golden, Minuspunkte rot – beides soll aus den vielen 1-Punkt-Zeilen herausstechen
    detailRowClass(points: number): Array<string> {
      if (points >= NOTABLE_DETAIL_POINTS) {
        return ['game-end-column-row', 'game-end-column-row--notable'];
      }
      if (points < 0) {
        return ['game-end-column-row', 'game-end-column-row--negative'];
      }
      return ['game-end-column-row'];
    },
    cycleTileView(): void {
      this.tileView = nextTileView(this.tileView);
    },
    getEndGamePlayerRowColorClass(color: Color): string {
      return playerColorClass(color, 'bg_transparent');
    },
    getTimer(p: PublicPlayerModel): string {
      return Timer.toString(p.timer);
    },
    getCorporationName(p: PublicPlayerModel): string[] {
      const cards = p.tableau;
      const corporationCards = cards
        .filter((card) => getCard(card.name)?.type === CardType.CORPORATION)
        .map((card) => card.name);
      return corporationCards.length === 0 ? [''] : corporationCards;
    },
    translateMilestoneDetails(data: MADetail): string {
      const args = (data.messageArgs || []).map($t);
      return translateTextWithParams(data.message, args);
    },
    translateAwardDetails(data: MADetail): string {
      if ( ! data.messageArgs || data.messageArgs.length < 3) {
        console.error( // data.message: ${0} place for ${1} award (funded by ${2})
          `Award detail has not enought data.
          It must contain at least 3 arguments:
          1) a Player's place in the race for the award
          2) translatable Award name
          3) not translatable Player name
          `,
        );
        return this.translateMilestoneDetails(data);
      }
      const message: Message = {
        message: data.message,
        data: [
          {
            type: LogMessageDataType.STRING,
            value: data.messageArgs[0],
          },
          {
            type: LogMessageDataType.AWARD,
            value: data.messageArgs[1] as AwardName,
          },
          {
            type: LogMessageDataType.PLAYER,
            value: data.messageArgs[2] as Color,
          },
        ],
      };
      return translateMessage(message);
    },
  },
});

</script>
