import {IGame} from '../IGame';
import {Random} from '../../common/utils/Random';
import {DuneModule} from '../../common/dune/DuneModule';
import {DuneModel} from '../../common/dune/DuneModel';
import {BazaarData, bazaarModel, buyInput, buyingOrder, initializeBazaar, slideAndRefill} from './Bazaar';

// Dune expansion (common/dune/DuneModule.ts): the state of the modules of a game and their hooks into the
// game flow. Game.ts only calls in here, so upstream merges touch few lines there.

export type DuneData = {
  bazaar?: BazaarData,
};

export class DuneExpansion {
  public static initialize(modules: ReadonlyArray<DuneModule> | undefined, rng: Random): DuneData | undefined {
    if (modules === undefined || modules.length === 0) {
      return undefined;
    }
    const data: DuneData = {};
    if (modules.includes('bazaar')) {
      data.bazaar = initializeBazaar(rng);
    }
    return data;
  }

  /** Between research and the first action of a generation: the bazaar phase. `then` starts the action phase. */
  public static beforeActionPhase(game: IGame, then: () => void): void {
    const bazaar = game.duneData?.bazaar;
    if (bazaar === undefined) {
      then();
      return;
    }
    slideAndRefill(bazaar, game.players.length, game.rng);
    if (bazaar.slots.every((ware) => ware === null)) {
      then();
      return;
    }
    game.log('The bazaar of Arrakeen opens');
    bazaar.buyers = buyingOrder(game).map((player) => player.id);
    DuneExpansion.nextBuyer(game, bazaar, then);
  }

  /** After loading a game saved during the bazaar phase: ask the next buyer again. False when none is waiting. */
  public static resume(game: IGame, then: () => void): boolean {
    const bazaar = game.duneData?.bazaar;
    if (bazaar === undefined || bazaar.buyers.length === 0) {
      return false;
    }
    DuneExpansion.nextBuyer(game, bazaar, then);
    return true;
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

  public static model(game: IGame): DuneModel | undefined {
    const data = game.duneData;
    if (data === undefined) {
      return undefined;
    }
    return {
      bazaar: data.bazaar === undefined ? undefined : bazaarModel(game, data.bazaar),
    };
  }
}
