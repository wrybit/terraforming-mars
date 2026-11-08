import {PlayerNameStats} from './playerNameStats';

/** Proposed merge: the name with fewer games goes into the one with more. */
export type MergeSuggestion = {from: string, to: string};

// Letters only, lower case: "Jens H." and "jens" both become "jensh"/"jens"
function letters(name: string): string {
  return name.toLowerCase().replace(/[^\p{L}]/gu, '');
}

// Same letters, or one starts with the other – but only from four letters on, else "Tom" would match "Tobias"
function isSimilar(first: string, second: string): boolean {
  const a = letters(first);
  const b = letters(second);
  if (a === '' || b === '') {
    return false;
  }
  return a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));
}

/** Likely duplicates among the names (sorted by games, most first); every name is proposed at most once as "from". */
export function similarPlayerNames(players: ReadonlyArray<PlayerNameStats>, limit: number = 5): Array<MergeSuggestion> {
  const suggestions: Array<MergeSuggestion> = [];
  const sorted = [...players].sort((first, second) => second.games - first.games);
  sorted.forEach((source, index) => {
    const target = sorted.slice(0, index).find((candidate) => isSimilar(candidate.name, source.name));
    if (target !== undefined) {
      suggestions.push({from: source.name, to: target.name});
    }
  });
  return suggestions.slice(0, limit);
}
