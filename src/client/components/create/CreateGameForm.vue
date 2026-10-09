<template>
  <div id="create-game" class="create-game">
    <!-- Header like card list/statistics: title, file buttons, language and settings in one header card -->
    <header class="card-list-header card-list-header--plain create-game-head">
      <!-- Menu at the top left, as in the game -->
      <PageToolbar/>
      <PageTitle title="Create New Game"/>
      <div class="create-game-head-actions">
        <label class="create-game-icon-button" :title="$t('Load settings from file')">
          <!-- Import/export icons: arrow perpendicular to a hex edge, into the tile (import) or out of it (export);
               the mask cuts the hex where the shaft crosses it. Mask ids only exist once on the page. -->
          <svg class="create-game-head-icon" viewBox="0 0 24 24" aria-hidden="true">
            <mask id="create-game-import-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><path :d="importArrowPath" stroke="#000" stroke-width="6"/></mask>
            <polygon mask="url(#create-game-import-cut)" points="11.5,5.2 18.43,9.2 18.43,17.2 11.5,21.2 4.57,17.2 4.57,9.2"/><path :d="importArrowPath"/>
          </svg>
          <span class="create-game-head-label" v-i18n>Import</span>
          <input style="display: none" type="file" accept=".json" id="settings-file" ref="file" @change="uploadSettings()">
        </label>
        <button type="button" class="create-game-icon-button" :title="$t('Save settings to file')" @click="downloadSettings()"><svg class="create-game-head-icon" viewBox="0 0 24 24" aria-hidden="true">
            <mask id="create-game-export-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><path :d="exportArrowPath" stroke="#000" stroke-width="6"/></mask>
            <polygon class="create-game-head-icon-filled" mask="url(#create-game-export-cut)" points="12.5,5.2 19.43,9.2 19.43,17.2 12.5,21.2 5.57,17.2 5.57,9.2"/><path :d="exportArrowPath"/>
          </svg><span class="create-game-head-label" v-i18n>Export</span></button>
        <!-- Share link: the URL already carries the settings anyway, the button just copies it -->
        <button type="button" class="create-game-icon-button" :title="$t('Copy link with these settings')" @click="copySettingsLink()"><svg class="create-game-head-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span class="create-game-head-label">{{ $t(settingsLinkCopied ? 'Link copied' : 'Copy link') }}</span></button>
        <AppButton class="create-game-reset btn-tone-quiet" title="Reset" @click="resetSettings"/>
      </div>
    </header>
    <div class="create-game-layout">
      <main class="create-game-settings">
        <!-- Fixed columns, so cards never jump: left expansions and everything that grows with them, right the board.
             One column (narrow): the wrappers dissolve and the cards follow their order value -->
        <div class="create-game-cards">
          <div class="create-game-cards-column">
          <section class="create-game-card" style="order: 1">
            <!-- Grouping of the tiles in the header row: one control, no second row -->
            <div class="create-game-card-head create-game-expansions-head"><h2 v-i18n>Expansions</h2><ExpansionGroupMenu v-model="expansionGrouping"/></div>
            <template v-for="group in expansionGroups" :key="expansionGrouping + group.key">
              <!-- Per group a small button that says what it does: select all, or deselect all once everything is on -->
              <div class="create-game-subhead">
                <span>{{ $t(group.title) }}</span>
                <button v-if="choicesOf(group).length > 0" type="button" class="create-game-small-button"
                  @click="setExpansions(choicesOf(group), !allSelected(group))">{{ $t(allSelected(group) ? 'Deselect all' : 'Select all') }}</button>
              </div>
              <div class="create-game-chip-grid create-game-expansion-grid">
                <!-- The base game is always part of the game: shown as a selected chip that cannot be switched off -->
                <ChoiceChip v-for="tile in group.tiles" :key="tile.module"
                  :label="tile.choice?.label ?? 'Base game'" :iconClass="tile.choice?.iconClass ?? 'expansion-icon-base'"
                  :selected="tile.choice === undefined || expansions[tile.choice.expansion]" :locked="tile.choice === undefined"
                  :href="tile.choice?.info ? wikiUrls[tile.choice.expansion] : undefined"
                  :tooltip="tile.choice === undefined ? undefined : requiredByTooltip(tile.choice.expansion, expansions)"
                  @select="tile.choice !== undefined && toggleExpansion(tile.choice.expansion)">
                  <template #detail>
                    <span v-for="(part, index) in contentLine(tile, group.highlight, expansionGrouping !== 'source')" :key="index"
                      :class="{'create-game-chip-detail--hit': part.highlighted}">{{ part.text }}</span>
                  </template>
                  <span v-if="tile.choice?.alpha" class="create-game-alpha" title="Alpha — work in progress">α</span>
                </ChoiceChip>
              </div>
            </template>
          </section>

          <section class="create-game-card" style="order: 6">
            <div class="create-game-card-head"><h2 v-i18n>Expansion options</h2></div>
            <div v-if="!hasExpansionOptions" class="create-game-note" v-i18n>Activate Venus Next, Turmoil, The Moon or Ares to see their options here.</div>
            <div v-if="expansions.venus" class="create-game-option-group">
              <div class="create-game-option-group-title"><span class="create-game-expansion-icon expansion-icon-venus"></span><span v-i18n>Venus Next</span></div>
              <OptionRow label="Alt. Venus Board" :href="wikiUrls.alternativeVenusBoard"><SwitchInput v-model="altVenusBoard"/></OptionRow>
              <OptionRow v-if="playersCount > 1" label="Mandatory Venus Terraforming" :href="wikiUrls.venusTerraforming">
                <SwitchInput v-model="requiresVenusTrackCompletion"/>
              </OptionRow>
            </div>
            <div v-if="expansions.turmoil" class="create-game-option-group">
              <div class="create-game-option-group-title"><span class="create-game-expansion-icon expansion-icon-turmoil"></span><span v-i18n>Turmoil</span></div>
              <OptionRow label="Agendas" iconClass="expansion-icon-agendas" href="https://www.notion.so/Political-Agendas-8c6b0b018a884692be29b3ef44b340a9">
                <SwitchInput :modelValue="isPoliticalAgendasExtensionEnabled()" @update:modelValue="politicalAgendasExtensionToggle()"/>
              </OptionRow>
              <SegmentedControl v-if="isPoliticalAgendasExtensionEnabled()" class="create-game-segmented--sub" v-model="politicalAgendasExtension" :options="AGENDA_OPTIONS"/>
              <OptionRow label="Remove negative Global Events" :href="wikiUrls.removeNegativeGlobalEvents">
                <SwitchInput v-model="removeNegativeGlobalEventsOption"/>
              </OptionRow>
            </div>
            <div v-if="expansions.moon" class="create-game-option-group">
              <div class="create-game-option-group-title"><span class="create-game-expansion-icon expansion-icon-themoon"></span><span v-i18n>The Moon</span></div>
              <OptionRow label="Mandatory Moon Terraforming"><SwitchInput v-model="requiresMoonTrackCompletion"/></OptionRow>
              <OptionRow label="Standard Project Variant #1" :href="wikiUrls.moonStandardProjectVariant"><SwitchInput v-model="moonStandardProjectVariant1"/></OptionRow>
              <OptionRow label="Standard Project Variant #2" :href="wikiUrls.moonStandardProjectVariant"><SwitchInput v-model="moonStandardProjectVariant"/></OptionRow>
            </div>
            <div v-if="expansions.ares" class="create-game-option-group">
              <div class="create-game-option-group-title"><span class="create-game-expansion-icon expansion-icon-ares"></span><span v-i18n>Ares</span></div>
              <OptionRow label="Extreme" :href="wikiUrls.aresExtreme"><SwitchInput v-model="aresExtremeVariant"/></OptionRow>
            </div>
          </section>

          <section class="create-game-card" style="order: 4">
            <div class="create-game-card-head"><h2 v-i18n>Setup</h2></div>
            <OptionRow label="Starting Corporations">
              <NumberStepper v-model="startingCorporations" :min="1" :max="6"/>
            </OptionRow>
            <OptionRow v-if="expansions.prelude" label="Starting Preludes" iconClass="expansion-icon-prelude">
              <NumberStepper v-model="startingPreludes" :min="4" :max="8"/>
            </OptionRow>
            <OptionRow v-if="expansions.ceo" label="Starting CEOs" iconClass="expansion-icon-ceo">
              <NumberStepper v-model="startingCeos" :min="1" :max="6"/>
            </OptionRow>
            <div v-if="expansions.prelude || playersCount > 1" class="create-game-divider"></div>
            <OptionRow v-if="expansions.prelude" label="Merger" iconClass="expansion-icon-prelude" :href="wikiUrls.merger">
              <SwitchInput v-model="twoCorpsVariant"/>
            </OptionRow>
            <template v-if="playersCount > 1">
              <OptionRow label="Draft variant"><SwitchInput v-model="draftVariant"/></OptionRow>
              <OptionRow label="Initial Draft variant" :href="wikiUrls.initialDraft"><SwitchInput v-model="initialDraft"/></OptionRow>
              <template v-if="initialDraft">
                <OptionRow v-if="expansions.prelude" label="Prelude Draft" sub><SwitchInput v-model="preludeDraftVariant"/></OptionRow>
                <OptionRow v-if="expansions.ceo" label="CEO Draft" sub><SwitchInput v-model="ceosDraftVariant"/></OptionRow>
              </template>
            </template>
          </section>

          <section class="create-game-card" style="order: 7">
            <div class="create-game-card-head"><h2 v-i18n>Card pool</h2></div>
            <div class="create-game-chip-grid create-game-chip-grid--two">
              <ChoiceChip label="Custom Corporation list" :selected="showCorporationList" @select="showCorporationList = !showCorporationList">
                <span v-if="customCorporations.length" class="create-game-count">{{ customCorporations.length }}</span>
              </ChoiceChip>
              <ChoiceChip v-if="expansions.prelude" label="Custom Preludes list" :selected="showPreludesList" @select="showPreludesList = !showPreludesList">
                <span v-if="customPreludes.length" class="create-game-count">{{ customPreludes.length }}</span>
              </ChoiceChip>
              <ChoiceChip v-if="expansions.ceo" label="Custom CEOs list" :selected="showCeosList" @select="showCeosList = !showCeosList">
                <span v-if="customCeos.length" class="create-game-count">{{ customCeos.length }}</span>
              </ChoiceChip>
              <ChoiceChip v-if="expansions.colonies" label="Custom Colonies list" :selected="showColoniesList" @select="showColoniesList = !showColoniesList">
                <span v-if="customColonies.length" class="create-game-count">{{ customColonies.length }}</span>
              </ChoiceChip>
              <ChoiceChip label="Exclude some cards" :selected="showBannedCards" @select="showBannedCards = !showBannedCards">
                <span v-if="bannedCards.length" class="create-game-count">{{ bannedCards.length }}</span>
              </ChoiceChip>
              <ChoiceChip label="Include some cards" :selected="showIncludedCards" @select="showIncludedCards = !showIncludedCards">
                <span v-if="includedCards.length" class="create-game-count">{{ includedCards.length }}</span>
              </ChoiceChip>
            </div>
            <OptionRow label="Set Predefined Game" :href="wikiUrls.setPredefinedGame"><SwitchInput v-model="seededGame"/></OptionRow>
            <input v-if="seededGame" type="text" name="clonedGamedId" class="create-game-text-input" :placeholder="$t('game id:')" v-model="clonedGameId">
          </section>
          </div>
          <div class="create-game-cards-column">
          <section class="create-game-card" style="order: 2">
            <div class="create-game-card-head"><h2 v-i18n>Board</h2></div>
            <!-- Chance first: with a random board the board chips below only show the pool it draws from -->
            <div class="create-game-subhead" v-i18n>Random</div>
            <OptionRow label="Random board">
              <SwitchInput v-model="randomBoard"/>
            </OptionRow>
            <SegmentedControl v-if="randomBoard" v-model="randomBoardScope" :options="RANDOM_BOARD_OPTIONS"/>
            <OptionRow label="Randomize board tiles" :href="wikiUrls.randomizeBoardTiles">
              <SwitchInput v-model="shuffleMapOption"/>
            </OptionRow>
            <template v-for="group in boardGroups" :key="group.title">
              <div class="create-game-subhead" v-i18n>{{ group.title }}</div>
              <div class="create-game-chip-grid" :class="{'create-game-chip-grid--muted': randomBoard}">
                <ChoiceChip v-for="boardName in group.boards" :key="boardName"
                  :label="boardName" capitalized :selected="board === boardName"
                  @select="board = boardName">
                  <template #icon><span :class="getBoardColorClass(boardName)"></span></template>
                </ChoiceChip>
              </div>
            </template>
            <!-- Exactly the board the game gets (same board seed); a cloned game brings its own board -->
            <CreateGameBoardPreview v-if="!seededGame" :config="boardPreviewConfig" :isRandom="randomBoard || shuffleMapOption" :showBoardName="randomBoard"
              :boardColorClass="getBoardColorClass" @reroll="boardSeed = Math.random()" @drawn="drawnBoard = $event"/>
          </section>

          <!-- Own card: has nothing to do with the board (only with several players, solo has none) -->
          <section v-if="playersCount > 1" class="create-game-card" style="order: 3">
            <div class="create-game-card-head">
              <h2 v-i18n>Milestones &amp; Awards</h2>
              <InfoLink :href="wikiUrls.randomMilestonesAndAwards"/>
            </div>
            <SegmentedControl v-model="randomMA" :options="MILESTONE_OPTIONS"/>
            <template v-if="isRandomMAEnabled()">
              <OptionRow label="Official Random α" sub><SwitchInput v-model="modularMA"/></OptionRow>
              <div v-if="modularMA" class="create-game-note">
                The new Milestones and Awards are still in active development.
                Please don't report anything unless it breaks the game.
                These are <b>always fully random</b>.
              </div>
              <OptionRow label="Include fan Milestones/Awards" sub><SwitchInput v-model="includeFanMA"/></OptionRow>
            </template>
          </section>

          <section class="create-game-card" style="order: 5">
            <div class="create-game-card-head"><h2 v-i18n>Rules</h2></div>
            <OptionRow label="World Government Terraforming" :href="wikiUrls.worldGovernmentTerraforming">
              <SwitchInput v-model="solarPhaseOption"/>
            </OptionRow>
            <OptionRow v-if="playersCount === 1" label="63 TR solo mode" :href="wikiUrls.trSoloMode">
              <SwitchInput v-model="soloTR"/>
            </OptionRow>
            <OptionRow label="Allow undo" :href="wikiUrls.allowUndo"><SwitchInput v-model="undoOption"/></OptionRow>
            <div v-if="undoOption" class="create-game-note">
              <span v-i18n>Undo is now in best effort support.</span>
              <span v-i18n>No effort will be spent to fix it.</span>
              <InfoLink href="https://github.com/terraforming-mars/terraforming-mars/discussions/7647"/>
            </div>
            <OptionRow label="Show timers"><SwitchInput v-model="showTimers"/></OptionRow>
            <template v-if="playersCount > 1">
              <OptionRow label="Show real-time VP" :href="wikiUrls.showRealtimeVP"><SwitchInput v-model="showOtherPlayersVP"/></OptionRow>
              <OptionRow label="Fast mode" :href="wikiUrls.fastMode"><SwitchInput v-model="fastModeOption"/></OptionRow>
            </template>
            <OptionRow label="Escape Velocity" iconClass="expansion-icon-escape-velocity" :href="wikiUrls.escapeVelocity">
              <SwitchInput v-model="escapeVelocityMode"/>
            </OptionRow>
            <template v-if="escapeVelocityMode">
              <div class="create-game-option create-game-option--sub">
                <span v-i18n>After</span>
                <NumberStepper v-model="escapeVelocityThreshold" :min="0" :max="180" :step="5"/>
                <span v-i18n>min</span>
              </div>
              <div class="create-game-option create-game-option--sub">
                <span v-i18n>Plus</span>
                <NumberStepper v-model="escapeVelocityBonusSeconds" :min="1" :max="10"/>
                <span v-i18n>seconds per action</span>
              </div>
              <div class="create-game-option create-game-option--sub">
                <span v-i18n>Reduce</span>
                <NumberStepper v-model="escapeVelocityPenalty" :min="1" :max="10"/>
                <span v-i18n>VP every</span>
                <NumberStepper v-model="escapeVelocityPeriod" :min="1" :max="10"/>
                <span v-i18n>min</span>
              </div>
            </template>
          </section>
          </div>
        </div>

        <!-- Custom lists as their own cards: show (difference to the default as cards) or edit -->
        <CustomCardListCard v-if="showCorporationList" kind="corporations" title="Custom Corporation list"
            :expansions="expansions" :selected="customCorporations" @list-changed="updateCustomCorporations"/>
        <CustomCardListCard v-if="showPreludesList" kind="preludes" title="Custom Preludes list"
            :expansions="expansions" :selected="customPreludes" @list-changed="updateCustomPreludes"/>
        <CustomCardListCard v-if="showCeosList" kind="ceos" title="Custom CEOs list"
            :expansions="expansions" :selected="customCeos" @list-changed="updateCustomCeos"/>
        <ColoniesFilter
            ref="coloniesFilter"
            v-if="showColoniesList"
            @colonies-list-changed="updateCustomColonies"
            :expansions="expansions"
            :selected="customColonies"
            @close="showColoniesList = false"
        />
        <div class="create-game--block" v-if="showBannedCards">
          <CardsFilter
              ref="cardsFilter"
              @cards-list-changed="updateBannedCards"
              :title="'Cards to exclude from the game'"
              :hint="'Start typing the card name to exclude'"
          />
        </div>
        <div class="create-game--block" v-if="showIncludedCards">
          <CardsFilter
              ref="cardsFilter2"
              @cards-list-changed="updateIncludedCards"
              :title="'Cards to include in the game'"
              :hint="'Start typing the card name to include'"
          />
        </div>

      </main>

      <aside class="create-game-side">
        <section class="create-game-players">
          <!-- One scroll area for head and cards: the cards slide under the sticky, frosted head -->
          <div class="create-game-players-scroll" @scroll="onPlayerListScroll">
            <div class="create-game-players-head" :class="{'create-game-players-head--over-list': playerListScrolled}">
              <h2 v-i18n>Players</h2>
              <!-- Humans and AI players in two aligned rows; together they make up the player count -->
              <div class="create-game-seat-rows">
                <span class="create-game-seat-label"><SeatIcon kind="human"/><span v-i18n>Player</span></span>
                <SegmentedControl v-model="humanPlayersCount" :options="humanCountOptions" class="create-game-segmented--equal create-game-segmented--seats"/>
                <span class="create-game-seat-label"><SeatIcon kind="ai"/><span v-i18n>AI</span></span>
                <!-- Blocked: instead of the count a warning that names the expansions/options the AI cannot handle -->
                <div v-if="aiBlockers.length > 0" class="create-game-validation-box create-game-validation-box--warning create-game-seat-warning" role="status">
                  <h3 class="create-game-validation-title"><span aria-hidden="true">&#9888;&#xFE0E;</span><span v-i18n>AI not available with:</span></h3>
                  <!-- Same chips as the summary above the Create button -->
                  <div class="create-game-summary">
                    <span v-for="blocker in aiBlockerChips" :key="blocker.label" class="create-game-summary-chip">
                      <span :class="['create-game-expansion-icon', blocker.iconClass]"></span><span v-i18n>{{ blocker.label }}</span>
                    </span>
                  </div>
                </div>
                <SegmentedControl v-else v-model="aiPlayersCount" :options="aiCountOptions" class="create-game-segmented--equal create-game-segmented--seats"/>
              </div>
              <!-- Who starts belongs to the players: switched on, the "Goes first" stars on the player cards disappear -->
              <OptionRow v-if="playersCount > 1" class="create-game-players-first" label="Random first player"><SwitchInput v-model="randomFirstPlayer"/></OptionRow>
            </div>
            <!-- Humans always first, then AI players; seats slide in and out when the counts change -->
            <TransitionGroup tag="div" name="create-game-seat" class="create-game-player-list" :css="false" @enter="collapseEnter" @leave="collapseLeave">
              <!-- Neutral card; the header shows the chosen player color -->
              <!-- Humans stand out (full color, glow); AI players stay quieter (tinted header, thin outline) -->
              <div v-for="(newPlayer, index) in getPlayers()" :key="seatKey(newPlayer)"
                :class="['create-game-player', 'create-game-player--' + newPlayer.color, {'create-game-player--ai': newPlayer.aiLevel !== undefined}]">
                <div class="create-game-player-top">
                  <!-- Seat: meeple or robot plus seat number -->
                  <span class="create-game-player-position">
                    <SeatIcon :kind="newPlayer.aiLevel !== undefined ? 'ai' : 'human'"/>{{ index + 1 }}
                  </span>
                  <span class="create-game-player-name-field">
                    <input class="create-game-player-name" :placeholder="getPlayerNamePlaceholder(index)" v-model="newPlayer.name">
                    <!-- Fixed AI marker right behind the typed name; not part of the input, so nobody types it twice -->
                    <span v-if="newPlayer.aiLevel !== undefined" class="create-game-player-name-marker" aria-hidden="true"><span class="create-game-player-name-ghost">{{ newPlayer.name || getPlayerNamePlaceholder(index) }}</span> {{ aiMarker(newPlayer.aiLevel) }}</span>
                  </span>
                  <button v-if="playersCount > 1 && !randomFirstPlayer" type="button" class="create-game-first"
                    :class="{'create-game-first--selected': firstIndex === index + 1}" :title="$t('Goes First?')"
                    @click="firstIndex = index + 1">
                    <span>{{ firstIndex === index + 1 ? '★' : '☆' }}</span>
                    <span v-if="firstIndex === index + 1" v-i18n>Goes first</span>
                  </button>
                </div>
                <div class="create-game-swatches">
                  <!-- Colors as player cubes: all lying (top view), the chosen one standing (slightly from above); animated tilt in both directions -->
                  <button v-for="color in PLAYER_COLORS" :key="color" type="button"
                    :class="['create-game-swatch', {'create-game-swatch--selected': newPlayer.color === color}]"
                    :disabled="isColorTaken(color, index)" :title="$t(color)" :aria-pressed="newPlayer.color === color"
                    @click="newPlayer.color = color">
                    <PlayerCube :color="color" :view="newPlayer.color === color ? 'slight' : 'top'" :size="newPlayer.color === color ? 17 : 16" animated/>
                  </button>
                </div>
                <div v-if="newPlayer.aiLevel !== undefined" class="create-game-ai-strength">
                  <span v-i18n>Strength</span>
                  <SegmentedControl v-model="newPlayer.aiLevel" :options="AI_LEVEL_OPTIONS" class="create-game-segmented--equal"/>
                </div>
                <div class="create-game-player-extra">
                  <!-- The beginner corporation is a help for humans; AI players do not need it -->
                  <label v-if="isBeginnerToggleEnabled() && newPlayer.aiLevel === undefined" class="create-game-player-toggle">
                    <SwitchInput v-model="newPlayer.beginner"/>
                    <span v-i18n>Beginner?</span>
                    <InfoLink :href="wikiUrls.beginnerCorporation"/>
                  </label>
                  <span class="create-game-player-toggle">
                    <span v-i18n>TR Boost</span>
                    <InfoLink :href="wikiUrls.trBoost"/>
                    <NumberStepper v-model="newPlayer.handicap" :min="0" :max="10"/>
                  </span>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </section>
        <!-- Sticks to the bottom edge while the page is too short for it; then with an extra shadow -->
        <section ref="createCard" class="create-game-card create-game-create-card" :class="{'create-game-create-card--stuck': createCardStuck}">
          <div class="create-game-summary">
            <!-- Humans and AI players as separate chips, with the same icons as the seat rows -->
            <span v-for="seat in seatSummary" :key="seat.kind" class="create-game-summary-chip"><SeatIcon :kind="seat.kind"/>{{ seat.label }}</span>
            <!-- Random board: the board already drawn for the preview, exactly the one the game gets -->
            <span class="create-game-summary-chip">
              <span v-if="summaryBoard !== undefined" :class="getBoardColorClass(summaryBoard)"></span>
              <span class="capitalized">{{ $t(summaryBoard ?? board) }}</span>
            </span>
            <!-- Every expansion in play by name, the base game included -->
            <span v-for="choice in activeExpansionChoices" :key="choice.label" class="create-game-summary-chip">
              <span :class="['create-game-expansion-icon', choice.iconClass]"></span><span v-i18n>{{ choice.label }}</span>
            </span>
            <span v-if="playersCount > 1 && draftVariant" class="create-game-summary-chip" v-i18n>Draft</span>
          </div>
          <div class="create-game-create-row">
            <AppButton class="create-game-create" title="Create game" size="big" @click="createGame" :disabled="hasBlockingValidationErrors"/>
          </div>
          <ValidationProblems v-if="hasValidationProblems" :errors="validationErrors"/>
        </section>
      </aside>
    </div>

  </div>
