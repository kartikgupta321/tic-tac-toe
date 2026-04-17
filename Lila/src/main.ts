function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  initializer.registerRpc(
    "find_match_js",
    rpcFindMatch
  );

  initializer.registerMatch(
    "tic-tac-toe_js",
    {
      matchInit,
      matchJoinAttempt,
      matchJoin,
      matchLeave,
      matchLoop,
      matchTerminate,
      matchSignal
    }
  );
  try {
    nk.leaderboardCreate(
      "tic_tac_toe_wins", // leaderboard id
      true,   // authoritative
      nkruntime.SortOrder.DESCENDING, // sort order
      nkruntime.Operator.INCREMENTAL, // operator
      null, // reset schedule
      {} // metadata
    );

    logger.info("leaderboard created");

  } catch (error) {

    logger.info(
      "leaderboard already exists"
    );

  }
  initializer.registerRpc(
    "get_leaderboard",
    rpcGetLeaderboard
  );
}