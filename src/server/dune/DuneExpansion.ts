import {IGame} from '../IGame';
import {DUNE_ACTIONS_TITLE} from '../../common/dune/duneActionTitles';
import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {Random} from '../../common/utils/Random';
import {DuneModule} from '../../common/dune/DuneModule';
import {DuneModel} from '../../common/dune/DuneModel';
import {Arrakis61Board} from '../boards/Arrakis61Board';
import {ARRAKIS_LAYOUT, ArrakisLayout, arrakisLayout} from '../../common/dune/arrakisLayout';
import {VictoryPointsBreakdownBuilder} from '../game/VictoryPointsBreakdownBuilder';
import {BazaarData, bazaarModel, bazaarTabActions, buyInput, initializeBazaar, slideAndRefill} from './Bazaar';
import {WormData, distanceInput, rollWorm, wormChooser, wormModel, wormStart} from './Worm';
import {levyInput} from './WormLevy';
import {KanlyData, initializeKanly, kanlyActions, kanlyModel, resolveBattle} from './Kanly';
import {SmugglingData, chargeSuspicion, closeExchange, initializeSmuggling, openExchange, smugglingModel} from './Smuggling';
import {ChoamData, choamModel, initializeChoam, returnOffers} from './Choam';
import {choamExchangeActions, choamExchangeTabActions, choamParts} from './ChoamExchange';
import {SchemesData, initializeSchemes, reductionStep, schemesModel, scoringAgenda} from './Schemes';
import {Phase} from '../../common/Phase';

// Dune expansion (common/dune/DuneModule.ts): the state of the modules of a game and their hooks into the
// game flow. Game.ts and Player.ts only call in here, so upstream merges touch few lines there.

export type DuneData = {
  bazaar?: BazaarData,
  worm?: WormData,
  kanly?: KanlyData,
  smuggling?: SmugglingData,
  choam?: ChoamData,
  schemes?: SchemesData,
  /** Index of the end-of-generation step that waits for a player; undefined outside that phase */
  generationEndStep?: number,
};

/** Continuations into Game, whose methods are private */
export type DuneResume = {
  startActions: () => void,
  afterProduction: () => void,
};

/** One step at the end of a generation; calls `next` when done (possibly after a player's answer) */
type GenerationEndStep = (game: IGame, data: DuneData, next: () => void) => void;

// Order at the end of a generation: the battle first (its tile may then meet the worm), then the worm, the schemes
// (TR is final now), then CHOAM: the envy, new rates with the prophecies and a new privilege, and finally the offers
// nobody took
const GENERATION_END_STEPS: ReadonlyArray<GenerationEndStep> = [
  (game, data, next) => {
    if (data.kanly !== undefined) {
      resolveBattle(game, data.kanly);
    }
    next();
  },
  wormStep,
  (game, data, next) => (data.schemes === undefined ? next() : reductionStep(game, data.schemes, next)),
  (game, data, next) => {
    const parts = choamParts(data);
    if (parts !== undefined) {
      chargeSuspicion(game, parts.smuggling);
      // New rates, prophecies and the new privilege follow at the start of the next generation (beforeActionPhase)
      closeExchange(game, parts.smuggling);
      returnOffers(game, parts.choam);
    }
    next();
  },
];

function wormStep(game: IGame, data: DuneData, next: () => void): void {
  const worm = data.worm;
  if (worm === undefined) {
    next();
    return;
  }
  // Saved while players still paid levies of the move: only those are left
  if (worm.levies !== undefined) {
    askLevies(game, worm, next);
    return;
  }
  if (worm.chooser === undefined) {
    rollWorm(game, worm);
    worm.chooser = worm.thumper ?? wormChooser(game).id;
  }
  const chooser = game.getPlayerById(worm.chooser as IPlayer['id']);
  game.save();
  chooser.setWaitingFor(distanceInput(game, worm), () => game.drainQueue(() => askLevies(game, worm, next)));
}

