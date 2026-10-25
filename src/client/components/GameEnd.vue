<template>
  <div id="game-end" class="game_end_cont">
    <!-- Header across both columns, without its own box: winner on the left, navigation on the right -->
    <div class="game-end-hero">
      <!-- Menu and Mars logo at the top left like on the other pages (card list, statistics); the logo leads to the start screen -->
      <div class="game-end-hero-lead">
        <PageToolbar/>
        <MarsHomeLink/>
        <!-- Solo: result as a sentence in the same place as the winner in a multiplayer game, so both views are built the same -->
        <div v-if="isSoloGame" class="game-end-winner-announcement">
          <span v-if="game.isSoloModeWin" v-i18n>You win!</span>
          <span v-else v-i18n>Sorry, you lose.</span>
        </div>
        <div v-else class="game-end-winner-announcement">
          <span v-for="p in winners" :key="p.color"><span :class="'log-player ' + getEndGamePlayerRowColorClass(p.color)">{{ p.name }}</span></span> <span v-i18n>won!</span>
        </div>
      </div>
      <!-- Links as buttons: navigation stays a real link (middle click, new tab) -->
      <div class="game_end_navigation">
        <!-- Icon + text like the other action buttons; rounded corners (btn-rounded), height grows with wrapped text -->
        <a href="new-game" class="btn btn-lg btn-rounded btn-tone-success game-end-nav-button">
          <svg class="game-end-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          <span v-i18n>Create New Game</span>
        </a>
        <a href="." class="btn btn-lg btn-rounded game-end-nav-button">
          <svg class="game-end-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>
          <span v-i18n>Go to main page</span>
        </a>
        <a href="stats" class="btn btn-lg btn-rounded game-end-nav-button">
          <svg class="game-end-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>
          <span v-i18n>All statistics</span>
        </a>
      </div>
    </div>
    <!-- From @player-home-columns-min-width two columns as in the game view: result on the left, board, charts, log on the right -->
    <div class="game_end game-end-columns">
      <div class="game-end-columns__main">

        <!-- Solo: end picture fills the top of the card and fades into the ground colour of the picture, text below it -->
        <div v-if="isSoloGame" :class="['game-end-box', 'game-end-solo', game.isSoloModeWin ? 'game-end-solo--win' : 'game-end-solo--lose']">
          <div class="game-end-solo__media">
            <img class="game-end-solo__image" :src="game.isSoloModeWin ? 'assets/solo_win.jpg' : 'assets/solo_lose.jpg'" alt="">
          </div>
          <div class="game-end-solo__body">
            <template v-if="game.isSoloModeWin">
              <p class="game-end-solo__lead" v-i18n>But it isn't the reason to stop making Mars better.</p>
              <ul class="game-end-solo__list">
                <li v-i18n>Try to win with expansions enabled</li>
                <li v-i18n>Try to win before the last generation</li>
                <li><span v-i18n>Can you get</span> {{ participant.players[0].victoryPointsBreakdown.total + 10 }}<span v-i18n>+ Victory Points?</span></li>
              </ul>
            </template>
            <template v-else>
              <p class="game-end-solo__lead"><span v-i18n>Next time you will get more luck!</span> <span v-i18n>Also, take into account these small hints to win:</span></p>
              <ul class="game-end-solo__list" v-i18n>
                <li>Concentrate more on Global parameters, not on Victory Points</li>
                <li>Don't be greedy with card selection</li>
                <li>Try to increase heat production, not Megacredits</li>
                <li>Try starting with the Beginner corporation</li>
              </ul>
            </template>
          </div>
        </div>

        <!-- Basis of the game above the players: its settings in the groups of the create form -->
        <section class="game-end-box game-end-setup">
          <h2 v-i18n>Game settings</h2>
          <GameSetupGroups :chips="setupChips"/>
        </section>

        <div class="game-end-box game_end_victory_points">
          <h2><span v-i18n>Victory point breakdown after</span> {{game.generation}} <span v-i18n>generations</span></h2>
          <!-- Contributions to the global parameters as their own column group in the same table (formerly a separate table) -->
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
                <th v-if="game.moon !== undefined"><div class="table-moon-habitat-tile"></div></th>
                <th v-if="game.moon !== undefined"><div class="table-moon-mine-tile"></div></th>
                <th v-if="game.pathfinders !== undefined"><div class="table-planetary-track"></div></th>
                <th v-if="hasSchemes"><div class="table-schemes tooltip tooltip-top" :data-tooltip="$t('House schemes')"></div></th>
                <th><div class="vp">VP</div></th>
                <th v-if="game.gameOptions.escapeVelocity" class="clock-icon tooltip tooltip-top" :data-tooltip="$t('Escape Velocity penalty')">&#x23F3;</th>
                <th class="game-end-total"><div class="game-end-total-column">Total</div></th>
                <th class="game-end-group-start"><div class="tile temperature-tile"></div></th>
                <th><div class="tile oxygen-tile"></div></th>
                <th><div class="tile ocean-tile"></div></th>
                <th v-if="game.gameOptions.expansions.venus"><div class="tile venus-tile"></div></th>
                <th v-if="game.gameOptions.expansions.moon"><div class="table-moon-habitat-tile"></div></th>
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
                <td v-if="hasSchemes">{{ p.victoryPointsBreakdown.schemes }}</td>
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

        <!-- Drag handles between the boxes (from the two-column layout on, like in the game view, resize_handle.less) -->
        <RowResizeHandle kind="game-end-table"/>

        <div class="game-end-box game-end-box--fill">
          <h2 v-i18n>Victory points details</h2>
          <div class="game-end-flexrow game-end-details">
            <div v-for="p in playersInPlace" :key="p.color" class="game-end-column">
              <div class="game-end-winner-scorebreak-player-title">
                <div :class="'game-end-player ' + getEndGamePlayerRowColorClass(p.color)"><a :href="'player?id='+p.id+'&noredirect'">{{p.name}}</a></div>
              </div>
              <!-- Hovering a card shows it at the pointer like in the log (touch: a tap pins it) -->
              <div v-for="v in p.victoryPointsBreakdown.detailsCards" :key="v.cardName"
                @mouseenter="cardHovered(v.cardName, $event)" @mousemove="cardMoved" @mouseleave="cardLeft" @click="cardTapped(v.cardName, $event)">
                <div :class="detailRowClass(v.victoryPoint)">
                  <div class="game-end-column-vp">{{v.victoryPoint}}</div>
                  <div class="game-end-column-text" v-i18n>{{v.cardName}}</div>
                </div>
              </div>
              <div class="game-end-column-row">
                <div class="game-end-column-vp">&nbsp;</div>
                <div class="game-end-column-text">&nbsp;</div>
              </div>
              <!-- Milestones, awards and agendas show their goal card the same way (GoalPreview.vue) -->
              <div v-for="v in p.victoryPointsBreakdown.detailsMilestones" :key="v.message"
                @mouseenter="goalHovered(milestoneGoal(v), $event)" @mousemove="goalMoved" @mouseleave="goalLeft" @click="goalTapped(milestoneGoal(v), $event)">
                <div :class="detailRowClass(v.victoryPoint)">
                  <div class="game-end-column-vp">{{v.victoryPoint}}</div>
                  <div class="game-end-column-text">{{translateMilestoneDetails(v)}}</div>
                </div>
              </div>
              <div v-for="v in p.victoryPointsBreakdown.detailsAwards" :key="v.message"
                @mouseenter="goalHovered(awardGoal(v), $event)" @mousemove="goalMoved" @mouseleave="goalLeft" @click="goalTapped(awardGoal(v), $event)">
                <div :class="detailRowClass(v.victoryPoint)">
                  <div class="game-end-column-vp">{{v.victoryPoint}}</div>
                  <div class="game-end-column-text">{{translateAwardDetails(v)}}</div>
                </div>
              </div>
              <div v-for="v in p.victoryPointsBreakdown.detailsPlanetaryTracks" :key="v.tag">
                <div :class="detailRowClass(v.points)">
                  <div class="game-end-column-vp">{{v.points}}</div>
                  <div class="game-end-column-text" v-i18n="[v.tag]">Most tags on the ${0} track</div>
                </div>
              </div>
              <!-- Agendas as a group of their own, set off by an empty row like milestones and awards -->
              <div v-if="(p.victoryPointsBreakdown.detailsSchemes ?? []).length > 0" class="game-end-column-row">
                <div class="game-end-column-vp">&nbsp;</div>
                <div class="game-end-column-text">&nbsp;</div>
              </div>
              <div v-for="v in p.victoryPointsBreakdown.detailsSchemes ?? []" :key="v.agenda"
                @mouseenter="goalHovered(agendaGoal(p.color, v), $event)" @mousemove="goalMoved" @mouseleave="goalLeft" @click="goalTapped(agendaGoal(p.color, v), $event)">
                <div :class="detailRowClass(v.victoryPoint)">
                  <div class="game-end-column-vp">{{v.victoryPoint}}</div>
                  <div class="game-end-column-text">{{translateSchemeDetail(v)}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ColumnResizeHandle class="game-end-columns__resizer" :split="columnSplit"/>

      <div class="game-end-columns__side">
        <div class="game-end-box game_end_block--board">
          <h2 v-i18n>Final situation on the board</h2>
          <!-- Scales as a whole: fills the column width by default, the handle below makes it smaller (gameEndResize.ts) -->
          <div class="game-end-board-zoom">
            <!-- Click enlarges Mars or the Moon like in the game (BoardZoomModal) -->
            <Board
                ref="columnBoard"
                v-bind="boardProps"
                class="board-cont--zoomable"
                @toggleTileView="cycleTileView()"
                @click="onBoardClick($event, 'mars')"/>
            <MoonBoard v-if="game.moon !== undefined" ref="columnMoon" :model="game.moon" :tileView="tileView"
                class="board-cont--zoomable" @click="onBoardClick($event, 'moon')"/>
            <div v-if="game.gameOptions.expansions.pathfinders">
              <PlanetaryTracks :tracks="game.pathfinders" :gameOptions="game.gameOptions"/>
            </div>
            <DeltaProjectBoard v-if="game.gameOptions.expansions.deltaProject" :players="participant.players"/>
          </div>
          <!-- Outside the scaled part: the zoom would also scale the full-screen view -->
          <BoardZoomModal :open="boardZoomOpen" :origin="columnBoardElement" :frame="zoomBoard === 'mars' ? marsZoomFrame : undefined"
              @close="boardZoomOpen = false">
            <template #controls>
              <TileViewToggle :tileView="tileView" @toggleTileView="cycleTileView()"/>
            </template>
            <MoonBoard v-if="zoomBoard === 'moon' && game.moon !== undefined" :model="game.moon" :tileView="tileView" ring/>
            <Board v-else v-bind="boardProps" @toggleTileView="cycleTileView()"/>
          </BoardZoomModal>
        </div>
        <RowResizeHandle kind="game-end-board"/>

        <GameEndChartTabs
          :victoryPointDatasets="vpDataset"
          :globalParameterDatasets="globalsDataset"
          :generation="game.generation"/>
        <RowResizeHandle kind="game-end-chart"/>

        <div class="game_end_block--log">
          <LogPanel :viewModel="participant"/>
          <!-- Card preview of the victory point details: in the body, so no column (backdrop filter, overflow) holds it -->
          <Teleport to="body">
            <LogMessageInspector ref="cardInspector" :viewModel="participant"/>
            <GoalPreview ref="goalPreview"/>
          </Teleport>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {gameDocumentTitle} from '@/client/utils/documentTitle';
import {setFaviconStatus} from '@/client/utils/favicon';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel, ViewModel} from '@/common/models/PlayerModel';
import Board from '@/client/components/Board.vue';
import BoardZoomModal from '@/client/components/board/BoardZoomModal.vue';
import TileViewToggle from '@/client/components/boardTabs/TileViewToggle.vue';
import {marsBoardProps} from '@/client/components/board/marsBoardProps';
import {isBoardControlClick} from '@/client/components/board/boardZoomClick';
import {ZoomBoard} from '@/client/components/board/placementZoom';
import {MarsFrame, isLargeBoard, marsFrame} from '@/client/components/mobile/mobileBoardZoom';
import {mobileLayout} from '@/client/utils/mobileLayout';
import PageToolbar from '@/client/components/PageToolbar.vue';
import MarsHomeLink from '@/client/components/common/MarsHomeLink.vue';
import MoonBoard from '@/client/components/moon/MoonBoard.vue';
import {nextTileView, TileView} from '@/client/components/board/TileView';
import PlanetaryTracks from '@/client/components/pathfinders/PlanetaryTracks.vue';
import DeltaProjectBoard from '@/client/components/delta/DeltaProjectBoard.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import GameSetupGroups from '@/client/components/common/GameSetupGroups.vue';
import {GameSetupChip} from '@/client/components/common/gameSetupChips';
import {viewSetupChips} from '@/client/components/common/viewSetupChips';
import {DataSet} from '@/client/components/gameend/VictoryPointChart.vue';
import GameEndChartTabs from '@/client/components/gameend/GameEndChartTabs.vue';
import ColumnResizeHandle from '@/client/components/ColumnResizeHandle.vue';
import RowResizeHandle from '@/client/components/RowResizeHandle.vue';
import {ColumnSplit, GAME_END_SPLIT} from '@/client/utils/columnResize';
import {PLAYER_CHART_COLORS, GLOBAL_PARAMETER_CHART_STYLES} from '@/client/components/gameend/chartStyles';
import {playerColorClass} from '@/common/utils/utils';
import {Timer} from '@/common/Timer';
import {Color} from '@/common/Color';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {CardName} from '@/common/cards/CardName';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import LogMessageInspector from '@/client/components/logpanel/LogMessageInspector.vue';
import GoalPreview, {DetailGoal} from '@/client/components/gameend/GoalPreview.vue';
import {GlobalParameter} from '@/common/GlobalParameter';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {MIN_OXYGEN_LEVEL, MIN_TEMPERATURE, MIN_VENUS_SCALE} from '@/common/constants';
import {$t, translateTextWithParams, translateMessage} from '@/client/directives/i18n';
import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {MADetail, SchemeDetail} from '@/common/game/VictoryPointsBreakdown';
import {SCHEME_LEVEL_LABELS} from '@/common/dune/schemeAgendas';
import {AwardName} from '@/common/ma/AwardName';

