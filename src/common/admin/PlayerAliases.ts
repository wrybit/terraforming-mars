// Contract between the admin page "Players" (client) and its API (server): both sides read and write exactly this shape.

/** A name in the statistics that counts as another one: "from" is shown and counted as "to". */
export type PlayerAlias = {
  from: string;
  to: string;
  createdTimeMs: number;
};

export type AdminPlayerAliasesInfo = {
  aliases: Array<PlayerAlias>;
};

export type AdminPlayerAliasRequest =
  {action: 'merge', from: string, to: string} |
  {action: 'unmerge', from: string};
