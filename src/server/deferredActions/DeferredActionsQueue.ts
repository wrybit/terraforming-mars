import {IDeferredAction} from './DeferredAction';
import {GiveColonyBonus} from './GiveColonyBonus';
import {IPlayer} from '../IPlayer';
import {CardName} from '../../common/cards/CardName';

export class DeferredActionsQueue {
  private insertId: number = 0;
  private queue: Array<IDeferredAction<any>> = [];
  // Card whose effect is currently running (playing it, card action, executing one of its actions).
  // Everything queued in the meantime remembers it, and inputs arising from that carry it
  // to the client (PlayerInput.sourceCard), so card name and text appear there instead of "Select one option".
  private currentSourceCard: CardName | undefined = undefined;

  get length(): number {
    return this.queue.length;
  }

  public push(action: IDeferredAction<any>): void {
    action.queueId = this.insertId++;
    action.sourceCard ??= this.currentSourceCard;
    this.queue.push(action);
  }

  public runAllFor(player: IPlayer, cb: () => void): void {
    let b: IDeferredAction | undefined;
    let j = -1;
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const a = this.queue[i];
      if (a.player.id === player.id && (b === undefined || this.hasHigherPriority(a, b))) {
        b = a;
        j = i;
      }
    }
    if (b === undefined) {
      cb();
      return;
    }
    this.queue.splice(j, 1);
    this.run(b, () => this.runAllFor(player, cb));
  }

  // Runs fn in the context of a card; without a card the outer context remains
  public withSourceCard<T>(card: CardName | undefined, fn: () => T): T {
    if (card === undefined) {
      return fn();
    }
    const previous = this.currentSourceCard;
    this.currentSourceCard = card;
    try {
      return fn();
    } finally {
      this.currentSourceCard = previous;
    }
  }

  private hasHigherPriority(a: IDeferredAction, b: IDeferredAction) {
    return a.priority < b.priority || (a.priority === b.priority && a.queueId < b.queueId);
  }

  private nextItemIndex(): number {
    if (this.queue.length === 0) {
      return -1;
    }
    let b = this.queue[0];
    let j = 0;
    for (let i = this.queue.length - 1; i >= 1; i--) {
      const a = this.queue[i];
      if (this.hasHigherPriority(a, b)) {
        b = a;
        j = i;
      }
    }
    return j;
  }

  private popNextItem(): IDeferredAction<any> | undefined {
    const next = this.nextItemIndex();
    const action = this.queue[next];
    if (action !== undefined) {
      this.queue.splice(next, 1);
    }
    return action;
  }

  public runAll(cb: () => void): void {
    const action = this.popNextItem();
    if (action !== undefined) {
      this.run(action, () => {
        this.runAll(cb);
      });
    } else {
      cb();
      return;
    }
  }

  // The following methods are used in tests
  public peek(): IDeferredAction<any> | undefined {
    return this.queue[this.nextItemIndex()];
  }

  public pop(): IDeferredAction<any> | undefined {
    return this.queue.splice(this.nextItemIndex(), 1)[0];
  }

  public run(action: IDeferredAction, cb: () => void): void {
    // Special hook for trade bonus deferred actions
    // So that they happen for all players at the same time
    if (action instanceof GiveColonyBonus) {
      action.andThen(cb);
      action.execute();
      return;
    }

    const input = this.withSourceCard(action.sourceCard, () => action.execute());
    if (input !== undefined) {
      input.sourceCard ??= action.sourceCard;
      action.player.setWaitingFor(input, cb);
    } else {
      cb();
    }
  }

  public runNext(): void {
    const action = this.pop();
    if (action !== undefined) {
      this.run(action, () => {});
    }
  }
}