</template>

<script lang="ts">
import * as constants from '@/common/constants';

import {defineComponent, nextTick} from 'vue';
import {Color, PLAYER_COLORS} from '@/common/Color';
import {BoardName} from '@/common/boards/BoardName';
import {RandomBoardOption} from '@/common/boards/RandomBoardOption';
import {CardName} from '@/common/cards/CardName';
import CustomCardListCard from '@/client/components/create/CustomCardListCard.vue';
import CreateGameBoardPreview from '@/client/components/create/CreateGameBoardPreview.vue';
import {observeStickyBottom} from '@/client/components/create/stickyBottomObserver';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {AI_SUPPORTED_EXPANSIONS, aiUnsupportedReasons} from '@/common/ai/aiSupport';
import ColoniesFilter from '@/client/components/create/ColoniesFilter.vue';
import {ColonyName} from '@/common/colonies/ColonyName';
import CardsFilter from '@/client/components/create/CardsFilter.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {AiLevel, aiPlayerMarker} from '@/common/ai/AiLevel';
import SeatIcon from './SeatIcon.vue';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';
import {GameId, JSONObject} from '@/common/Types';
import PageToolbar from '@/client/components/PageToolbar.vue';
import PageTitle from '@/client/components/common/PageTitle.vue';
import {getCard} from '@/client/cards/ClientCardManifest';
import {BoardNameType, NewGameConfig, NewPlayerModel} from '@/common/game/NewGameConfig';
import {vueRoot} from '@/client/components/vueRoot';
import {CreateGameModel} from './CreateGameModel';
import {paths} from '@/common/app/paths';
import {JSONProcessor} from './JSONProcessor';
import {defaultCreateGameModel} from './defaultCreateGameModel';
import {CreateGameSettingsStorage} from './CreateGameSettingsStorage';
import {readSettingsFromHash, replaceSettingsHash, settingsHash} from './settingsLink/settingsLinkHash';
import {getColony} from '@/client/colonies/ClientColonyManifest';
import {RULEBOOK_URLS, WIKI_URLS} from '@/client/utils/WikiLinks';
import {setDocumentTitle} from '@/client/utils/documentTitle';
import {sanitizeEscapeVelocityOptions} from '@/common/game/escapeVelocity';
import {validateNewGameConfig, validationDetails, ValidationErrors} from '@/common/game/validateNewGameConfig';
import ValidationProblems from './ValidationProblems.vue';
import ChoiceChip from './ChoiceChip.vue';
import ExpansionGroupMenu from './ExpansionGroupMenu.vue';
import InfoLink from './InfoLink.vue';
import NumberStepper from './NumberStepper.vue';
import OptionRow from './OptionRow.vue';
import SegmentedControl from './SegmentedControl.vue';
import SwitchInput from './SwitchInput.vue';
import {AGENDA_OPTIONS, AI_LEVEL_OPTIONS, ExpansionChoice, FAN_BOARDS, FAN_EXPANSIONS, MILESTONE_OPTIONS, OFFICIAL_BOARDS, OFFICIAL_EXPANSIONS, PLAYER_COUNT_OPTIONS, RANDOM_BOARD_OPTIONS, SeatIconKind, SegmentOption} from './createGameChoices';
import {ExpansionGroup, ExpansionGrouping, ExpansionTile, groupExpansions, loadExpansionGrouping, saveExpansionGrouping} from './expansionGrouping';
import {ContentLinePart, contentLine} from './expansionContentLine';
import {ContentKey, TraitKey} from '@/common/game/expansionFacts';
import {requiredByTooltip, requirementsOf} from './expansionDependencies';
import {Expansion} from '@/common/cards/GameModule';
import {arrangeSeats, seatKey} from './seatOrder';
import {collapseEnter, collapseLeave} from '@/client/utils/collapseAnimation';

