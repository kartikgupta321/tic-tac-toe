"use strict";
var rpcGetLeaderboard = function (ctx, logger, nk, payload) {
    logger.info("fetching leaderboard for user %s", ctx.userId);
    var result = nk.leaderboardRecordsList("tic_tac_toe_wins", // leaderboard id
    undefined, // ownerIds (null = top players)
    20, // limit
    "", // cursor
    0 // expiry
    );
    var records = (result.records || []).map(function (r) { return ({
        username: r.username || "unknown",
        score: r.score,
        rank: r.rank
    }); });
    var response = {
        records: records
    };
    logger.info("leaderboard result %v", records);
    return JSON.stringify(response);
};
function InitModule(ctx, logger, nk, initializer) {
    initializer.registerRpc("find_match_js", rpcFindMatch);
    initializer.registerMatch("tic-tac-toe_js", {
        matchInit: matchInit,
        matchJoinAttempt: matchJoinAttempt,
        matchJoin: matchJoin,
        matchLeave: matchLeave,
        matchLoop: matchLoop,
        matchTerminate: matchTerminate,
        matchSignal: matchSignal
    });
    try {
        nk.leaderboardCreate("tic_tac_toe_wins", // leaderboard id
        true, // authoritative
        "descending" /* nkruntime.SortOrder.DESCENDING */, // sort order
        "increment" /* nkruntime.Operator.INCREMENTAL */, // operator
        null, // reset schedule
        {} // metadata
        );
        logger.info("leaderboard created");
    }
    catch (error) {
        logger.info("leaderboard already exists");
    }
    initializer.registerRpc("get_leaderboard", rpcGetLeaderboard);
}
var moduleName = "tic-tac-toe_js";
var tickRate = 1;
var winningPositions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];
var OpCode;
(function (OpCode) {
    OpCode[OpCode["START"] = 1] = "START";
    OpCode[OpCode["UPDATE"] = 2] = "UPDATE";
    OpCode[OpCode["DONE"] = 3] = "DONE";
    OpCode[OpCode["MOVE"] = 4] = "MOVE";
})(OpCode || (OpCode = {}));
var Mark;
(function (Mark) {
    Mark["X"] = "X";
    Mark["O"] = "O";
})(Mark || (Mark = {}));
var matchInit = function (ctx, logger, nk, params) {
    logger.info("matchInit called", ctx.userId);
    var state = {
        board: [null, null, null, null, null, null, null, null, null],
        players: {},
        currentTurn: Mark.X,
        winner: null,
        started: false,
    };
    logger.info("match initialized");
    return {
        state: state,
        tickRate: tickRate,
        label: "tic-tac-toe",
    };
};
var matchJoinAttempt = function (ctx, logger, nk, dispatcher, tick, state, presence) {
    logger.info("join attempt user %s", presence.userId);
    var playerCount = Object.keys(state.players).length;
    if (playerCount >= 2) {
        return {
            state: state,
            accept: false,
            rejectMessage: "match full",
        };
    }
    if (state.started && playerCount === 0) {
        return {
            state: state,
            accept: false,
            rejectMessage: "match already ended",
        };
    }
    return {
        state: state,
        accept: true,
    };
};
var matchJoin = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    logger.info("players now: %v", state.players);
    presences.forEach(function (p) {
        if (Object.keys(state.players).length === 0) {
            state.players[p.userId] = { mark: Mark.X, username: p.username };
        }
        else {
            state.players[p.userId] = { mark: Mark.O, username: p.username };
        }
    });
    if (Object.keys(state.players).length === 2) {
        state.started = true;
        dispatcher.broadcastMessage(OpCode.START, JSON.stringify({
            board: state.board,
            currentTurn: state.currentTurn,
            players: state.players,
        }));
    }
    return { state: state };
};
var matchLoop = function (ctx, logger, nk, dispatcher, tick, state, messages) {
    messages.forEach(function (message) {
        logger.info("move received from %s", message.sender.userId);
        if (message.opCode !== OpCode.MOVE) {
            return;
        }
        var player = state.players[message.sender.userId];
        if (!player) {
            return;
        }
        var playerMark = player.mark;
        if (playerMark !== state.currentTurn) {
            return;
        }
        var data = JSON.parse(nk.binaryToString(message.data));
        var position = data.position;
        if (state.board[position] !== null ||
            state.winner !== null) {
            return;
        }
        state.board[position] = playerMark;
        var winner = checkWinner(state.board);
        if (winner) {
            logger.info("winner is %v", winner);
            state.winner = winner;
            dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify({
                board: state.board,
                winner: winner,
            }));
            var winnerUserId = Object.keys(state.players)
                .find(function (id) {
                return state.players[id].mark === winner;
            });
            if (winnerUserId) {
                nk.leaderboardRecordWrite("tic_tac_toe_wins", winnerUserId, state.players[winnerUserId].username, 1);
                logger.info("win recorded for %s", winnerUserId);
            }
            return {
                state: state,
                terminate: true
            };
        }
        state.currentTurn =
            playerMark === Mark.X
                ? Mark.O
                : Mark.X;
        dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify({
            board: state.board,
            currentTurn: state.currentTurn,
        }));
    });
    return { state: state };
};
var matchLeave = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    presences.forEach(function (p) {
        delete state.players[p.userId];
    });
    logger.info("players now %v", state.players);
    if (Object.keys(state.players).length === 0) {
        logger.info("terminating match because empty");
        return {
            state: state,
            terminate: true
        };
    }
    return { state: state };
};
var matchTerminate = function (ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
    logger.info("match terminated");
    return { state: state };
};
var matchSignal = function (ctx, logger, nk, dispatcher, tick, state, data) {
    return { state: state };
};
function checkWinner(board) {
    for (var _i = 0, winningPositions_1 = winningPositions; _i < winningPositions_1.length; _i++) {
        var pattern = winningPositions_1[_i];
        var a = pattern[0], b = pattern[1], c = pattern[2];
        if (board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}
var rpcFindMatch = function (ctx, logger, nk, payload) {
    logger.info("rpcFindMatch called by user %s", ctx.userId);
    if (!ctx.userId) {
        throw Error("user id missing");
    }
    // find open matches
    var matches = nk.matchList(10, // max matches
    true, // authoritative matches only
    null, null, 1 // only matches with 1 player
    );
    var matchIds = [];
    if (matches.length > 0 && matches[0].size > 0) {
        // join existing match
        matchIds =
            matches.map(function (m) { return m.matchId; });
    }
    else {
        // create new match
        var matchId = nk.matchCreate("tic-tac-toe_js", {});
        matchIds.push(matchId);
    }
    var response = {
        matchIds: matchIds,
    };
    return JSON.stringify(response);
};