/** Players who could not pay a levy in kind choose, one after another, what they give instead */
function askLevies(game: IGame, worm: WormData, next: () => void): void {
  const levy = worm.levies?.[0];
  if (levy === undefined) {
    worm.levies = undefined;
    next();
    return;
  }
  const player = game.getPlayerById(levy.player);
  game.save();
  player.setWaitingFor(levyInput(player, levy), () => {
    worm.levies?.shift();
    askLevies(game, worm, next);
  });
}

export class DuneExpansion {
  public static initialize(modules: ReadonlyArray<DuneModule> | undefined, players: ReadonlyArray<IPlayer>, rng: Random,
    layout: ArrakisLayout = ARRAKIS_LAYOUT): DuneData | undefined {
    if (modules === undefined || modules.length === 0) {
      return undefined;
    }
    const data: DuneData = {};
    if (modules.includes('bazaar')) {
      data.bazaar = initializeBazaar(rng, players.length);
    }
    if (modules.includes('worm')) {
      data.worm = {spaceId: wormStart(rng, layout), path: []};
    }
    if (modules.includes('kanly')) {
      data.kanly = initializeKanly();
    }
    // CHOAM: smuggling and the CHOAM contracts are one module now (Jens 24 Oct 2026); the old id 'smuggling' of
    // saved settings switches on the whole module too
    if (modules.includes('choam') || modules.includes('smuggling')) {
      data.smuggling = initializeSmuggling(rng);
      data.choam = initializeChoam();
    }
    if (modules.includes('schemes')) {
      data.schemes = initializeSchemes(players, rng);
    }
    return data;
  }

  /** After creating or loading a game: tell the board where the worm lies (nothing may be placed there) */
  public static attach(game: IGame): void {
    if (game.board instanceof Arrakis61Board) {
      game.board.wormSpaceId = game.duneData?.worm?.spaceId;
      game.board.warFieldSpaceId = game.duneData?.kanly?.battle?.spaceId;
    }
  }

  /** Between research and the first action of a generation: the bazaar lays out new wares (in generation 1 the start
   *  wares already lie out). `then` starts the action phase. */
  public static beforeActionPhase(game: IGame, then: () => void): void {
    const data = game.duneData;
    const bazaar = data?.bazaar;
    // No line "the bazaar opens": it tells nothing the bazaar tab does not show (Jens 25 Oct 2026)
    if (bazaar !== undefined && game.generation > 1) {
      slideAndRefill(bazaar, game.rng);
    }
    if (bazaar !== undefined) {
      bazaar.bought = [];
    }
    // CHOAM: the guild's new rates, the prophecies and the emperor's wish, in the log of the new generation
    const parts = data === undefined ? undefined : choamParts(data);
    if (parts !== undefined) {
      openExchange(game, parts.smuggling);
    }
    then();
  }

  /** After production: the end-of-generation steps of the modules, one after another. Then `then`. */
  public static endOfGeneration(game: IGame, then: () => void): void {
    const data = game.duneData;
    if (data === undefined) {
      then();
      return;
    }
    DuneExpansion.runGenerationEnd(game, data, data.generationEndStep ?? 0, then);
  }

  private static runGenerationEnd(game: IGame, data: DuneData, index: number, then: () => void): void {
    if (index >= GENERATION_END_STEPS.length) {
      data.generationEndStep = undefined;
      DuneExpansion.attach(game);
      then();
      return;
    }
    data.generationEndStep = index;
    GENERATION_END_STEPS[index](game, data, () => {
      DuneExpansion.attach(game);
      DuneExpansion.runGenerationEnd(game, data, index + 1, then);
    });
  }

  /** After loading a game saved while a module waited for a player: ask again. False when nothing waits. */
  public static resume(game: IGame, continuation: DuneResume): boolean {
    const data = game.duneData;
    if (data === undefined) {
      return false;
    }
    if (data.generationEndStep !== undefined) {
      DuneExpansion.runGenerationEnd(game, data, data.generationEndStep, continuation.afterProduction);
      return true;
    }
    const bazaar = data.bazaar;
    if (bazaar !== undefined && bazaar.buyers.length > 0) {
      DuneExpansion.nextBuyer(game, bazaar, continuation.startActions);
      return true;
    }
    return false;
  }