const createGameSettingsStorage = new CreateGameSettingsStorage();

type Refs = {
  file: HTMLInputElement;
  cardsFilter: InstanceType<typeof CardsFilter>;
  cardsFilter2: InstanceType<typeof CardsFilter>;
};

type FormModel = {
  /** Grouping of the expansion tiles; a view choice, not a game setting */
  expansionGrouping: ExpansionGrouping;
  preludeToggled: boolean;
  uploading: boolean;
  previousViewport: string;
  /** Only start writing the URL after loading, otherwise the default state overwrites the shared link */
  settingsLinkReady: boolean;
  settingsLinkCopied: boolean;
  /** Board chosen before switching on "Random board" – comes back when it is switched off */
  lastFixedBoard: BoardName;
  /** Seed of the board (random board, shuffled bonuses): preview and created game use the same one; not a setting */
  boardSeed: number;
  /** Board the preview drew (random board) */
  drawnBoard: BoardName | undefined;
  /** Create card sticks to the bottom edge (stickyBottomObserver.ts) */
  createCardStuck: boolean;
  /** Player list scrolled: its cards slide under the fixed head, which then casts a shadow */
  playerListScrolled: boolean;
  stopStickyObserver: () => void;
};

// Distance of the sticky Create card to the bottom edge; same value as bottom in create_game_form.less
const CREATE_CARD_BOTTOM_PX = 12;

