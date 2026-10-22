// Selection logic of the card list filter groups.
// The model stores "included" per option (all true = no filter) – so the URL format stays unchanged.
// In the UI this means: no option checked = everything visible; the first click narrows down to that option,
// further clicks add or remove options. If the last checked option is unchecked, everything is visible again.

export type Selection<K extends string> = Record<K, boolean>;

// True if nothing is restricted in this group
export function isUnfiltered<K extends string>(selection: Selection<K>, keys: ReadonlyArray<K>): boolean {
  return keys.every((key) => selection[key] === true);
}

// Checked = selected, as long as the group restricts at all
export function isMarked<K extends string>(selection: Selection<K>, keys: ReadonlyArray<K>, key: K): boolean {
  return selection[key] === true && !isUnfiltered(selection, keys);
}

export function markedOptions<K extends string>(selection: Selection<K>, keys: ReadonlyArray<K>): Array<K> {
  return isUnfiltered(selection, keys) ? [] : keys.filter((key) => selection[key] === true);
}

export function resetOptions<K extends string>(selection: Selection<K>, keys: ReadonlyArray<K>): void {
  keys.forEach((key) => selection[key] = true);
}

export function toggleOption<K extends string>(selection: Selection<K>, keys: ReadonlyArray<K>, key: K): void {
  if (isUnfiltered(selection, keys)) {
    keys.forEach((other) => selection[other] = other === key);
    return;
  }
  selection[key] = !selection[key];
  // Nothing checked would mean "nothing visible" – but "no filter" is what is meant
  if (keys.every((other) => selection[other] !== true)) {
    resetOptions(selection, keys);
  }
}

/**
 * A group's selection carried over to another set of options (card list: Mars ⇄ Dune). Options of both sets keep
 * their state, options of only one set count as not checked. If the group was not restricted, or nothing of the new
 * set stays checked (only options of the other world were), the new set starts with `unfiltered`.
 */
export function carrySelection<K extends string>(selection: Selection<K>, from: ReadonlyArray<K>, to: ReadonlyArray<K>,
  unfiltered: Selection<K>): Selection<K> {
  if (isUnfiltered(selection, from)) {
    return {...unfiltered};
  }
  const carried = Object.fromEntries((Object.keys(selection) as Array<K>)
    .map((key) => [key, selection[key] === true && from.includes(key) && to.includes(key)])) as Selection<K>;
  return to.some((key) => carried[key]) ? carried : {...unfiltered};
}
