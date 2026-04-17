interface RpcFindMatchResponse {
  matchIds: string[];
}

let rpcFindMatch: nkruntime.RpcFunction = function (
  ctx,
  logger,
  nk,
  payload
): string {
  logger.info("rpcFindMatch called by user %s", ctx.userId);
  if (!ctx.userId) {
    throw Error("user id missing");
  }
  
  // find open matches
  let matches: nkruntime.Match[] =
    nk.matchList(
      10,   // max matches
      true, // authoritative matches only
      null,
      null,
      1     // only matches with 1 player
    );

  let matchIds: string[] = [];

  if (matches.length > 0 && matches[0].size > 0) {
    // join existing match
    matchIds =
      matches.map(m => m.matchId);

  } else {
    // create new match
    const matchId =
      nk.matchCreate(
        "tic-tac-toe_js",
        {}
      );
    matchIds.push(matchId);
  }

  const response: RpcFindMatchResponse = {
    matchIds,
  };
  return JSON.stringify(response);
};