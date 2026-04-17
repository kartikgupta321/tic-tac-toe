interface LeaderboardResponse {
  records: {
    username: string;
    score: number;
    rank: number;
  }[];
}

let rpcGetLeaderboard: nkruntime.RpcFunction = function (
  ctx,
  logger,
  nk,
  payload
): string {

  logger.info(
    "fetching leaderboard for user %s",
    ctx.userId
  );

  const result =
    nk.leaderboardRecordsList(
      "tic_tac_toe_wins", // leaderboard id
      undefined,               // ownerIds (null = top players)
      20,                 // limit
      "",                 // cursor
      0                   // expiry
    );

  const records =
    (result.records || []).map(r => ({
      username:
        r.username || "unknown",
      score:
        r.score,
      rank:
        r.rank
    }));

  const response: LeaderboardResponse = {
    records
  };

  logger.info(
    "leaderboard result %v",
    records
  );

  return JSON.stringify(response);
};