  private static nextBuyer(game: IGame, bazaar: BazaarData, then: () => void): void {
    while (bazaar.buyers.length > 0) {
      const player = game.getPlayerById(bazaar.buyers[0]);
      const input = buyInput(player, bazaar);
      if (input === undefined) {
        if (bazaar.slots.some((ware) => ware !== null)) {
          game.log('${0} cannot afford a ware at the bazaar', (b) => b.player(player));
        }
        bazaar.buyers.shift();
        continue;
      }
      game.activePlayer = player;
      // Saved with the buyers still to come: a restart asks this player again (resume)
      game.save();
      player.setWaitingFor(input, () => {
        game.drainQueue(() => {
          bazaar.buyers.shift();
          DuneExpansion.nextBuyer(game, bazaar, then);
        });
      });
      return;
    }
    then();
  }

  /** Actions of the modules in the action menu, grouped in one choice; undefined when none is possible now */
  public static actions(player: IPlayer): PlayerInput | undefined {
    const data = player.game.duneData;
    if (data === undefined) {
      return undefined;
    }
    const options: Array<PlayerInput> = [
      ...(data.kanly === undefined ? [] : kanlyActions(player, data.kanly)),
      ...choamExchangeActions(player, data),
    ];
    if (options.length === 0) {
      return undefined;
    }
    return new OrOptions(...options).setTitle(DUNE_ACTIONS_TITLE);
  }

  /**
   * Module actions that need room for their input – CHOAM offer, smuggling, buying a bazaar ware – as options of their
   * own in the action menu, so the client shows each as an action tab (Jens, 19 Oct 2026)
   */
  public static tabActions(player: IPlayer): Array<PlayerInput> {
    const data = player.game.duneData;
    if (data === undefined) {
      return [];
    }
    return [
      ...choamExchangeTabActions(player, data),
      ...(data.bazaar === undefined ? [] : bazaarTabActions(player, data.bazaar)),
    ];
  }

  /** Game end, before the final scoring: which agenda each player fulfils (House schemes), now no secret any more */
  public static logEndOfGame(game: IGame): void {
    const schemes = game.duneData?.schemes;
    if (schemes === undefined) {
      return;
    }
    for (const player of game.players) {
      const agenda = scoringAgenda(player, schemes);
      if (agenda !== undefined) {
        game.log('${0} fulfils the agenda ${1}: ${2} VP', (b) => b.player(player).string(agenda.agenda).number(agenda.victoryPoint));
      }
    }
  }

  /** Victory points of the modules (House schemes): an own column; the agenda is named only at game end, it is secret before */
  public static calculateVictoryPoints(player: IPlayer, builder: VictoryPointsBreakdownBuilder): void {
    const schemes = player.game.duneData?.schemes;
    if (schemes === undefined) {
      return;
    }
    const agenda = scoringAgenda(player, schemes);
    if (agenda !== undefined) {
      builder.setSchemePoints(agenda.victoryPoint, player.game.phase === Phase.END ? agenda : undefined);
    }
  }

  public static model(game: IGame, viewer?: IPlayer): DuneModel | undefined {
    const data = game.duneData;
    if (data === undefined) {
      return undefined;
    }
    // A game with only one of the two former halves of CHOAM shows the whole module (no random numbers drawn)
    choamParts(data);
    return {
      board: arrakisLayout(game.gameOptions.boardName).board,
      bazaar: data.bazaar === undefined ? undefined : bazaarModel(game, data.bazaar, viewer),
      worm: data.worm === undefined ? undefined : wormModel(game, data.worm),
      kanly: data.kanly === undefined ? undefined : kanlyModel(game, data.kanly),
      smuggling: data.smuggling === undefined ? undefined : smugglingModel(game, data.smuggling, viewer),
      choam: data.choam === undefined ? undefined : choamModel(game, data.choam),
      schemes: data.schemes === undefined ? undefined : schemesModel(game, data.schemes, viewer),
    };
  }
}