// How long the button shows "Link copied"
const LINK_COPIED_FEEDBACK_MS = 2000;

// Players per game, humans and AI together
const MAX_PLAYERS = 6;

export default defineComponent({
  name: 'CreateGameForm',
  data(): CreateGameModel & FormModel {
    return {
      ...defaultCreateGameModel(),
      expansionGrouping: loadExpansionGrouping(),
      preludeToggled: false,
      uploading: false,
      previousViewport: '',
      settingsLinkReady: false,
      settingsLinkCopied: false,
      lastFixedBoard: BoardName.THARSIS,
      boardSeed: Math.random(),
      drawnBoard: undefined,
      createCardStuck: false,
      playerListScrolled: false,
      stopStickyObserver: () => {},
    };
  },
  components: {
    AppButton,
    SeatIcon,
    PlayerCube,
    CardsFilter,
    ChoiceChip,
    ColoniesFilter,
    ExpansionGroupMenu,
    CustomCardListCard,
    CreateGameBoardPreview,
    InfoLink,
    NumberStepper,
    OptionRow,
    PageToolbar,
    PageTitle,
    SegmentedControl,
    SwitchInput,
    ValidationProblems,
  },
  watch: {
    // A setting the AI cannot handle removes the AI players right away
    aiBlockers(blockers: Array<string>) {
      if (blockers.length > 0 && this.aiPlayersCount > 0) {
        this.setSeatCounts(this.humanPlayersCount, 0, 'ai');
      }
    },
    expansionGrouping(value: ExpansionGrouping) {
      saveExpansionGrouping(value);
    },
    board(value: BoardNameType) {
      if (!this.isRandomBoard(value)) {
        this.lastFixedBoard = value as BoardName;
      }
    },
    'expansions.venus': function(value: boolean) {
      this.solarPhaseOption = value;
    },
    'expansions.turmoil': function(value: boolean) {
      if (value === false) {
        this.politicalAgendasExtension = 'Standard';
      }
    },
    initialDraft(value: boolean) {
      if (value === true && this.preludeDraftVariant === undefined) {
        this.preludeDraftVariant = true;
      }
      if (value === true && this.ceosDraftVariant === undefined) {
        this.ceosDraftVariant = true;
      }
    },
    'expansions.prelude': function(value: boolean) {
      if (value === true && this.preludeDraftVariant === undefined) {
        this.preludeDraftVariant = true;
      }
    },
    'expansions.prelude2': function(value: boolean) {
      if (value === true && this.preludeToggled === false && this.uploading === false) {
        this.expansions.prelude = true;
        this.preludeToggled = true;
      }
    },
    currentSettingsHash(hash: string) {
      if (this.settingsLinkReady && !this.uploading) {
        replaceSettingsHash(hash);
      }
    },
    uploading(value: boolean) {
      // After an import (file, link, last settings) carry the final state into the URL
      if (value === false && this.settingsLinkReady) {
        replaceSettingsHash(this.currentSettingsHash);
      }
    },
    playersCount(value: number) {
      if (value === 1) {
        this.expansions.corpera = true;
      }
    },
  },
  created() {
    // Restore before the first render: restoring in mounted() painted the default seat (red "Player 1")
    // first, which then animated out while the saved seats animated in.
    // A shared link takes precedence over the most recently used settings.
    if (!this.restoreSettingsFromLink()) {
      this.restoreLastSettings();
    }
  },
  mounted() {
    setDocumentTitle('Create New Game');
    this.stopStickyObserver = observeStickyBottom(this.$refs.createCard as HTMLElement, CREATE_CARD_BOTTOM_PX, (stuck) => {
      this.createCardStuck = stuck;
    });
    nextTick(() => {
      this.settingsLinkReady = true;
      if (!this.uploading) {
        replaceSettingsHash(this.currentSettingsHash);
      }
    });

    // Set the viewport width to width=device-width on the create game form so mobile browsers use their actual CSS viewport width.
    // The current global viewport is width=1260, which prevents the create game form from using the device width on phones.
    // This is a temporary solution in order to make this edit scoped to the create game form.
    // TODO: Once responsiveness covers the whole project, this code should be removed and the tag in index.html should be updated directly.
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport !== null) {
      this.previousViewport = viewport.getAttribute('content') ?? '';
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1, viewport-fit=cover',
      );
    }
  },
  beforeUnmount() {
    this.stopStickyObserver();
    document
      .querySelector('meta[name="viewport"]')
      ?.setAttribute('content', this.previousViewport);
  },
  computed: {
    // Arrow paths are used twice (drawn + as mask cut), so they live here once
    importArrowPath(): string {
      return 'M5.44 2.7L11.75 13.63M12.33 10.89L11.75 13.63L9.09 12.77';
    },
    exportArrowPath(): string {
      return 'M12.25 13.63L18.56 2.7M15.9 3.56L18.56 2.7L19.15 5.44';
    },
    wikiUrls(): typeof RULEBOOK_URLS & typeof WIKI_URLS {
      return {...RULEBOOK_URLS, ...WIKI_URLS};
    },
    /**
     * The game settings, as they'd be sent to the server.
     *
     * serializeSettings finishes the players and the escape velocity values, and checks the cloned game.
     */
    expansionGroups(): Array<ExpansionGroup> {
      return groupExpansions(this.expansionGrouping);
    },
    // Fixed board: its name; random board: the drawn one as soon as the preview knows it
    summaryBoard(): BoardName | undefined {
      if (!this.isRandomBoard(this.board)) {
        return this.board as BoardName;
      }
      return this.seededGame ? undefined : this.drawnBoard;
    },
    // Request of the board preview: the full settings like when creating, plus the board seed
    boardPreviewConfig(): NewGameConfig {
      return {...this.newGameConfig, boardSeed: this.boardSeed};
    },
    newGameConfig(): NewGameConfig {
      return {
        players: this.players.slice(0, this.playersCount),
        expansions: this.expansions,
        draftVariant: this.draftVariant,
        showOtherPlayersVP: this.showOtherPlayersVP,
        customCorporationsList: this.customCorporations,
        customColoniesList: this.customColonies,
        customCeos: this.customCeos,
        customPreludes: this.customPreludes,
        bannedCards: this.bannedCards,
        includedCards: this.includedCards,
        board: this.board,
        seed: this.seed,
        solarPhaseOption: this.solarPhaseOption,
        aresExtremeVariant: this.aresExtremeVariant,
        politicalAgendasExtension: this.politicalAgendasExtension,
        undoOption: this.undoOption,
        showTimers: this.showTimers,
        fastModeOption: this.fastModeOption,
        removeNegativeGlobalEventsOption: this.removeNegativeGlobalEventsOption,
        includeFanMA: this.includeFanMA,
        modularMA: this.modularMA,
        startingCorporations: this.startingCorporations,
        soloTR: this.soloTR,
        clonedGamedId: this.seededGame ? this.clonedGameId : undefined,
        initialDraft: this.initialDraft,
        preludeDraftVariant: this.preludeDraftVariant ?? false,
        ceosDraftVariant: this.ceosDraftVariant ?? false,
        randomMA: this.randomMA,
        shuffleMapOption: this.shuffleMapOption,
        randomFirstPlayer: this.randomFirstPlayer,
        requiresVenusTrackCompletion: this.requiresVenusTrackCompletion,
        requiresMoonTrackCompletion: this.requiresMoonTrackCompletion,
        moonStandardProjectVariant: this.moonStandardProjectVariant,
        moonStandardProjectVariant1: this.moonStandardProjectVariant1,
        altVenusBoard: this.altVenusBoard,
        // Not sanitized, so validation can catch negative values.
        escapeVelocity: this.escapeVelocityMode ? {
          thresholdMinutes: this.escapeVelocityThreshold,
          bonusSectionsPerAction: this.escapeVelocityBonusSeconds,
          penaltyPeriodMinutes: this.escapeVelocityPeriod,
          penaltyVPPerPeriod: this.escapeVelocityPenalty,
        } : undefined,
        twoCorpsVariant: this.twoCorpsVariant,
        startingCeos: this.startingCeos,
        startingPreludes: this.startingPreludes,
      };
    },
    /** The settings as a URL hash; changes along with every form change. */
    currentSettingsHash(): string {
      return settingsHash(this);
    },
    validationErrors(): ValidationErrors {
      return validateNewGameConfig(this.newGameConfig, {
        getCardCompatibility: (name) => getCard(name)?.compatibility ?? [],
        getColonyExpansion: (name) => {
          return getColony(name)?.expansion;
        },
      });
    },
    hasValidationProblems(): boolean {
      return Object.values(this.validationErrors).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
    },
    hasBlockingValidationErrors(): boolean {
      return (Object.keys(validationDetails) as Array<keyof ValidationErrors>).some((key) => {
        const value = this.validationErrors[key];
        return validationDetails[key].blocking && (Array.isArray(value) ? value.length > 0 : Boolean(value));
      });
    },
    typedRefs(): Refs {
      return this.$refs as Refs;
    },
    RandomBoardOption(): typeof RandomBoardOption {
      return RandomBoardOption;
    },
    PLAYER_COLORS(): typeof PLAYER_COLORS {
      return PLAYER_COLORS;
    },
    PLAYER_COUNT_OPTIONS(): typeof PLAYER_COUNT_OPTIONS {
      return PLAYER_COUNT_OPTIONS;
    },
    AI_LEVEL_OPTIONS(): typeof AI_LEVEL_OPTIONS {
      return AI_LEVEL_OPTIONS;
    },
    // Seats an AI takes show a greyed robot instead of their number; "Solo" only describes one human without AI opponents
    humanCountOptions(): ReadonlyArray<SegmentOption> {
      return PLAYER_COUNT_OPTIONS.map((option) => {
        const count = Number(option.value);
        if (count > MAX_PLAYERS - this.aiPlayersCount) {
          return {value: count, label: 'Seat taken by AI', icon: 'ai', disabled: true};
        }
        return count === 1 && this.aiPlayersCount > 0 ? {value: 1, label: '1'} : option;
      });
    },
    // Mirror image: seats the humans take show a greyed meeple; "0" is a "no entry" sign
    aiCountOptions(): ReadonlyArray<SegmentOption> {
      return [0, 1, 2, 3, 4, 5].map((count): SegmentOption => {
        if (count === 0) {
          return {value: 0, label: 'No AI', icon: 'none'};
        }
        if (count > MAX_PLAYERS - this.humanPlayersCount) {
          return {value: count, label: 'Seat taken by a human', icon: 'human', disabled: true};
        }
        return {value: count, label: String(count)};
      });
    },
    // Settings the AI cannot handle (common/ai/aiSupport.ts), e.g. ['Colonies', 'Merger']
    aiBlockers(): Array<string> {
      return aiUnsupportedReasons({expansions: this.expansions, twoCorpsVariant: this.twoCorpsVariant});
    },
    // The blocking settings with their icons: expansions as in the expansion list, Merger with the Prelude icon like its option row
    aiBlockerChips(): Array<Pick<ExpansionChoice, 'label' | 'iconClass'>> {
      const expansionChips = [...OFFICIAL_EXPANSIONS, ...FAN_EXPANSIONS]
        .filter((choice) => this.expansions[choice.expansion] && !AI_SUPPORTED_EXPANSIONS.includes(choice.expansion));
      const mergerChips = this.twoCorpsVariant ? [{label: 'Merger', iconClass: 'expansion-icon-prelude'}] : [];
      return [...expansionChips, ...mergerChips];
    },
    humanPlayersCount: {
      get(): number {
        return this.playersCount - this.aiPlayersCount;
      },
      set(count: number) {
        this.setSeatCounts(count, this.aiPlayersCount, 'humans');
      },
    },
    // AI seats are the last seats; a seat is an AI seat when its player has an AI level
    aiPlayersCount: {
      get(): number {
        return this.players.slice(0, this.playersCount).filter((player) => player.aiLevel !== undefined).length;
      },
      set(count: number) {
        this.setSeatCounts(this.humanPlayersCount, count, 'ai');
      },
    },
    MILESTONE_OPTIONS(): typeof MILESTONE_OPTIONS {
      return MILESTONE_OPTIONS;
    },
    AGENDA_OPTIONS(): typeof AGENDA_OPTIONS {
      return AGENDA_OPTIONS;
    },
    RANDOM_BOARD_OPTIONS(): typeof RANDOM_BOARD_OPTIONS {
      return RANDOM_BOARD_OPTIONS;
    },
    // "Random board" is stored as the board value itself (RandomBoardOption), like before
    randomBoard: {
      get(): boolean {
        return this.isRandomBoard(this.board);
      },
      set(value: boolean) {
        this.board = value ? RandomBoardOption.OFFICIAL : this.lastFixedBoard;
      },
    },
    randomBoardScope: {
      get(): string {
        return this.isRandomBoard(this.board) ? this.board : RandomBoardOption.OFFICIAL;
      },
      set(value: string) {
        this.board = value as RandomBoardOption;
      },
    },
    boardGroups() {
      return [
        {title: 'Official', boards: OFFICIAL_BOARDS},
        {title: 'Fan-made', boards: FAN_BOARDS},
      ];
    },
    // The "Expansion options" card only has content if one of these expansions is active
    hasExpansionOptions(): boolean {
      return this.expansions.venus || this.expansions.turmoil || this.expansions.moon || this.expansions.ares;
    },
    seatSummary(): Array<{kind: SeatIconKind, label: string}> {
      if (this.playersCount === 1) {
        return [{kind: 'human', label: translateText('Solo')}];
      }
      const seats: Array<{kind: SeatIconKind, label: string}> = [];
      if (this.humanPlayersCount > 0) {
        seats.push({kind: 'human', label: this.humanPlayersCount === 1 ? translateText('1 player') : translateTextWithParams('${0} players', [String(this.humanPlayersCount)])});
      }
      if (this.aiPlayersCount > 0) {
        seats.push({kind: 'ai', label: translateTextWithParams('${0} AI', [String(this.aiPlayersCount)])});
      }
      return seats;
    },
    activeExpansionChoices(): Array<Pick<ExpansionChoice, 'label' | 'iconClass'>> {
      const active = [...OFFICIAL_EXPANSIONS, ...FAN_EXPANSIONS].filter((choice) => this.expansions[choice.expansion]);
      return [{label: 'Base game', iconClass: 'expansion-icon-base'}, ...active];
    },
  },
  methods: {
    setSeatCounts(humans: number, ai: number, changed: 'humans' | 'ai') {
      // At most 6 players: the row just changed wins, the other one gives way
      const humanCount = changed === 'humans' ? humans : Math.max(1, Math.min(humans, MAX_PLAYERS - ai));
      const aiCount = changed === 'ai' ? Math.min(ai, MAX_PLAYERS - 1) : Math.min(ai, MAX_PLAYERS - humanCount);
      const total = humanCount + aiCount;
      // The star stays with its player, even when that seat moves
      const firstPlayer = this.players[this.firstIndex - 1];
      const arranged = arrangeSeats(this.players, this.playersCount, humanCount, aiCount);
      this.players.splice(0, arranged.length, ...arranged);
      this.playersCount = total;
      const firstPosition = arranged.indexOf(firstPlayer);
      this.firstIndex = firstPosition >= 0 && firstPosition < total ? firstPosition + 1 : 1;
    },
    seatKey(player: NewPlayerModel): number {
      return seatKey(player);
    },
    collapseEnter,
    collapseLeave,
    restoreSettingsFromLink(): boolean {
      try {
        const settings = readSettingsFromHash(window.location.hash);
        if (settings === undefined) {
          return false;
        }
        const processor = this.applySettings(settings);
        if (processor.warnings.length > 0) {
          this.showSettingsLoadResult('Settings link', processor);
        }
        return true;
      } catch (e) {
        vueRoot(this).showAlert('Settings link', 'Error loading settings ' + e);
        return false;
      }
    },
    async copySettingsLink() {
      replaceSettingsHash(this.currentSettingsHash);
      try {
        await navigator.clipboard.writeText(window.location.href);
        this.settingsLinkCopied = true;
        window.setTimeout(() => {
          this.settingsLinkCopied = false;
        }, LINK_COPIED_FEEDBACK_MS);
      } catch (e) {
        // Without clipboard permission (e.g. http without TLS) the URL stays in the address bar for copying
        vueRoot(this).showAlert('Copy link', String(e));
      }
    },
    restoreLastSettings() {
      const settings = createGameSettingsStorage.loadSettings();
      if (settings === undefined) {
        return;
      }
      try {
        const processor = this.applySettings(settings);
        if (processor.warnings.length > 0) {
          this.showSettingsLoadResult('Restore settings', processor);
        }
      } catch (e) {
        // TODO(rusliksu): show the restore error in the UI instead of logging only to the console.
        console.warn('Could not restore create game settings:', e);
      }
    },
    applySettings(json: JSONObject): JSONProcessor {
      const component: CreateGameModel = this;
      const refs = this.typedRefs;
      const processor = new JSONProcessor(component);
      this.uploading = true;
      try {
        processor.applyJSON(json);
        // Saved games may hold any order (e.g. shuffled seats): humans first, then AI players
        this.setSeatCounts(this.humanPlayersCount, this.aiPlayersCount, 'humans');
      } catch (e) {
        this.uploading = false;
        throw e;
      }
      nextTick(() => {
        try {
          if (component.showBannedCards && refs.cardsFilter) {
            refs.cardsFilter.selected = processor.bannedCards;
          }
          if (component.showIncludedCards && refs.cardsFilter2) {
            refs.cardsFilter2.selected = processor.includedCards;
          }
          if (!component.seededGame) {
            component.seed = Math.random();
          }
          component.solarPhaseOption = Boolean(processor.solarPhaseOption);
        } finally {
          this.uploading = false;
        }
      });
      return processor;
    },
    showSettingsLoadResult(title: string, processor: JSONProcessor) {
      const root = vueRoot(this);
      if (processor.warnings.length > 0) {
        root.showAlert(title, 'Settings loaded with these warnings: \n' + processor.warnings.join('\n'));
      } else {
        root.showAlert(title, 'Settings loaded.');
      }
    },
    // Switches a whole group of expansions on or off (dependent options follow via the expansion watchers)
    setExpansions(choices: ReadonlyArray<ExpansionChoice>, value: boolean) {
      for (const choice of choices) {
        this.setExpansion(choice.expansion, value);
      }
    },
    toggleExpansion(expansion: Expansion) {
      this.setExpansion(expansion, !this.expansions[expansion]);
    },
    // Switching an expansion on also switches on what part of it needs (expansionDependencies.ts)
    setExpansion(expansion: Expansion, value: boolean) {
      this.expansions[expansion] = value;
      if (value) {
        for (const required of requirementsOf(expansion)) {
          this.expansions[required] = true;
        }
      }
    },
    // Expansions of a group that can be switched (not the base game)
    choicesOf(group: ExpansionGroup): Array<ExpansionChoice> {
      return group.tiles.flatMap((tile) => tile.choice === undefined ? [] : [tile.choice]);
    },
    allSelected(group: ExpansionGroup): boolean {
      return this.choicesOf(group).every((choice) => this.expansions[choice.expansion]);
    },
    contentLine(tile: ExpansionTile, highlight: ContentKey | TraitKey | undefined, withSource: boolean): Array<ContentLinePart> {
      return contentLine(tile, highlight, withSource);
    },
    requiredByTooltip(expansion: Expansion, selected: Record<Expansion, boolean>): string | undefined {
      return requiredByTooltip(expansion, selected);
    },
    resetSettings() {
      createGameSettingsStorage.clearSettings();
      Object.assign(this, defaultCreateGameModel(), {
        preludeToggled: false,
        uploading: false,
        // Fresh draw for random board and shuffled bonuses
        boardSeed: Math.random(),
      });
      nextTick(() => {
        const refs = this.typedRefs;
        if (refs.cardsFilter) {
          refs.cardsFilter.selected = [];
        }
        if (refs.cardsFilter2) {
          refs.cardsFilter2.selected = [];
        }
      });
    },
    async downloadSettings() {
      const newGameConfig = await this.serializeSettings();

      if (newGameConfig) {
        const a = document.createElement('a');
        const blob = new Blob([JSON.stringify(newGameConfig, undefined, 2)], {'type': 'application/json'});
        a.href = window.URL.createObjectURL(blob);
        a.download = 'tm_settings.json';
        a.click();
      }
    },
    uploadSettings() {
      const refs = this.typedRefs;
      const file = refs.file.files !== null ? refs.file.files[0] : undefined;
      const reader = new FileReader();

      reader.addEventListener('load', () => {
        try {
          const readerResults = reader.result;
          if (typeof(readerResults) === 'string') {
            const processor = this.applySettings(JSON.parse(readerResults));
            this.showSettingsLoadResult('Upload settings', processor);
          }
        } catch (e) {
          const root = vueRoot(this);
          root.showAlert('Upload settings', 'Error loading settings ' + e);
        }
      }, false);
      if (file) {
        if (/\.json$/i.test(file.name)) {
          reader.readAsText(file);
        }
      }
    },
    getPlayerNamePlaceholder(index: number): string {
      return translateTextWithParams('Player ${0} name', [String(index + 1)]);
    },
    updateCustomCorporations(customCorporations: Array<CardName>) {
      this.customCorporations = customCorporations;
    },
    updateCustomPreludes(customPreludes: Array<CardName>) {
      this.customPreludes = customPreludes;
    },
    updateBannedCards(bannedCards: Array<CardName>) {
      this.bannedCards = bannedCards;
    },
    updateIncludedCards(includedCards: Array<CardName>) {
      this.includedCards = includedCards;
    },
    updateCustomColonies(customColonies: Array<ColonyName>) {
      this.customColonies = customColonies;
    },
    updateCustomCeos(customCeos: Array<CardName>) {
      this.customCeos = customCeos;
    },
    // A colour that another player already has can't be chosen
    isColorTaken(color: Color, index: number): boolean {
      return this.getPlayers().some((player, otherIndex) => otherIndex !== index && player.color === color);
    },
    isRandomBoard(boardName: BoardNameType): boolean {
      return boardName === RandomBoardOption.OFFICIAL || boardName === RandomBoardOption.ALL;
    },
    onPlayerListScroll(event: Event) {
      this.playerListScrolled = (event.target as HTMLElement).scrollTop > 0;
    },
    getPlayers(): Array<NewPlayerModel> {
      return this.players.slice(0, this.playersCount);
    },
    isRandomMAEnabled(): boolean {
      return this.randomMA !== RandomMAOptionType.NONE;
    },
    isPoliticalAgendasExtensionEnabled(): boolean {
      return this.politicalAgendasExtension !== 'Standard';
    },
    politicalAgendasExtensionToggle() {
      if (this.politicalAgendasExtension === 'Standard') {
        this.politicalAgendasExtension = 'Random';
      } else {
        this.politicalAgendasExtension = 'Standard';
      }
    },
    isBeginnerToggleEnabled(): boolean {
      return !(this.initialDraft || this.expansions.prelude || this.expansions.venus || this.expansions.colonies || this.expansions.turmoil);
    },
    deselectVenusCompletion() {
      if (this.expansions.venus === false) {
        this.requiresVenusTrackCompletion = false;
      }
    },
    deselectMoonCompletion() {
      if (this.expansions.moon === false) {
        this.requiresMoonTrackCompletion = false;
        this.moonStandardProjectVariant = false;
        this.moonStandardProjectVariant1 = false;
      }
    },
    getBoardColorClass(boardName: BoardName | BoardNameType): string {
      switch (boardName) {
      case BoardName.THARSIS:
        return 'create-game-board-hexagon create-game-tharsis';
      case BoardName.HELLAS:
        return 'create-game-board-hexagon create-game-hellas';
      case BoardName.ELYSIUM:
        return 'create-game-board-hexagon create-game-elysium';
      case BoardName.UTOPIA_PLANITIA:
        return 'create-game-board-hexagon create-game-utopia-planitia';
      case BoardName.VASTITAS_BOREALIS_NOVA:
        return 'create-game-board-hexagon create-game-vastitas-borealis-nova';
      case BoardName.AMAZONIS:
        return 'create-game-board-hexagon create-game-amazonis';
      case BoardName.ARABIA_TERRA:
        return 'create-game-board-hexagon create-game-arabia-terra';
      case BoardName.TERRA_CIMMERIA:
        return 'create-game-board-hexagon create-game-terra-cimmeria';
      case BoardName.VASTITAS_BOREALIS:
        return 'create-game-board-hexagon create-game-vastitas-borealis';
      case BoardName.HOLLANDIA:
        return 'create-game-board-hexagon create-game-hollandia';
      default:
        return 'create-game-board-hexagon create-game-random';
      }
    },
    aiMarker(level: AiLevel): string {
      return aiPlayerMarker(level);
    },
    async serializeSettings(): Promise<NewGameConfig | undefined> {
      // Copies: default names below go into the request only, not into the form (an AI seat
      // that turns human again must not keep "(AI)" in its name)
      let players = this.players.slice(0, this.playersCount).map((player) => ({...player}));

      if (this.randomFirstPlayer) {
        // Shuffle players array to assign each player a random seat around the table
        players = players.map((a) => ({sort: Math.random(), value: a}))
          .sort((a, b) => a.sort - b.sort)
          .map((a) => a.value);
        this.firstIndex = Math.floor(this.seed * this.playersCount) + 1;
      }

      // Auto assign an available color if there are duplicates
      const uniqueColors = new Set(players.map((player) => player.color));
      if (uniqueColors.size !== players.length) {
        const usedColors: Set<Color> = new Set();
        // This filter retains the default player color order.
        const unusedColors = PLAYER_COLORS.filter((c) => !uniqueColors.has(c));
        for (const player of players) {
          const color = player.color;
          if (usedColors.has(color)) {
            // Pulling off the front of the list also helps retain the default player color order.
            player.color = unusedColors.shift() as Color;
            usedColors.add(color);
          } else {
            usedColors.add(color);
          }
        }
      }

      // Set player name automatically if not entered
      const isSoloMode = this.playersCount === 1;

      players.forEach((player) => {
        if (player.name === '') {
          if (isSoloMode) {
            player.name = this.$t('You');
          } else {
            const defaultPlayerName = this.$t(player.color.charAt(0).toUpperCase() + player.color.slice(1));
            // The server adds the AI marker ("[AI]", "[AI-]", "[AI+]") to the name
            player.name = defaultPlayerName;
          }
        }
      });

      // firstIndex counts seats from 1 (the star on the player card, or the drawn seat after shuffling)
      players.forEach((player, index) => {
        player.first = this.firstIndex === index + 1;
      });

      let clonedGamedId: undefined | GameId = undefined;

      // Clone game checks
      if (this.clonedGameId !== undefined && this.seededGame) {
        const gameData = await fetch(paths.API_CLONEABLEGAME + '?id=' + this.clonedGameId)
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            if (response.status === 404) {
              return undefined;
            }
            return response.text().then((res) => new Error(res));
          });
        if (gameData === undefined) {
          alert(this.$t('Game id ' + this.clonedGameId + ' not found'));
          return undefined;
        }
        if (gameData instanceof Error) {
          alert(this.$t('Error looking for predefined game ' + gameData.message));
          return undefined;
        }
        clonedGamedId = this.clonedGameId;
        if (gameData.playerCount !== players.length) {
          alert(this.$t('Player count mismatch'));
          this.playersCount = gameData.playerCount;
          return undefined;
        }
      } else if (!this.seededGame) {
        clonedGamedId = undefined;
      }

      const config = this.newGameConfig;
      return {
        ...config,
        players,
        clonedGamedId,
        escapeVelocity: config.escapeVelocity === undefined ? undefined : sanitizeEscapeVelocityOptions(config.escapeVelocity),
      };
    },
    async createGame() {
      if (this.hasBlockingValidationErrors) {
        return;
      }
      const newGameConfig = await this.serializeSettings();

      if (newGameConfig === undefined) {
        return;
      }
      createGameSettingsStorage.saveSettings(newGameConfig);
      const onSuccess = (json: any) => {
        if (json.players.length === 1) {
          window.location.href = 'player?id=' + json.players[0].id;
          return;
        } else {
          window.history.replaceState(json, `${constants.APP_NAME} - Game`, 'game?id=' + json.id);
          vueRoot(this).game = json;
          vueRoot(this).screen = 'game-home';
        }
      };

      fetch(paths.API_CREATEGAME, {'method': 'POST', 'body': JSON.stringify({...newGameConfig, boardSeed: this.boardSeed}), 'headers': {'Content-Type': 'application/json'}})
        .then((response) => response.text())
        .then((text) => {
          try {
            const json = JSON.parse(text);
            onSuccess(json);
          } catch (err) {
            throw new Error(text);
          }
        })
        .catch((error: Error) => {
          alert(error.message);
        });
    },
  },
});

</script>
