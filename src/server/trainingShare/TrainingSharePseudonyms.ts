import * as crypto from 'crypto';

/**
 * Replacements for one exported game. The game, player and spectator ids are the keys to the seats of a game:
 * they are always replaced, anonymous or not, by a keyed hash (same id → same pseudonym, but not reversible
 * without this server's key). With `anonymous` the names of human players become "Player 1", "Player 2", ...
 */
export class TrainingSharePseudonyms {
  private readonly replacements = new Map<string, string>();
  /** Ids also inside longer texts (links, log lines): they are long and random, so they never match by chance */
  private readonly ids: Array<[string, string]> = [];
  private readonly gamePseudonym: string;

  public constructor(private readonly secret: string, game: {id: string, spectatorId?: string, players: ReadonlyArray<{id: string, name: string, isHuman: boolean}>}, anonymous: boolean) {
    this.gamePseudonym = this.pseudonym(game.id);
    this.addId(game.id, this.gamePseudonym);
    if (game.spectatorId !== undefined) {
      this.addId(game.spectatorId, this.pseudonym(game.spectatorId));
    }
    game.players.forEach((player, index) => {
      this.addId(player.id, this.pseudonym(player.id));
      // Names of AI players are made by the server ("Bot [AI+]"), they tell nothing about a person
      if (anonymous && player.isHuman && player.name.length > 0) {
        this.replacements.set(player.name, `Player ${index + 1}`);
      }
    });
  }

  private addId(id: string, pseudonym: string): void {
    this.replacements.set(id, pseudonym);
    this.ids.push([id, pseudonym]);
  }

  public get exportedGameId(): string {
    return this.gamePseudonym;
  }

  /** "g", "p" or "s" (as the original) and 12 hex digits, like the ids of the game itself */
  private pseudonym(id: string): string {
    const prefix = /^[gps]/.test(id) ? id[0] : 'x';
    return prefix + crypto.createHmac('sha256', this.secret).update(id).digest('hex').slice(0, 12);
  }

  /** Whole strings that are an id or a name; ids inside longer texts (decision ids "<gameId>:<n>", links) as well. */
  public replace(text: string): string {
    const replacement = this.replacements.get(text);
    if (replacement !== undefined) {
      return replacement;
    }
    let result = text;
    for (const [id, pseudonym] of this.ids) {
      if (result.includes(id)) {
        result = result.split(id).join(pseudonym);
      }
    }
    return result;
  }
}
