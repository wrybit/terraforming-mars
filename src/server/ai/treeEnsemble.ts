// Evaluates gradient-boosted trees exported from LightGBM by the private test system (one shared format for
// all learned models: position value, draft/buy/play policies).
// Per tree: split feature f, threshold t, left/right child l/r (child < 0 = leaf -(index + 1)), leaf values v.
// Categorical splits (card identity) carry the categories that go left in c[node]; numeric splits have 0 there.

export type Tree = {f: Array<number>, t: Array<number>, l: Array<number>, r: Array<number>, v: Array<number>, c?: Array<Array<number> | 0>};

/** Sum of the leaf values the feature vector reaches (LightGBM's raw score). */
export function treeScore(trees: ReadonlyArray<Tree>, features: ReadonlyArray<number>): number {
  let total = 0;
  for (const tree of trees) {
    let node = 0;
    while (node >= 0) {
      const categories = tree.c?.[node];
      const value = features[tree.f[node]];
      const left = categories ? categories.includes(value) : value <= tree.t[node];
      node = left ? tree.l[node] : tree.r[node];
    }
    total += tree.v[-node - 1];
  }
  return total;
}