type PlayerContributions = {player: string, color: Color, temp: number, oxygen: number, oceans: number, venus?: number, moonHabitat?: number, moonMining?: number, moonLogistic?: number, total: number};

// From this score on a victory point detail row is highlighted: the many 1-point cards recede
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
    columnSplit(): ColumnSplit {
      return GAME_END_SPLIT;
    },
    boardProps() {
      return marsBoardProps(this.game, this.tileView);
    },
    // Large Mars shows the same section as in the game (mobileBoardZoom.ts)
    marsZoomFrame(): MarsFrame {
      return marsFrame(mobileLayout.value && !this.game.gameOptions.expansions.venus, isLargeBoard(this.game.gameOptions.boardName));
    },
    game(): GameModel {
      return this.participant.game;
    },
    setupChips(): Array<GameSetupChip> {
      return viewSetupChips(this.participant);
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

      // Color and legend icon per parameter from chartStyles.ts
      const add = (label: string, param: GlobalParameter, min: number, max: number) => {
        const style = GLOBAL_PARAMETER_CHART_STYLES[param];
        dataset.push({label: $t(label), color: style.color, icon: style.icon, data: getValues(param, min, max)});
      };
      // Maximums depend on the board (Amazonis Planitia goes further), else the lines pass 100%
      const max = getGlobalParameterMaximums(this.game.gameOptions.boardName);
      add('Temperature', GlobalParameter.TEMPERATURE, MIN_TEMPERATURE, max.temperature);
      add('Oxygen', GlobalParameter.OXYGEN, MIN_OXYGEN_LEVEL, max.oxygen);
      add('Oceans', GlobalParameter.OCEANS, 0, max.oceans);
      if (this.game.gameOptions.expansions.venus === true) {
        add('Venus', GlobalParameter.VENUS, MIN_VENUS_SCALE, max.venus);
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
    // Dune expansion, House schemes: agenda points get a column of their own
    hasSchemes(): boolean {
      return this.game.dune?.schemes !== undefined;
    },
    // Columns of the victory point group (player to total) – for the table's group header row
    victoryPointColumnCount(): number {
      const moonColumns = this.game.moon !== undefined ? 3 : 0;
      const pathfindersColumns = this.game.pathfinders !== undefined ? 1 : 0;
      const escapeVelocityColumns = this.game.gameOptions.escapeVelocity ? 1 : 0;
      const schemesColumns = this.hasSchemes ? 1 : 0;
      return 8 + moonColumns + pathfindersColumns + escapeVelocityColumns + schemesColumns;
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
  data(): {tileView: TileView, boardZoomOpen: boolean, zoomBoard: ZoomBoard, columnBoardElement: HTMLElement | undefined} {
    return {
      tileView: 'show',
      boardZoomOpen: false,
      // Board shown in the enlargement (Mars or Moon)
      zoomBoard: 'mars',
      // Start point of the zoom animation; only known after mounting
      columnBoardElement: undefined,
    };
  },
  components: {
    LogMessageInspector,
    Board,
    BoardZoomModal,
    TileViewToggle,
    PageToolbar,
    MarsHomeLink,
    LogPanel,
    GameSetupGroups,
    MoonBoard,
    PlanetaryTracks,
    DeltaProjectBoard,
    GameEndChartTabs,
    ColumnResizeHandle,
    RowResizeHandle,
    GoalPreview,
  },
  mounted() {
    document.title = gameDocumentTitle({game: this.game, thisPlayer: this.participant.thisPlayer}, '🏁');
    if (getPreferences().experimental_ui) {
      setFaviconStatus('ended');
    }
  },
  methods: {
    // The card of a detail row as a one-card log line: the log's preview (LogMessageInspector) shows it;
    // undefined for rows that are no card ("Colony VP" and the like)
    cardMessage(name: string): LogMessage | undefined {
      if (getCard(name as CardName) === undefined) {
        return undefined;
      }
      return new LogMessage(LogMessageType.DEFAULT, '${0}', [{type: LogMessageDataType.CARD, value: name as CardName}]);
    },
    cardInspector(): InstanceType<typeof LogMessageInspector> | undefined {
      return this.$refs.cardInspector as InstanceType<typeof LogMessageInspector> | undefined;
    },
    canHover(): boolean {
      return window.matchMedia('(hover: hover)').matches;
    },
    cardHovered(name: string, event: MouseEvent): void {
      const message = this.cardMessage(name);
      if (message !== undefined && this.canHover()) {
        this.cardInspector()?.preview(message, {x: event.clientX, y: event.clientY});
      }
    },
    cardMoved(event: MouseEvent): void {
      this.cardInspector()?.follow({x: event.clientX, y: event.clientY});
    },
    cardLeft(): void {
      this.cardInspector()?.hidePreview();
    },
    // Touch devices have no hover: a tap pins the card at the finger until the next tap
    cardTapped(name: string, event: MouseEvent): void {
      const message = this.cardMessage(name);
      if (message !== undefined && !this.canHover()) {
        this.cardInspector()?.pinPreview(message, {x: event.clientX, y: event.clientY});
      }
    },
    goalPreview(): InstanceType<typeof GoalPreview> | undefined {
      return this.$refs.goalPreview as InstanceType<typeof GoalPreview> | undefined;
    },
    // "Claimed ${0} milestone": the milestone is the only argument
    milestoneGoal(data: MADetail): DetailGoal | undefined {
      const name = data.messageArgs?.[0];
      return name === undefined ? undefined : {kind: 'milestone', name};
    },
    // "${0} place for ${1} award (funded by ${2})": the award is the second argument
    awardGoal(data: MADetail): DetailGoal | undefined {
      const name = data.messageArgs?.[1];
      return name === undefined ? undefined : {kind: 'award', name};
    },
    // The agenda with the player's final value (everybody's agendas are open after the game)
    agendaGoal(color: Color, data: SchemeDetail): DetailGoal {
      const agendas = this.game.dune?.schemes?.players.find((entry) => entry.color === color)?.agendas;
      const agenda = agendas?.find((entry) => entry.name === data.agenda) ?? {name: data.agenda, value: 0, level: data.level};
      return {kind: 'agenda', agenda};
    },
    goalHovered(goal: DetailGoal | undefined, event: MouseEvent): void {
      if (goal !== undefined && this.canHover()) {
        this.goalPreview()?.preview(goal, {x: event.clientX, y: event.clientY});
      }
    },
    goalMoved(event: MouseEvent): void {
      this.goalPreview()?.follow({x: event.clientX, y: event.clientY});
    },
    goalLeft(): void {
      this.goalPreview()?.hide();
    },
    goalTapped(goal: DetailGoal | undefined, event: MouseEvent): void {
      if (goal !== undefined && !this.canHover()) {
        this.goalPreview()?.pin(goal, {x: event.clientX, y: event.clientY});
      }
    },
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
    // Many points golden, negative points red – both should stand out from the many 1-point rows
    detailRowClass(points: number): Array<string> {
      if (points >= NOTABLE_DETAIL_POINTS) {
        return ['game-end-column-row', 'game-end-column-row--notable'];
      }
      if (points < 0) {
        return ['game-end-column-row', 'game-end-column-row--negative'];
      }
      return ['game-end-column-row'];
    },
    // Clicking Mars or the Moon enlarges it – not on the board's controls
    onBoardClick(event: MouseEvent, board: ZoomBoard): void {
      if (isBoardControlClick(event)) {
        return;
      }
      this.zoomBoard = board;
      const columnRef = board === 'moon' ? this.$refs.columnMoon : this.$refs.columnBoard;
      this.columnBoardElement = (columnRef as {$el?: HTMLElement} | undefined)?.$el;
      this.boardZoomOpen = true;
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
    // "Agenda Dew Gatherer (Medium)": the agenda that scored and the level reached
    translateSchemeDetail(data: SchemeDetail): string {
      return translateTextWithParams('Agenda ${0} (${1})', [$t(data.agenda), $t(SCHEME_LEVEL_LABELS[data.level - 1])]);
    },
    translateMilestoneDetails(data: MADetail): string {
      const args = (data.messageArgs || []).map($t);
      return translateTextWithParams(data.message, args);
    },
    translateAwardDetails(data: MADetail): string {
      if ( ! data.messageArgs || data.messageArgs.length < 3) {
        console.error( // data.message: ${0} place for ${1} award (funded by ${2})
          `Award detail has not enough data.
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
